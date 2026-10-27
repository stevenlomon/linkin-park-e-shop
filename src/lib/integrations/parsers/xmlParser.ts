import { XMLParser } from 'fast-xml-parser';
import type { SupplierProduct } from './types';

type XmlProduct = {
  // Det här är väldigt annorlunda från csv. artNr är ett XML attribute! (`<produkt artNr="LEV-1001">`) 
  // Vilket XMLParser prefixar det med `@_`
  '@_artNr': string; 
  ean: string;
  benamning: string;
  kategori: string;
  pris: { '#text': string; '@_valuta': string }; // Pris (`<pris valuta="SEK">295.00</pris>`) har både text och ett attribut!
  lagersaldo: string | number;
  varianter?: { variant: string[] };
  uppdaterad: string;
};