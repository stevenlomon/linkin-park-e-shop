ALTER TABLE product
  ADD COLUMN supplier_sku VARCHAR(20) UNIQUE,
  ADD COLUMN stock INT,
  ADD COLUMN variants TEXT[];