import { NextRequest, NextResponse } from 'next/server';
import { findServicePoints } from '@/lib/integrations/shipping/postnordAdapter';

export async function GET(req: NextRequest) {
  const postalCode = req.nextUrl.searchParams.get('postalCode');

  if (!postalCode || !/^\d{5}$/.test(postalCode)) {
    return NextResponse.json(
      { error: 'Postnummer måste vara 5 siffror (t.ex. 11152)' },
      { status: 400 },
    );
  }

  try {
    const servicePoints = await findServicePoints(postalCode);
    return NextResponse.json({ servicePoints });
  } catch (err) {
    // Graceful degradation: PostNord nere → 502 men kunden fastnar inte.
    // "Du kan fortfarande välja hemleverans" — de tappar bara ombudsalternativet
    console.error('PostNord service points misslyckades:', err);
    return NextResponse.json(
      { error: 'Kunde inte hämta ombud. Du kan fortfarande välja hemleverans.' },
      { status: 502 },
    );
  }
}
