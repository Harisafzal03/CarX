'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, DollarSign, Package,
  AlertTriangle, ShoppingBag, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const CHART_COLORS = [
  'hsl(221, 83%, 53%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)',
  'hsl(340, 75%, 55%)',
  'hsl(190, 80%, 50%)',
  'hsl(25, 95%, 55%)',
  'hsl(160, 70%, 48%)',
]

interface DashboardData {
  stats: {
    todayRevenue: number
    todayProfit: number
    monthlyRevenue: number
    monthlyProfit: number
    totalProducts: number
    lowStockCount: number
  }
  dailyChartData: { date: string; revenue: number; profit: number }[]
  topSellingProducts: { name: string; category: string; qty: number; revenue: number }[]
  categoryData: { category: string; revenue: number }[]
  recentSales: {
    id: string
    customer_name: string | null
    final_total: number
    payment_method: string
    sale_date: string
    sale_items: { profit: number }[]
  }[]
  recentPurchases: {
    id: string
    supplier_name: string
    invoice_number: string
    total_amount: number
    purchase_date: string
  }[]
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
}: {
  title: string
  value: string
  icon: React.ElementType
  color: string
  trend?: string
}) {
  return (
    <Card className="relative overflow-hidden animate-slide-up hover:scale-[1.02] transition-transform duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{title}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'hsl(var(--foreground))' }}>{value}</p>
            {trend && (
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{trend}</p>
            )}
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}20` }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl"
          style={{ background: `linear-gradient(90deg, ${color}60, ${color}20)` }}
        />
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/dashboard')
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDashboard()

    // Realtime subscriptions
    const supabase = createClient()
    const salesChannel = supabase
      .channel('dashboard-sales')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales' }, () => fetchDashboard())
      .subscribe()

    const purchasesChannel = supabase
      .channel('dashboard-purchases')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'purchases' }, () => fetchDashboard())
      .subscribe()

    return () => {
      supabase.removeChannel(salesChannel)
      supabase.removeChannel(purchasesChannel)
    }
  }, [fetchDashboard])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl animate-pulse" style={{ background: 'linear-gradient(135deg, hsl(221 83% 53%), hsl(280 65% 60%))' }} />
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = data?.stats

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboard}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Today Revenue"
          value={formatCurrency(stats?.todayRevenue ?? 0)}
          icon={DollarSign}
          color="hsl(221, 83%, 53%)"
          trend="Today's sales"
        />
        <StatCard
          title="Today Profit"
          value={formatCurrency(stats?.todayProfit ?? 0)}
          icon={TrendingUp}
          color="hsl(142, 71%, 45%)"
          trend="Net margin today"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.monthlyRevenue ?? 0)}
          icon={ShoppingBag}
          color="hsl(280, 65%, 60%)"
          trend="This month"
        />
        <StatCard
          title="Monthly Profit"
          value={formatCurrency(stats?.monthlyProfit ?? 0)}
          icon={TrendingDown}
          color="hsl(38, 92%, 50%)"
          trend="This month"
        />
        <StatCard
          title="Total Products"
          value={String(stats?.totalProducts ?? 0)}
          icon={Package}
          color="hsl(190, 80%, 50%)"
          trend="Catalog size"
        />
        <StatCard
          title="Low Stock"
          value={String(stats?.lowStockCount ?? 0)}
          icon={AlertTriangle}
          color="hsl(0, 84%, 60%)"
          trend="Need reorder"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Sales Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily Sales — Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data?.dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 20%)" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(222 47% 13%)', border: '1px solid hsl(222 47% 20%)', borderRadius: '12px', color: 'hsl(213 31% 91%)' }}
                  formatter={(val: number | undefined) => formatCurrency(val ?? 0)}
                />
                <Bar dataKey="revenue" fill="hsl(221, 83%, 53%)" radius={[6, 6, 0, 0]} name="Revenue" />
                <Bar dataKey="profit" fill="hsl(142, 71%, 45%)" radius={[6, 6, 0, 0]} name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Revenue Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Category Revenue (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data?.categoryData}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={40}
                  paddingAngle={3}
                >
                  {data?.categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'hsl(222 47% 13%)', border: '1px solid hsl(222 47% 20%)', borderRadius: '12px', color: 'hsl(213 31% 91%)' }}
                  formatter={(val: number | undefined) => formatCurrency(val ?? 0)}
                />
                <Legend formatter={(val) => <span style={{ color: 'hsl(213 31% 80%)', fontSize: 12 }}>{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top Selling Products (This Month)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data?.topSellingProducts.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'hsl(var(--muted-foreground))' }}>No sales this month</p>
            )}
            {data?.topSellingProducts.map((product, i) => (
              <div key={i} className="flex items-center gap-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{product.category}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold">{formatCurrency(product.revenue)}</p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{product.qty} units</p>
                </div>
                <div className="w-24">
                  <div className="h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, (product.revenue / (data.topSellingProducts[0]?.revenue || 1)) * 100)}%`,
                        background: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Sales */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Sales</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.recentSales.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>No sales yet</TableCell></TableRow>
                )}
                {data?.recentSales.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.customer_name || 'Walk-in'}</TableCell>
                    <TableCell>{formatCurrency(sale.final_total)}</TableCell>
                    <TableCell>
                      <Badge variant={sale.payment_method === 'cash' ? 'success' : 'default'}>
                        {sale.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Purchases */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Purchases</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.recentPurchases.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>No purchases yet</TableCell></TableRow>
                )}
                {data?.recentPurchases.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.supplier_name}</TableCell>
                    <TableCell className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.invoice_number}</TableCell>
                    <TableCell>{formatCurrency(p.total_amount)}</TableCell>
                    <TableCell className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {new Date(p.purchase_date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
