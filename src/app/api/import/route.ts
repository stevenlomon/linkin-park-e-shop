// Här importerar vi alla supplier integration filer och kallar på dem i rätt ordning!
import { NextResponse } from 'next/server';
import { fetchCSV, fetchXML } from '@/lib/integrations/supplier/supplierAdapter';
import { parseCSV } from '@/lib/integrations/supplier/parsers/csvParser';
import { parseXML } from '@/lib/integrations/supplier/parsers/xmlParser';
import { importProducts } from '@/lib/integrations/supplier/supplierImporter';

export async function POST(req: Request) {
  try {
    // Bara för att testa på och likna leverantör API:t som använder query parameters istället för JSON body
    // kör vi det här också. Vi skulle lika gärna kunna köra `const { format } = await req.json();`
    // Query passar bra när vi har en "one variable body" och det är bra att testa på både varianter också!
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format');

    if (format !== 'csv' && format !== 'xml') {
      return NextResponse.json(
        { error: 'Query parameter "format" must be "csv" or "xml"' },
        { status: 400 }
      );
    }

    // 6 rader kod här men huuuuur många som helst i vår integration mapp haha! Beautiful separation of concerns
    const products =
      format === 'csv'
        ? parseCSV(await fetchCSV())
        : parseXML(await fetchXML());

    const report = await importProducts(products);

    return NextResponse.json(report);
  } catch (err) {
    console.error('Import failed:', err);
    return NextResponse.json(
      { error: 'Import failed' },
      { status: 500 }
    );
  }
}