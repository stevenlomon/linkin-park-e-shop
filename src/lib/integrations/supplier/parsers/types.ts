// Det här är types som BARA används vid leverantör product import och parsing, de får bo här för att inte 
// clutter up lib/types.ts. Cleaner separation of concern
// Det här är även de som delas mellan vår csv parser och vår XML parser. De i sig har individuella types
export type SupplierProduct = {
  artNr: string;
  name: string;
  category: string;
  price: number | null;
  stock: number | null;
  variants: string[];
  updatedAt: string;
};

export type ImportReport = {
  total: number;
  created: number;
  updated: number;
  skipped: { artNr: string; reason: string }[];

  // NEW: Indexerades produkten i Algolia?
  searchIndexed?: boolean;
};