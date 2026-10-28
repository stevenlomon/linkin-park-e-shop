// Den här filen har ett annat syfte än vår adapter.
// Vår adapter pratar med externa API
// Denna fil pratar med vår databas
// I och med skapandet av denna fil, i och med att vi vet att det kommer skapas 4 till integrations, får även
// alla leverantör relaterade filer bo under /integrations/supplier/

import { pool } from '@/lib/db';
import type { SupplierProduct, ImportReport } from './parsers/types';