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

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: true, // Auto-konvertera number och boolean; t.ex. `<lagersaldo>0</lagersaldo>` till 0 och inte "0"

  // Denna är superviktig när man jobbar med XML data och flera objekt! Det är denna som ser till att vi får en array med
  // objekt och inte bara ett enda objekt 
  isArray: (name) => name === 'produkt' || name === 'variant', 
});

// Ta hela vår råa XML sträng och gör om till en array av object av data shape SupplierProduct 
export function parseXML(text: string): SupplierProduct[] {
  // Anledningen till att denna nesting existerer är för att det är var vår XML parsin ger oss; det går inte att ändra
  const doc: { katalog: { produkt: XmlProduct[] } } = xmlParser.parse(text);

  return doc.katalog.produkt.map((p) => ({
    artNr: p['@_artNr'],                                       // XML-attribut (artNr="LEV-1001") får prefix @_ 
    name: p.benamning,
    category: p.kategori,
    price: parseDecimal(p.pris['#text']),                      // #text behövs för att <pris> har ett attribut (valuta)
    stock: p.lagersaldo === '' ? null : Number(p.lagersaldo),
    variants: p.varianter?.variant ?? [],
    updatedAt: p.uppdaterad,
  }));
}

function parseDecimal(value: string | number): number | null {
  const text = String(value);
  const cleaned = text.replace(',', '.');
  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
}