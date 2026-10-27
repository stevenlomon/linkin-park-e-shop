// Vi kommer att ha både en csv parser och en XML parser så vi låter de leva i /integrations/parsers
import { parse } from 'csv-parse/sync';
import type { SupplierProduct } from './types';

// Denna type används BARA i denna fil. De som delas mellan denna csv parser och vår XML parser (ska skapas) lever
// i den delade filen i /integrations/parsers/types.ts
type CsvRow = {
  artNr: string;
  ean: string;
  benamning: string;
  kategori: string;
  pris: string;
  lagersaldo: string;
  varianter: string;
  uppdaterad: string;
};

// Tar emot ArrayBuffer från fetchCSV i vår adapter och ger en array av object på formen SupplierProduct
export function parseCSV(buffer: ArrayBuffer): SupplierProduct[] {
  // Det här är steget där vi faktiskt tar den råa datan från vår buffer och gör om det från 'windows-1252' till UTF-8
  // I denna labb tar vi för givet att csv datan använder 'windows-1252' men det är inte garanterat om jag förstår rätt
  const text = new TextDecoder('windows-1252').decode(buffer);

  // Efter steget ovan är datan fortfarande ren text. Här i parse steget omvandlar vi det till objects (nästan JSON men 
  // inte än haha)
  const rows = parse<CsvRow>(text, {
    columns: true,
    delimiter: ';',
    skip_empty_lines: true,
    trim: true,
  });
}