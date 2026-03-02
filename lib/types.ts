export type Category =
  | 'Air Filter'
  | 'Oil Filter'
  | 'Fuel Filter'
  | 'Spoiler'
  | 'Speakers'
  | 'Oil Cans'
  | 'Window Shades'
  | 'Sprays'
  | 'Gels'
  | 'Car Perfumes'
  | 'Polish'
  | 'Accessories'
  | 'Universal'
  | 'Specific Car Model'

export const CATEGORIES: Category[] = [
  'Air Filter',
  'Oil Filter',
  'Fuel Filter',
  'Spoiler',
  'Speakers',
  'Oil Cans',
  'Window Shades',
  'Sprays',
  'Gels',
  'Car Perfumes',
  'Polish',
  'Accessories',
  'Universal',
  'Specific Car Model',
]

export const PAYMENT_METHODS = ['cash', 'online'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export interface Product {
  id: string
  name: string
  sku: string
  category: Category
  brand: string
  car_model: string | null
  description: string | null
  image_url: string | null
  minimum_threshold: number
  created_at: string
}

export interface Batch {
  id: string
  batch_number: string
  remaining_quantity: number
  purchase_price_per_unit: number
  selling_price_per_unit: number
  expiry_date: string | null
  created_at?: string
}

export interface ProductWithStock extends Product {
  stock: number
  batches?: Batch[]
}

export interface Purchase {
  id: string
  supplier_name: string
  invoice_number: string
  purchase_date: string
  total_amount: number
  created_at: string
  purchase_items?: PurchaseItem[]
}

export interface PurchaseItem {
  id: string
  purchase_id: string
  product_id: string
  batch_number: string
  quantity: number
  remaining_quantity: number
  purchase_price_per_unit: number
  selling_price_per_unit: number
  expiry_date: string | null
  created_at: string
  product?: Product
}

export interface Sale {
  id: string
  customer_name: string | null
  subtotal: number
  discount_percentage: number
  discount_amount: number
  final_total: number
  payment_method: PaymentMethod
  sale_date: string
  created_at: string
  sale_items?: SaleItem[]
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  purchase_item_id: string
  quantity: number
  unit_price: number
  purchase_price: number
  total_price: number
  profit: number
  product?: Product
}

export interface DashboardStats {
  todayRevenue: number
  todayProfit: number
  monthlyRevenue: number
  monthlyProfit: number
  totalProducts: number
  lowStockCount: number
}

export interface CartItem {
  product: ProductWithStock
  quantity: number
  unitPrice: number
  purchaseItemId: string
  purchasePrice: number
}
