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

  for (const product of products) {
    // Det främsta vi behöver validera här är pris och kategori. En produkt utan pris kan inte säljas och
    // kategorin måste finnas i vår databas. Namn och artNr är alltid string och våra parsers hanterar stock 
    // och variants
    if (product.price === null) {
      report.skipped.push({ artNr: product.artNr, reason: 'Pris saknas eller ogiltigt' });
      continue;
    }

    const categoryId = CATEGORY_MAP[product.category];
    if (!categoryId) {
      report.skipped.push({ artNr: product.artNr, reason: `Okänd kategori: ${product.category}` });
      continue;
    }

    // Upsert in i vår products table i databasen!
    // Avsiktligt uppdaterar vi endast current_price, inte standard_price
    const result = await pool.query({
      name: 'upsert-supplier-product',
      text: `
        INSERT INTO product (name, standard_price, current_price, category_id, supplier_sku, stock, variants)
          VALUES ($1, $2, $2, $3, $4, $5, $6)
        ON CONFLICT (supplier_sku) -- supplier_sku har UNIQUE constraint och ON CONFLICT DO UPDATE SET delen av hela INSERT satsen är vad som kan ses som UPSERT
          DO UPDATE 
            SET 
              name = EXCLUDED.name, -- Förklaring för EXCLUDED finns i api/cart/route.ts!
              current_price = EXCLUDED.current_price,
              stock = EXCLUDED.stock,
              variants = EXCLUDED.variants,
              last_updated_at = CURRENT_TIMESTAMP
        RETURNING (xmax = 0) AS inserted -- Tydligen är detta ett Postgres trick. xmax är en intern system kolumn och kan hjälpa oss skilja created och updated. När den är 0 lades raden nyligen in, när den inte är 0 uppdateras den!
      `,
      values: [
        product.name,
        product.price,
        categoryId,
        product.artNr,
        product.stock,
        product.variants.length > 0 ? product.variants : null, // Om variant saknas väljer vi null över än tom array för enklare queries
      ],
    });

    // Här är "`inserted` mha `xmax` Postgres tricket" in action!
    if (result.rows[0].inserted) {
      report.created++;
    } else {
      report.updated++;
    }
  }

  return report;
}