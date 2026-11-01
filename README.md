# Linkin Park E-shop

Originella GitHub classroom repot: https://github.com/Medieinstitutet/fsu25d-systemutveckling-uppgift-1-min-egna-e-handel-stevenlomon  
Det här är ett nytt repo för fortsatt utveckling på mitt eget initiativ först men sen visade det sig att vi ska fortsätta med våra e-handlar för vår nya kurs "FSU25D - Integration med 3-partssystem, 35 yhp" så all denna kod med fokus på 3e parts integration finns också i detta repo.

## Kom igång

Deployad shop: https://linkin-park-e-store.vercel.app/

### Starta lokalt
Detta projekt använder `pnpm` istället för `npm`:
```
git clone https://github.com/stevenlomon/linkin-park-e-shop.git
cd linkin-park-e-shop
pnpm install
cp .env.example .env
# Fyll i nycklarna i .env (se nedan)
pnpm dev
```
### Nycklar och testkonton
Se `.env.example` för vilka som behöver konfigurerar i `.env`. Kort om varje:

| Variabel                                                    | Var man får den                                      | Kommentar                                                                                                        |
| ----------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                              | Aiven (PostgreSQL)                                   | Connection string till databasen                                                                                 |
| `SUPPLIER_API_KEY`                                          | Kursens leverantörs-API                              | Nyckel för att importera produkter                                                                               |
| `ALGOLIA_APP_ID`, `ALGOLIA_ADMIN_KEY`, `ALGOLIA_SEARCH_KEY` | Algolia Dashboard                                    | Admin-nyckel stannar på servern, search-nyckel används i frontend                                                |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`                | Stripe Dashboard                                     | Använd `sk_test_`-nycklar. Webhook-secret fås via `stripe listen --forward-to localhost:3000/api/stripe/webhook` |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY`                       | Supabase Dashboard → Settings → API                  | `service_role`-nyckeln, inte `anon`-nyckeln                                                                      |
| `POSTNORD_API_KEY`                                          | PostNord Developer Portal (atdeveloper.postnord.com) | Sandbox-nyckel, gratis att skapa                                                                                 |

### Testa integrationerna lokalt

Stripe: Kör `stripe listen --forward-to localhost:3000/api/stripe/webhook` i en separat terminal för att ta emot webhooks lokalt. Använd testkort `4242 4242 4242 4242`.
PostNord: Sandbox-nyckeln fungerar direkt mot `atapi2.postnord.com`. Ange ett svenskt postnummer i kassan.
Leverantörsimport: Gå till `/admin/import` (kräver admin-konto).

## Reflektion över projektet (måste hållas till ca 400-800 ord)
**1. Integrationsmodell per tjänst**

Leverantörsimport använder REST + fil. Servern hämtar en CSV- eller XML-fil från leverantörens API och parse:ar den rad för rad. Filbaserad import passar här eftersom vi inte behöver realtidsuppdateringar och vi behöver hela datasetet på en gång. Att bygga ett eget leverantörssystem skulle kräva att vi själva underhåller produktkatalog, priser och lagerdata, vilket är information vi inte äger.

Algolia använder ett SDK (`algoliasearch`) som om jag förstår rätt under huven gör REST-anrop. SDK:t ger oss typsäkra metoder som `saveObject` och `deleteObject` istället för att vi bygger URL:er och headers själva. Att bygga egen fulltextsök kräver en sökmotor (t.ex. Elasticsearch eller Meilisearch), indexering, ranking, typo-tolerans och infrastruktur. Algolias free tier ger oss allt detta med ett SDK-anrop.

Stripe använder SDK + webhook + redirect. SDK:t (`stripe`) skapar Checkout Sessions server-side, kunden redirectas till Stripes hosted checkout-sida, och en webhook tar emot `checkout.session.completed`-eventet asynkront. Redirect-modellen innebär att vi aldrig hanterar kortdata. Att bygga eget betalningssystem kräver om jag förstår rätt PCI DSS-certifiering, bedrägeridetektering och stöd för Swish/Klarna/Apple Pay. Och här kan enbart certifieringen kostar hundratusentals kronor!!

Supabase Storage använder SDK (`@supabase/supabase-js`). Admin laddar upp en bild via React → Server → Supabase. Att serva bilder från egen server fungerar i liten skala (jag hade detta i början!), men utan ett dedikerat CDN blir det långsamt för användare långt bort och servern belastas av bildtrafik istället för API-anrop.

PostNord använder direkt REST utan SDK. Om jag förstår rätt har inte PostNord ett officiellt Node.js-SDK, så vi gör fetch-anrop mot deras API:er med Zod-validering av svaren. PostNord äger datan om 6000+ ombud i Sverige (t.ex. öppettider, adresser och leveranstider) som vi omöjligen skulle kunna samla in själva.

**2. Varför går anropen via servern?**

Alla externa anrop går genom Next.js API routes, inte direkt från React. Tre anledningar:

- **Hemligheter.** API-nycklar (STRIPE_SECRET_KEY, POSTNORD_API_KEY etc.) lever i `process.env` på servern. Om React anropade PostNord direkt skulle nyckeln synas i DevTools → Network.
- **Prisintegritet.** Servern beräknar fraktpris och produktpris från databasen. React skickar aldrig pris. Detta skulle möjliggöra att en kund ändrar priset i DevTools och betala fel summa via Stripe.
- **Validering.** Servern validerar t.ex. service point-ID mot PostNord innan ordern skapas. En "tampered request" med servicePointId: "FAKE-123" avvisas med ett tydligt felmeddelande.  

**3. Vad händer om en tjänst är nere?**

Varje integration hanterar fel utan att ta ner hela shoppen:

- Stripe nere → ordern sparas som unpaid och kan slutföras senare.
- Algolia nere → söksidan visar fel men produktlista, varukorg och checkout fungerar normalt via databasen.
- Supabase nere → bilduppladdning misslyckas, men befintliga bilder serveras från CDN-cache.
- PostNord nere → kunden tappar ombudsalternativet men kan fortfarande välja hemleverans och slutföra köpet.

**4. Risker med beroendet**

Stripe hanterar betalningar och därmed persondata (namn, e-post, kortuppgifter). Enligt GDPR är Stripe vårt personuppgiftsbiträde, dvs. om de ändrar villkor eller drabbas av en dataläcka är det vi som ansvarar mot kunden. Stripe tar tydligen dessutom 1,4% + 1,80 kr per transaktion, en kostnad som skalar med omsättningen. Ett prishopp kan vara svårt att migrera ifrån snabbt eftersom Stripe äger checkout-flödet och webhook-infrastrukturen. PostNord skickar kundens postnummer till PostNords servrar, men postnummer är svagare persondata än namn, e-post eller kortuppgifter. 

Generellt gäller att alla gratisplaner och sandbox-miljöer vi använder (Algolia, Stripe test mode, Supabase free tier, PostNord sandbox) har rate limits, begränsad support och inga SLA-garantier (Service Level Agreement). I en produktionsmiljö behöver varje tjänst en betald plan med avtalade uppetidsgarantier, och error handling blir ännu viktigare som fallback när SLA:t ändå inte håller.

## Reflektioner kring varje enskild integration

### Leverantörsimport (Issue #10)

Importerar produkter från leverantörens API (csv och XML). Admin kan trigga import via `/admin/import`.

**Designbeslut: kategorimappning**

För att hålla integrationen så robust som möjligt skickar leverantören endast "parent categories" (Kläder, Musik, Accessoarer). Inte "leaf categories" (Hoodies, T-shirts, CD, etc.).
Vi mappar till huvudkategorin eftersom leverantörens data inte innehåller tillräcklig med information för att avgöra
underkategori. Att parse:a produktnamn (t.ex. "CD Hybrid Theory" → CD) vore fragilt och skulle gå sönder vid namnändringar.

**Möjliga förbättringar:**

- Manuell tilldelning av underkategori via admin-UI efter import
- Utökat leverantörs-API med data för underkategori

### Sökintegration med Algolia (Issue #15)

Produkter indexeras i Algolia vid leverantörsimport och hålls synkade vid admin-redigering. Sökfunktion nås via `/search` i navbaren.

**Designbeslut: ingen DELETE-route**

Vår app har ingen `DELETE /api/products/:id`-endpoint. Istället avaktiveras produkter via `is_active = false` genom PATCH-endpointen. Vid avaktivering tas produkten bort från Algolias sökindex (`removeProduct`), vid återaktivering indexeras den på nytt. Effekten är densamma som delete ur användarens perspektiv. Produkten försvinner från sök men datan finns kvar i databasen.

**Designbeslut: bara importerade produkter i sökindex**

Endast produkter med `supplier_sku` (dvs. de som kommit via leverantörsimport) indexeras i Algolia. Manuellt skapade produkter via `/products/add` saknar SKU och hamnar därför inte i sökindexet.

**Designbeslut: inga bilder i sökresultat**

Algolia-indexet lagrar inte `image_id`. Sökresultat visar en "Ingen bild"-placeholder och länkar till produktdetaljsidan där bilder finns. Detta håller indexet light och undviker att behöva synka bildändringar till Algolia.

**Möjliga förbättringar:**

- Valbar pageSize i sök-UI:n (API:t stödjer redan 1–50, frontend skickar just nu alltid 12)
- Indexera manuellt skapade produkter (kräver att en objectID-strategi bestäms)
- Lägga till `image_id` i Algolia-indexet för att visa bilder i sökresultat

### Betalning med Stripe (Issue #17)

Beställningar skapas som `unpaid` och skickas till Stripe Hosted Checkout. En webhook lyssnar på events från Stripe och uppdaterar orderstatus samt minskar lagersaldo när betalningen bekräftas.

**Designbeslut: Hosted Checkout istället för Embedded**

Jag valde Hosted eftersom det endast kräver ett paket (`stripe`) och mindre ändringar i vår frontend. Kunden lämnar vår sida tillfälligt men Stripe hanterar kortvarlidering, betalmetoder etc etc åt oss

**Möjliga förbättringar:**

- Embedded Checkout för att hålla kunden kvar på sidan (kräver `@stripe/stripe-js` + `@stripe/react-stripe-js`)
- Lagerreservation med `FOR UPDATE`-lås för att undvika att två kunder köper sista exemplaret samtidigt
- Orderbekräftelsemail efter betalning (via Resend, Nodemailer eller Stripes egna kvitton)

### Produktbilder i molnlagring med Supabase Storage (Issue #19)

Produktbilder lagras nu i Supabase Storage istället för som binary blobs i databasen. Admin laddar upp via redigeringssidan, bilden går genom servern (validering + upload) och serveras sedan direkt från Supabase CDN.

**Designbeslut: server-in-the-middle istället för direktuppladdning**

Bilder skickas React → Server → Supabase, inte direkt från browsern. Detta ger oss server-side validering och håller `service_role`-nyckeln borta från klienten. Alternativet om jag förstår rätt vore signed upload URLs där servern skapar en tidsbegränsad URL och browsern laddar upp direkt till Supabase. Men detta kräver mer komplexitet och den avlastningen av servern behövs endast riktigt vid väldigt hög traffik. Inte när vi enbart har admins som laddar upp bilder.

**Designbeslut: trestegsflöde vid bildersättning**

Upload → Spara i DB → Ta bort gammal fil. Ordningen säkerställer att produkten alltid har en bild. Om borttagning av den gamla filen misslyckas loggas felet men produkten visar den nya bilden. Vid radering är ordningen omvänd: nollställ DB → ta bort fil, för att undvika att en kund ser en bruten bild-URL.

**Möjliga förbättringar:**

- Stöd för fler bildformat (WebP, AVIF)
- Flera bilder per produkt (bildgalleri)
- Bildoptimering/komprimering på serversidan före upload

### Frakt med PostNord (Issue #21)

Checkout visar fraktalternativ (ombud och hemleverans) med pris, beräknad leveranstid och närmaste ombud baserat på kundens postnummer via PostNords Service Points V5 och Transit Time V1 API:er.

**AI-användning**

Detta är en AI-labb där fokuset ligger på hur man använder AI för att skriva 100% av koden. Hur jag normalt använder AI finns att läsa i [PostNord adapter](./src/lib/integrations/shipping/postnordAdapter.ts).  
Det viktigaste med AI, vare sig man använder en agent med write access eller bara kör chat med klipp och klister, tycker jag kontext är bland det allra viktigaste. Så det första jag ser till är att Claude Code sessionen körs i mappen med alla filer så att agenten kan läsa dem.  
Som laborations PDF:en även pekar ut är det väldigt viktigt att aldrig dela API-nycklar direkt i AI chatten samt att godkänna kommandon agenten vill köra om de kräver specifika privileges.  

Sedan gör jag en action plan genom att ge URL till de relevant mapparna i föreläsnings repot (https://github.com/sibala/integration-with-external-systems-fsu25) samt den specifika laborations PDF:en.  
För just adaptern tog jag Swagger dokumentationen som Postnord ger för sina API:er och klistrade in dem som .txt här i repot så att Claude Code kan läsa dem utan att de bidrar till "context bloat".  

I prompt väg kör jag inte något fancy. Väldigt konversationell engelska. "Look at the two new txt files in the repo", "Write the full verified adapter please" osv.  
Jag ser fortfarande till att stå 100% för allting Git relaterat: Issues, commits, PR och merge in till main. På så sätt ser jag alltid till att jag är the human-in-the-loop.  

Och all Claude's kod fungerade på första försöket utan att jag behövde rätta till nånting! Jag verifierade manuellt på localhost och kan se mitt närmaste postombud vid checkout!  
Edit: Koden må ha funkat men lint steget visade att Claude kallade på `setState` i en `useEffect` vilket ger cascading renders errors och hindrar vå CI pipeline att köra igenom och merge:a in i main. Så *fungerande* kod men kanske inte den renaste koden haha
