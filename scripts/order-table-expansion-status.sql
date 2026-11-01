ALTER TABLE "Order" 
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
  ADD COLUMN stripe_session_id VARCHAR(255);