// Enligt laborationen är nedanstående kod 100% skriven av Claude Code direkt in i filen
// I tidigare labbar och allmänhet använder jag Claude Code för att läsa mina filer och bolla med. Generera clarity. 
// Jag gillar att skriva kod för hand, tycker det är terapeutiskt. Och sen ställa följdfrågor för att förstå. 
// Det är ganska sällan jag låter Claude Code skriva direkt in i filer men det är fallet här. Och man ser det
// direkt med hur mycket em dashes som används haha

import { z } from 'zod';

const API_KEY = process.env.POSTNORD_API_KEY ?? '';
const SERVICE_POINTS_URL =
  'https://atapi2.postnord.com/rest/businesslocation/v5/servicepoints/nearest/byaddress';
const TRANSIT_TIME_URL =
  'https://atapi2.postnord.com/rest/transport/v1/transittime/addresstoaddress';

if (!API_KEY) {
  console.warn('POSTNORD_API_KEY saknas i .env — fraktfunktioner inaktiverade');
}

// ---------------------------------------------------------------------------
// Zod-scheman – bara fälten vi använder från PostNords svar.
// Zod strippar extra fält som openingHours, coordinates, groupCode etc.
// Om PostNord ändrar strukturen på fälten vi *använder* får vi ett tydligt
// valideringsfel här istället för undefined i React.
// ---------------------------------------------------------------------------

// Service Points V5 – response shape (docs: service-points.txt rad 449+)
const VisitingAddressSchema = z.object({
  streetName: z.string(),
  streetNumber: z.string(),
  city: z.string(),
});

const ServicePointSchema = z.object({
  servicePointId: z.string(),
  name: z.string(),
  visitingAddress: VisitingAddressSchema,
});

const ServicePointsResponseSchema = z.object({
  servicePointInformationResponse: z.object({
    servicePoints: z.array(ServicePointSchema),
  }),
});

// Transit Time V1 – response shape (docs: transit-times.txt rad 1670+)
// Varje entry har ANTINGEN timeOfArrival ELLER dayRangeOfArrival
const TransitTimeEntrySchema = z.object({
  timeOfArrival: z.string().optional(),
  dayRangeOfArrival: z
    .object({
      daysMinimum: z.number(),
      daysMaximum: z.number(),
    })
    .optional(),
  serviceInformation: z.object({
    serviceCode: z.string(),
    name: z.string(),
  }),
});

// V1 svarar med en top-level array, inte ett wrappat objekt
const TransitTimeResponseSchema = z.array(TransitTimeEntrySchema);

// ---------------------------------------------------------------------------
// Våra modeller – vad resten av appen ser. Adaptern mappar PostNords format
// till dessa, precis som stripeAdapter och algoliaAdapter gör.
// ---------------------------------------------------------------------------

export type ServicePoint = {
  id: string;
  name: string;
  address: string;
};

export type DeliveryEstimate = {
  serviceCode: string;
  serviceName: string;
  estimatedDelivery: string;
};

// ---------------------------------------------------------------------------
// Hämta de 5 närmaste ombuden för ett postnummer
//
// Docs: Service Points V5, GET /v5/servicepoints/nearest/byaddress
// Sandbox: atapi2.postnord.com    Prod: api2.postnord.com
// ---------------------------------------------------------------------------

export async function findServicePoints(
  postalCode: string,
): Promise<ServicePoint[]> {
  const params = new URLSearchParams({
    apikey: API_KEY,
    returnType: 'json',
    countryCode: 'SE',
    postalCode,
    numberOfServicePoints: '5',
  });

  const response = await fetch(`${SERVICE_POINTS_URL}?${params}`, {
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) {
    throw new Error(`PostNord svarade ${response.status}`);
  }

  const json = await response.json();
  const parsed = ServicePointsResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(`Oväntat svar från PostNord: ${parsed.error.message}`);
  }

  return parsed.data.servicePointInformationResponse.servicePoints.map(
    (point) => ({
      id: point.servicePointId,
      name: point.name,
      address: `${point.visitingAddress.streetName} ${point.visitingAddress.streetNumber}, ${point.visitingAddress.city}`,
    }),
  );
}

// ---------------------------------------------------------------------------
// Hämta beräknad leveranstid från shoppens postnummer till kundens
//
// Docs: Transit Time V1 (Legacy), GET /v1/transittime/addresstoaddress
// Sandbox: atapi2.postnord.com    Prod: api2.postnord.com
//
// Parametrar verifierade mot Swagger (transit-times.txt):
//   - startTime  (INTE dateOfDeparture som AI först gissade)
//   - originPostCode / destinationPostCode  (V1-namn, V2 använder originPostalCode)
//   - serviceCodes  (plural, kommaseparerad – INTE serviceCode singular)
//
// serviceCodes=19 → MyPack Collect (ombud). 17 → MyPack Home. 18 → Parcel.
// Vi filtrerar på 19 för att få leveranstid till ombud.
// ---------------------------------------------------------------------------

export async function getDeliveryTime(
  fromPostalCode: string,
  toPostalCode: string,
): Promise<DeliveryEstimate | null> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const startTime = `${year}-${month}-${day}T08:00`;

  const params = new URLSearchParams({
    apikey: API_KEY,
    startTime,
    originPostCode: fromPostalCode,
    originCountryCode: 'SE',
    destinationPostCode: toPostalCode,
    destinationCountryCode: 'SE',
    serviceCodes: '19',
  });

  const response = await fetch(`${TRANSIT_TIME_URL}?${params}`, {
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) {
    throw new Error(`PostNord Transit Time svarade ${response.status}`);
  }

  const json = await response.json();
  const parsed = TransitTimeResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(
      `Oväntat svar från PostNord Transit Time: ${parsed.error.message}`,
    );
  }

  // V1 kan svara med tom array om ingen rutt hittades
  if (parsed.data.length === 0) {
    return null;
  }

  const entry = parsed.data[0];

  let estimatedDelivery: string;

  if (entry.timeOfArrival) {
    // Exakt ankomsttid → formatera som "tisdag 5/11"
    const arrival = new Date(entry.timeOfArrival);
    const weekday = arrival.toLocaleDateString('sv-SE', { weekday: 'long' });
    const arrivalDay = arrival.getDate();
    const arrivalMonth = arrival.getMonth() + 1;
    estimatedDelivery = `${weekday} ${arrivalDay}/${arrivalMonth}`;
  } else if (entry.dayRangeOfArrival) {
    // Inget exakt datum → intervall, t.ex. "3–4 arbetsdagar"
    estimatedDelivery = `${entry.dayRangeOfArrival.daysMinimum}–${entry.dayRangeOfArrival.daysMaximum} arbetsdagar`;
  } else {
    return null;
  }

  return {
    serviceCode: entry.serviceInformation.serviceCode,
    serviceName: entry.serviceInformation.name,
    estimatedDelivery,
  };
}