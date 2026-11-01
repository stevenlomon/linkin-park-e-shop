ALTER TABLE product
  ADD COLUMN image_url TEXT,  -- Det vi visar (<img src={product.image_url}>)
  ADD COLUMN image_path TEXT; -- Det vi använder för att radera filen (remove([product.image_path]))