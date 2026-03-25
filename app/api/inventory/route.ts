import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('product_id')

  const search = searchParams.get('search') || ''

  // Get all products with stock and purchase items in parallel
  let productQ = supabase.from('products').select('*').order('name')
  if (productId) productQ = productQ.eq('id', productId)
  if (search) productQ = productQ.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)

  const [productsResponse, purchaseItemsResponse] = await Promise.all([
    productQ,
    supabase
      .from('purchase_items')
      .select('id, product_id, remaining_quantity, batch_number, purchase_price_per_unit, selling_price_per_unit, expiry_date, created_at')
      .gt('remaining_quantity', 0)
      .order('created_at')
  ])

  if (productsResponse.error) return NextResponse.json({ error: productsResponse.error.message }, { status: 500 })
  
  const products = productsResponse.data
  const purchaseItems = purchaseItemsResponse.data

  // Calculate stock per product (dynamic)
  const stockMap = new Map<string, number>()
  const batchMap = new Map<string, typeof purchaseItems>()

  purchaseItems?.forEach(pi => {
    stockMap.set(pi.product_id, (stockMap.get(pi.product_id) ?? 0) + pi.remaining_quantity)
    if (!batchMap.has(pi.product_id)) batchMap.set(pi.product_id, [])
    batchMap.get(pi.product_id)!.push(pi)
  })

  const inventory = products?.map(p => ({
    ...p,
    stock: stockMap.get(p.id) ?? 0,
    batches: batchMap.get(p.id) ?? [],
    isLowStock: (stockMap.get(p.id) ?? 0) <= p.minimum_threshold,
  }))

  return NextResponse.json(inventory)
}
