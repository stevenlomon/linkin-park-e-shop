// Här importerar vi alla supplier integration filer och kallar på dem i rätt ordning!
import { NextResponse } from 'next/server';
import { fetchCSV, fetchXML } from '@/lib/integrations/supplier/supplierAdapter';
import { parseCSV } from '@/lib/integrations/supplier/parsers/csvParser';
import { parseXML } from '@/lib/integrations/supplier/parsers/xmlParser';
import { importProducts } from '@/lib/integrations/supplier/supplierImporter';

export async function POST(req: Request) {
  // Kod ska skrivas här
}