import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Run all queries in parallel
  const [
    todaySales,
    monthlySales,
    totalProducts,
    purchaseItems,
    recentSales,
    recentPurchases,
    topProducts,
    dailySales,
    categoryRevenue,
  ] = await Promise.all([
    // Today sales
    supabase.from('sales').select('final_total, sale_items(profit)').gte('sale_date', todayStart.split('T')[0]),
    // Monthly sales
    supabase.from('sales').select('final_total, sale_items(profit)').gte('sale_date', monthStart.split('T')[0]),
    // Total products count
    supabase.from('products').select('id', { count: 'exact', head: true }),
    // All purchase_items for stock calculation
    supabase.from('purchase_items').select('product_id, remaining_quantity, products(minimum_threshold)'),
    // Recent sales
    supabase.from('sales')
      .select('*, sale_items(profit)')
      .order('created_at', { ascending: false })
      .limit(8),
    // Recent purchases
    supabase.from('purchases')
      .select('*, purchase_items(quantity)')
      .order('created_at', { ascending: false })
      .limit(5),
    // Top selling products
    supabase.from('sale_items')
      .select('product_id, quantity, total_price, product:products(name, category)')
      .gte('created_at', monthStart),
    // Daily sales for last 7 days
    supabase.from('sales')
      .select('sale_date, final_total, sale_items(profit)')
      .gte('sale_date', last7Days.split('T')[0])
      .order('sale_date'),
    // Category revenue
    supabase.from('sale_items')
      .select('total_price, product:products(category)')
      .gte('created_at', monthStart),
  ])

  // Calculate today stats
  const todayRevenue = todaySales.data?.reduce((s, sale) => s + sale.final_total, 0) ?? 0
  const todayProfit = todaySales.data?.reduce((s, sale) =>
    s + (sale.sale_items?.reduce((p: number, si: { profit: number }) => p + si.profit, 0) ?? 0), 0) ?? 0

  // Calculate monthly stats
  const monthlyRevenue = monthlySales.data?.reduce((s, sale) => s + sale.final_total, 0) ?? 0
  const monthlyProfit = monthlySales.data?.reduce((s, sale) =>
    s + (sale.sale_items?.reduce((p: number, si: { profit: number }) => p + si.profit, 0) ?? 0), 0) ?? 0

  // Low stock calculation
  const stockMap = new Map<string, { remaining: number; threshold: number }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  purchaseItems.data?.forEach((pi: any) => {
    const existing = stockMap.get(pi.product_id as string)
    const prod = Array.isArray(pi.products) ? pi.products[0] : pi.products
    const threshold: number = prod?.minimum_threshold ?? 5
    const remaining: number = pi.remaining_quantity ?? 0
    if (existing) {
      existing.remaining += remaining
    } else {
      stockMap.set(pi.product_id, { remaining, threshold })
    }
  })
  const lowStockCount = Array.from(stockMap.values()).filter(v => v.remaining <= v.threshold).length
  const lowStockItems = Array.from(stockMap.entries())
    .filter(([, v]) => v.remaining <= v.threshold)
    .map(([productId, v]) => ({ productId, ...v }))

  // Process top products
  const productMap = new Map<string, { name: string; category: string; qty: number; revenue: number }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topProducts.data?.forEach((si: any) => {
    const existing = productMap.get(si.product_id as string)
    const prod = Array.isArray(si.product) ? si.product[0] : si.product
    const name: string = prod?.name ?? 'Unknown'
    const category: string = prod?.category ?? ''
    const qty: number = si.quantity ?? 0
    const totalPrice: number = si.total_price ?? 0
    if (existing) {
      existing.qty += qty
      existing.revenue += totalPrice
    } else {
      productMap.set(si.product_id, { name, category, qty, revenue: totalPrice })
    }
  })
  const topSellingProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)

  // Daily chart data
  const dailyMap = new Map<string, { revenue: number; profit: number }>()
  dailySales.data?.forEach((sale: { sale_date: string; final_total: number; sale_items: { profit: number }[] }) => {
    const existing = dailyMap.get(sale.sale_date)
    const profit = sale.sale_items?.reduce((p, si) => p + si.profit, 0) ?? 0
    if (existing) {
      existing.revenue += sale.final_total
      existing.profit += profit
    } else {
      dailyMap.set(sale.sale_date, { revenue: sale.final_total, profit })
    }
  })
  const dailyChartData = Array.from(dailyMap.entries()).map(([date, vals]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    ...vals,
  }))

  // Category revenue
  const catMap = new Map<string, number>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  categoryRevenue.data?.forEach((si: any) => {
    const prod = Array.isArray(si.product) ? si.product[0] : si.product
    const cat: string = prod?.category ?? 'Other'
    catMap.set(cat, (catMap.get(cat) ?? 0) + (si.total_price ?? 0))
  })
  const categoryData = Array.from(catMap.entries()).map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue).slice(0, 8)

  return NextResponse.json({
    stats: { todayRevenue, todayProfit, monthlyRevenue, monthlyProfit, totalProducts: totalProducts.count ?? 0, lowStockCount },
    dailyChartData,
    topSellingProducts,
    categoryData,
    recentSales: recentSales.data ?? [],
    recentPurchases: recentPurchases.data ?? [],
    lowStockItems,
  })
}
