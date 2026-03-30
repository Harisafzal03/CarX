import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const saleItemSchema = z.object({
  product_id: z.string().uuid(),
  purchase_item_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  unit_price: z.number().positive(),
  purchase_price: z.number().min(0),
})

const saleSchema = z.object({
  customer_name: z.string().nullable().optional(),
  subtotal: z.number().nonnegative(),
  discount_percentage: z.number().min(0).max(100).default(0),
  discount_amount: z.number().nonnegative(),
  final_total: z.number().nonnegative(),
  labour_cost: z.number().min(0).default(0),
  payment_method: z.enum(['cash', 'online', 'credit']),
  sale_date: z.string(),
  items: z.array(saleItemSchema).min(1),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const limit = parseInt(searchParams.get('limit') || '50')

  let query = supabase
    .from('sales')
    .select('*, sale_items(*, product:products(name, sku, category))')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (from) query = query.gte('sale_date', from)
  if (to) query = query.lte('sale_date', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const parsed = saleSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { items, ...saleData } = parsed.data

  // Create the sale
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert(saleData)
    .select()
    .single()

  if (saleError) return NextResponse.json({ error: saleError.message }, { status: 500 })

  // Create sale items and calculate profit
  const saleItems = items.map(item => ({
    sale_id: sale.id,
    product_id: item.product_id,
    purchase_item_id: item.purchase_item_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    purchase_price: item.purchase_price,
    total_price: item.unit_price * item.quantity,
    profit: (item.unit_price - item.purchase_price) * item.quantity,
  }))

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(saleItems)

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

  // Deduct stock from purchase_items (FIFO batch deduction) in parallel
  await Promise.all(items.map(item =>
    supabase.rpc('deduct_stock', {
      p_purchase_item_id: item.purchase_item_id,
      p_quantity: item.quantity,
    }).then(({ error }) => {
      if (error) console.error('Stock deduction error:', error)
    })
  ))

  return NextResponse.json(sale, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const { id, customer_name, discount_percentage, discount_amount, labour_cost, final_total, payment_method, sale_date } = body
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  // Recalculate subtotal from existing sale_items
  const { data: saleItems } = await supabase
    .from('sale_items')
    .select('total_price')
    .eq('sale_id', id)
  const subtotal = saleItems?.reduce((s, i) => s + i.total_price, 0) ?? 0

  const { data, error } = await supabase
    .from('sales')
    .update({ customer_name, discount_percentage, discount_amount, labour_cost, final_total, payment_method, sale_date, subtotal })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  // Fetch sale_items to know what stock to restore
  const { data: saleItems, error: fetchError } = await supabase
    .from('sale_items')
    .select('purchase_item_id, quantity')
    .eq('sale_id', id)

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  // Restore stock to each batch (reverse the deduction) in parallel
  if (saleItems) {
    await Promise.all(saleItems.map(item =>
      supabase.rpc('restore_stock', {
        p_purchase_item_id: item.purchase_item_id,
        p_quantity: item.quantity,
      })
    ))
  }

  // Delete sale (cascade deletes sale_items)
  const { error } = await supabase.from('sales').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

