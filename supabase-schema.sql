-- ============================================================
-- CarX Auto Parts Inventory + POS System
-- Supabase SQL Schema
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- ── 1. PRODUCTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  sku                 TEXT NOT NULL UNIQUE,
  category            TEXT NOT NULL,
  brand               TEXT NOT NULL,
  car_model           TEXT,
  description         TEXT,
  image_url           TEXT,
  minimum_threshold   INTEGER NOT NULL DEFAULT 5,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. PURCHASES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name   TEXT NOT NULL,
  invoice_number  TEXT NOT NULL,
  purchase_date   DATE NOT NULL,
  total_amount    NUMERIC(12,2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. PURCHASE ITEMS (batch tracking) ───────────────────────
CREATE TABLE IF NOT EXISTS purchase_items (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id               UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id                UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  batch_number              TEXT NOT NULL UNIQUE,
  quantity                  INTEGER NOT NULL CHECK (quantity > 0),
  remaining_quantity        INTEGER NOT NULL CHECK (remaining_quantity >= 0),
  purchase_price_per_unit   NUMERIC(12,2) NOT NULL,
  selling_price_per_unit    NUMERIC(12,2) NOT NULL,
  expiry_date               DATE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT remaining_lte_quantity CHECK (remaining_quantity <= quantity)
);

-- ── 4. SALES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name       TEXT,
  subtotal            NUMERIC(12,2) NOT NULL,
  discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  discount_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  final_total         NUMERIC(12,2) NOT NULL,
  payment_method      TEXT NOT NULL CHECK (payment_method IN ('cash', 'online')),
  sale_date           DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. SALE ITEMS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sale_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id             UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id          UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  purchase_item_id    UUID NOT NULL REFERENCES purchase_items(id) ON DELETE RESTRICT,
  quantity            INTEGER NOT NULL CHECK (quantity > 0),
  unit_price          NUMERIC(12,2) NOT NULL,
  purchase_price      NUMERIC(12,2) NOT NULL,
  total_price         NUMERIC(12,2) NOT NULL,
  profit              NUMERIC(12,2) NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. INDEXES ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_category       ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku            ON products(sku);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product  ON purchase_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_sales_date              ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale         ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product      ON sale_items(product_id);

-- ── 7. STOCK DEDUCTION RPC (FIFO) ────────────────────────────
CREATE OR REPLACE FUNCTION deduct_stock(
  p_purchase_item_id UUID,
  p_quantity         INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE purchase_items
  SET    remaining_quantity = remaining_quantity - p_quantity
  WHERE  id = p_purchase_item_id
    AND  remaining_quantity >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for batch %', p_purchase_item_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 8. ROW LEVEL SECURITY ────────────────────────────────────
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases      ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items      ENABLE ROW LEVEL SECURITY;

-- Authenticated users (admins) have full access to all tables
CREATE POLICY "admins_all_products"       ON products       FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admins_all_purchases"      ON purchases      FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admins_all_purchase_items" ON purchase_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admins_all_sales"          ON sales          FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admins_all_sale_items"     ON sale_items     FOR ALL USING (auth.role() = 'authenticated');

-- ── 9. REALTIME ───────────────────────────────────────────────
-- Enable realtime for dashboard live updates
ALTER PUBLICATION supabase_realtime ADD TABLE sales;
ALTER PUBLICATION supabase_realtime ADD TABLE purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE purchase_items;

-- ── 10. SEED: CREATE ADMIN USERS ─────────────────────────────
-- Run this AFTER creating users via Supabase Dashboard → Authentication
-- OR use the Supabase service-role API to create them programmatically.
--
-- Admin 1:  admin1@carx.com  /  CarX@Admin1!
-- Admin 2:  admin2@carx.com  /  CarX@Admin2!
--
-- Create users in: Supabase Dashboard → Authentication → Users → Add user
-- Email: admin1@carx.com
-- Password: CarX@Admin1!
--
-- Email: admin2@carx.com
-- Password: CarX@Admin2!


-- ── 11. SEED: SAMPLE PRODUCTS ────────────────────────────────
-- Optional: Insert sample products to get started
INSERT INTO products (name, sku, category, brand, car_model, minimum_threshold) VALUES
  ('K&N Air Filter - Universal',       'AIR-KN-1001', 'Air Filter',   'K&N',     NULL,              5),
  ('Bosch Oil Filter - Corolla',        'OIL-BSH-1002', 'Oil Filter',  'Bosch',   'Toyota Corolla',  3),
  ('WIX Fuel Filter - Universal',       'FUE-WIX-1003', 'Fuel Filter','WIX',     NULL,              4),
  ('Car Air Freshener - Ocean',         'PER-CRX-1004', 'Car Perfumes','CarX',    NULL,              10),
  ('Meguiar's Car Polish - 500ml',      'POL-MEG-1005', 'Polish',      'Meguiar''s', NULL,           5),
  ('Universal Window Shade',            'SHA-CRX-1006', 'Window Shades','CarX',  NULL,              8),
  ('Castrol Engine Oil 5W-30 (4L)',     'OIL-CAS-1007', 'Oil Cans',   'Castrol', NULL,              3),
  ('Car Bluetooth Speaker 6.5"',        'SPK-JBL-1008', 'Speakers',   'JBL',     NULL,              5)
ON CONFLICT (sku) DO NOTHING;
