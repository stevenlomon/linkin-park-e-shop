ALTER TABLE "Order"
  ADD COLUMN shipping_method VARCHAR(20),         -- 'service_point' eller 'home_delivery'
  ADD COLUMN shipping_price NUMERIC DEFAULT 0,    -- server-uträklat pris i SEK
  ADD COLUMN service_point_id VARCHAR(50),        -- PostNords ID. NULL för hemleverans
  ADD COLUMN service_point_name VARCHAR(255);     -- För display i UI:n. Vi skippar även extra API requests