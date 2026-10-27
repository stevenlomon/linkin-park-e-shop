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