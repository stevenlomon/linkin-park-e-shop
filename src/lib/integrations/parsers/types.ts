// Det här är types som BARA används vid leverantör product import och parsing. Cleaner separation of concern
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
};