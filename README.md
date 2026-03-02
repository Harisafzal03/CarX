# CarX — Auto Parts Inventory & POS System

A full-stack inventory management and point-of-sale system built for auto parts shops. Manage products, purchases, sales, stock tracking, and generate customer receipts — all in one place.

![CarX Dashboard](public/logo.jpeg)

---

## Features

### 🛒 POS / Sales
- Search and add products to cart in real-time
- Apply percentage discounts
- Cash / Online payment modes
- FIFO batch-based stock deduction on checkout
- Stale cart detection and auto-recovery

### 📦 Products
- Add, edit products with category, brand, SKU, car model
- Dynamic categories (add/delete from Categories page)
- Configurable low-stock threshold per product

### 🏷️ Categories
- Dynamically add and delete product categories
- Deletion guard — cannot delete a category with active products

### 🚚 Purchases
- Record purchases with multiple line items per supplier
- Auto-computed totals
- Attach receipt images (stored in Supabase Storage)
- View purchase details with image lightbox
- Edit supplier info / image without losing stock records

### 📋 Inventory
- Live stock view calculated from purchase batch remaining quantities
- Low-stock badge alerts
- Search by product name or SKU

### 📜 Order History
- Filter by today / this month / custom date range
- Edit sale metadata (customer, discount, payment, date)
- Delete sale with automatic stock restoration (FIFO reversion)
- Print customer receipt slip (popup print dialog)

### 📊 Reports
- Revenue and profit charts (daily / weekly / monthly)
- Top products by revenue and profit
- Powered by Recharts

### 🏛️ Dashboard
- Revenue, profit, sales count, low-stock summary cards
- Recent sales and upcoming low-stock alerts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Styling | TailwindCSS v4 |
| Components | ShadCN UI |
| State | Zustand (cart) |
| Charts | Recharts |
| Forms | React Hook Form |
| Language | TypeScript |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Harisafzal03/CarX.git
cd CarX
yarn install
```

### 2. Set up Supabase

Create a project at [supabase.com](https://supabase.com) then run the schema from `supabase-schema.sql` in the SQL Editor.

Also run:
```sql
-- Inventory image storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('carx-purchases', 'carx-purchases', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth upload purchase images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'carx-purchases');

CREATE POLICY "Public view purchase images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'carx-purchases');

-- Stock restore function (for sale deletion)
CREATE OR REPLACE FUNCTION restore_stock(
  p_purchase_item_id UUID,
  p_quantity INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE purchase_items
  SET remaining_quantity = remaining_quantity + p_quantity
  WHERE id = p_purchase_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_all_categories" ON categories FOR ALL USING (auth.role() = 'authenticated');

-- Purchases image column
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS image_url TEXT;
```

### 3. Configure environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run locally

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
├── api/              # API routes (products, purchases, sales, inventory, categories, dashboard, reports)
├── dashboard/        # Dashboard pages (POS, Products, Categories, Purchases, Inventory, Orders, Reports)
├── login/            # Auth page
components/
├── layout/           # Sidebar
├── ui/               # ShadCN components
lib/
├── stores/           # Zustand cart store
├── supabase/         # Supabase client & server helpers
├── types.ts          # Shared TypeScript types
├── utils.ts          # Formatters and helpers
public/
├── logo.jpeg         # Shop logo
supabase-schema.sql   # Full database schema
```

---

## License

MIT — free to use and modify.
