import { NextRequest, NextResponse } from 'next/server';
import { getDeliveryTime } from '@/lib/integrations/shipping/postnordAdapter';

// Shoppens postnummer — origin för transit time. I en riktig app → .env, men en konstant duger för skolprojekt
const SHOP_POSTAL_CODE = '11152';

export async function GET(req: NextRequest) {
  const postalCode = req.nextUrl.searchParams.get('postalCode');

  if (!postalCode || !/^\d{5}$/.test(postalCode)) {
    return NextResponse.json(
      { error: 'Postnummer måste vara 5 siffror (t.ex. 11152)' },
      { status: 400 },
    );
  }

  try {
    const estimate = await getDeliveryTime(SHOP_POSTAL_CODE, postalCode);

    // null estimate = PostNord svarade OK men hittade ingen rutt (tom array). Det är inte ett fel (502),
    // API:et fungerade — det hade bara inget svar. Frontend visar "Leveranstid kunde inte beräknas"
    if (!estimate) {
      return NextResponse.json(
        { estimatedDelivery: null, message: 'Kunde inte beräkna leveranstid för detta postnummer.' },
      );
    }

    return NextResponse.json({
      estimatedDelivery: estimate.estimatedDelivery,
      serviceName: estimate.serviceName,
    });
  } catch (err) {
    // Graceful degradation: PostNord nere → 502 men checkout fungerar fortfarande.
    // "Beställningen påverkas inte" — kunden fastnar inte, de tappar bara leveranstidsuppskattningen
    console.error('PostNord transit time misslyckades:', err);
    return NextResponse.json(
      { error: 'Kunde inte beräkna leveranstid. Beställningen påverkas inte.' },
      { status: 502 },
    );
  }
}
