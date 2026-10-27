// Vi kommer att ha både en csv parser och en XML parser så vi låter de leva i /integrations/parsers
import { parse } from 'csv-parse/sync';
import type { SupplierProduct } from './types';