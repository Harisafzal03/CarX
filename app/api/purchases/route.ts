import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { generateBatchNumber } from '@/lib/utils'

const purchaseItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  purchase_price_per_unit: z.number().positive(),
  selling_price_per_unit: z.number().positive(),
  expiry_date: z.string().nullable().optional(),
})

const purchaseSchema = z.object({
  supplier_name: z.string().min(1),
  invoice_number: z.string().min(1),
  purchase_date: z.string(),
  total_amount: z.number().min(0),
  items: z.array(purchaseItemSchema).min(1),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')

  const { data, error } = await supabase
    .from('purchases')
    .select('*, purchase_items(*, product:products(name, sku, category))')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const parsed = purchaseSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { items, ...purchaseData } = parsed.data

  // Create purchase record
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert(purchaseData)
    .select()
    .single()

  if (purchaseError) return NextResponse.json({ error: purchaseError.message }, { status: 500 })

  // Create purchase items with auto batch numbers
  // Coerce empty expiry_date strings to null so Postgres DATE accepts them
  const purchaseItems = items.map(item => ({
    ...item,
    expiry_date: item.expiry_date?.trim() || null,
    purchase_id: purchase.id,
    batch_number: generateBatchNumber(),
    remaining_quantity: item.quantity,
  }))

  const { error: itemsError } = await supabase
    .from('purchase_items')
    .insert(purchaseItems)

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

  // Auto-sync products base prices with this latest purchase
  for (const item of items) {
    await supabase
      .from('products')
      .update({
        purchase_price: item.purchase_price_per_unit,
        selling_price: item.selling_price_per_unit,
      })
      .eq('id', item.product_id)
  }

  return NextResponse.json(purchase, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const { id, supplier_name, invoice_number, purchase_date, total_amount, image_url, items } = body
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  // Update purchase header
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .update({ supplier_name, invoice_number, purchase_date, total_amount, image_url })
    .eq('id', id)
    .select()
    .single()

  if (purchaseError) return NextResponse.json({ error: purchaseError.message }, { status: 500 })

  // Update items prices if items were provided
  if (items && Array.isArray(items)) {
    for (const item of items) {
      // Find the item for this purchase and product
      // We assume one row per product per purchase for simplicity here
      await supabase
        .from('purchase_items')
        .update({ 
          purchase_price_per_unit: item.purchase_price_per_unit,
          selling_price_per_unit: item.selling_price_per_unit,
          quantity: item.quantity,
          expiry_date: item.expiry_date?.trim() || null
        })
        .eq('purchase_id', id)
        .eq('product_id', item.product_id)

      // Auto-sync products base prices with this updated purchase
      await supabase
        .from('products')
        .update({
          purchase_price: item.purchase_price_per_unit,
          selling_price: item.selling_price_per_unit,
        })
        .eq('id', item.product_id)
    }
  }

  return NextResponse.json(purchase)
}
