'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
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
  AlertTriangle, ShoppingBag, RefreshCw, CreditCard, Wrench
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const CHART_COLORS = [
  '#2563eb', // Electric Blue
  '#8b5cf6', // Neon Purple
  '#d946ef', // Radiant Magenta
  '#06b6d4', // Vibrant Cyan
  '#f59e0b', // Vivid Orange
  '#ec4899', // Deep Pink
  '#10b981', // Emerald Green
  '#f43f5e', // Rose Red
]

interface DashboardData {
  stats: {
    todayRevenue: number
    todayProfit: number
    monthlyRevenue: number
    monthlyProfit: number
    totalProducts: number
    lowStockCount: number
    totalStockCost: number
    lifetimeRevenue: number
    lifetimeLabourCost: number
    lifetimeCreditSales: number
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

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    fetchDashboard()

    // Realtime subscriptions
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
  }, [fetchDashboard, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl animate-pulse bg-white/10 border border-white/20" />
          <p className="text-sm font-medium tracking-widest uppercase opacity-50">Synchronizing Data...</p>
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Today Revenue"
          value={formatCurrency(stats?.todayRevenue ?? 0)}
          icon={DollarSign}
          color="black"
          trend="Today's sales"
        />
        <StatCard
          title="Today Profit"
          value={formatCurrency(stats?.todayProfit ?? 0)}
          icon={TrendingUp}
          color="#18181b"
          trend="Net margin today"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.monthlyRevenue ?? 0)}
          icon={ShoppingBag}
          color="#3f3f46"
          trend="This month"
        />
        <StatCard
          title="Monthly Profit"
          value={formatCurrency(stats?.monthlyProfit ?? 0)}
          icon={TrendingDown}
          color="#52525b"
          trend="This month"
        />
        <StatCard
          title="Lifetime Sales"
          value={formatCurrency(stats?.lifetimeRevenue ?? 0)}
          icon={TrendingUp}
          color="#2563eb"
          trend="All time revenue"
        />
        <StatCard
          title="Total Products"
          value={String(stats?.totalProducts ?? 0)}
          icon={Package}
          color="#71717a"
          trend="Catalog size"
        />
        <StatCard
          title="Total Stock Value"
          value={formatCurrency(stats?.totalStockCost ?? 0)}
          icon={RefreshCw}
          color="#10b981"
          trend="At cost price"
        />
        <StatCard
          title="Low Stock"
          value={String(stats?.lowStockCount ?? 0)}
          icon={AlertTriangle}
          color="#ef4444"
          trend="Need reorder"
        />
        <StatCard
          title="Total Credit Sales"
          value={formatCurrency(stats?.lifetimeCreditSales ?? 0)}
          icon={CreditCard}
          color="#8b5cf6"
          trend="All time unpaid"
        />
        <StatCard
          title="Total Labour Cost"
          value={formatCurrency(stats?.lifetimeLabourCost ?? 0)}
          icon={Wrench}
          color="#f59e0b"
          trend="Total charged"
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '8px', color: 'black', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  formatter={(val: any) => formatCurrency(Number(val ?? 0))}
                />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Profit" />
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
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '8px', color: 'black', fontSize: '12px' }}
                  formatter={(val: any) => formatCurrency(Number(val ?? 0))}
                />
                <Legend formatter={(val) => <span className="text-[10px] uppercase tracking-widest text-zinc-600">{val}</span>} />
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
