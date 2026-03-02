import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  // Revenue & profit by day for the last 30 days
  let query = supabase
    .from('sales')
    .select('sale_date, final_total, sale_items(profit)')
    .order('sale_date', { ascending: true })

  if (from) query = query.gte('sale_date', from)
  if (to) query = query.lte('sale_date', to)

  const { data: sales, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aggregate by date
  const dayMap = new Map<string, { revenue: number; profit: number }>()
  sales?.forEach((s: { sale_date: string; final_total: number; sale_items: { profit: number }[] }) => {
    const d = s.sale_date
    const existing = dayMap.get(d)
    const profit = s.sale_items?.reduce((p, si) => p + si.profit, 0) ?? 0
    if (existing) {
      existing.revenue += s.final_total
      existing.profit += profit
    } else {
      dayMap.set(d, { revenue: s.final_total, profit })
    }
  })

  const chartData = Array.from(dayMap.entries()).map(([date, vals]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    ...vals,
  }))

  const totalRevenue = sales?.reduce((s, sale) => s + sale.final_total, 0) ?? 0
  const totalProfit = sales?.reduce((s, sale) =>
    s + (sale.sale_items?.reduce((p: number, si: { profit: number }) => p + si.profit, 0) ?? 0), 0) ?? 0

  return NextResponse.json({ chartData, totalRevenue, totalProfit })
}
