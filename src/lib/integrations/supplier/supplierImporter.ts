// Den här filen har ett annat syfte än vår adapter.
// Vår adapter pratar med externa API
// Denna fil pratar med vår databas
// I och med skapandet av denna fil, i och med att vi vet att det kommer skapas 4 till integrations, får även
// alla leverantör relaterade filer bo under /integrations/supplier/

import { pool } from '@/lib/db';
import type { SupplierProduct, ImportReport } from './parsers/types';

// Största produkt design valet: vi fokuserar endast på "parents categories", inte "leaf categories" alls
// Detta dokumenteras i mer detalj i README
const CATEGORY_MAP: Record<string, number> = {
  'Kläder': 1,
  'Musik': 3,
  'Accessoarer': 7,
};

export async function importProducts(products: SupplierProduct[]): Promise<ImportReport> {
  const report: ImportReport = {
    total: products.length,
    created: 0,
    updated: 0,
    skipped: [],
  };

  // Kod kommer läggas till här

  return report;
}