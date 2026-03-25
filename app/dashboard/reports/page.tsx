'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, DollarSign } from 'lucide-react'

export default function ReportsPage() {
  const [data, setData] = useState<{ dailyChartData: { date: string; revenue: number; profit: number }[]; stats: { monthlyRevenue: number; monthlyProfit: number; todayRevenue: number; todayProfit: number } } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Analytics and performance insights</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Today Revenue', value: data?.stats.todayRevenue ?? 0, color: 'hsl(221 83% 53%)' },
          { label: 'Today Profit', value: data?.stats.todayProfit ?? 0, color: 'hsl(142 71% 45%)' },
          { label: 'Monthly Revenue', value: data?.stats.monthlyRevenue ?? 0, color: 'hsl(280 65% 60%)' },
          { label: 'Monthly Profit', value: data?.stats.monthlyProfit ?? 0, color: 'hsl(38 92% 50%)' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</p>
              <p className="text-xl font-bold" style={{ color }}>{formatCurrency(value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Revenue — Last 7 Days</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data?.dailyChartData ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 20%)" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(222 47% 13%)', border: '1px solid hsl(222 47% 20%)', borderRadius: '12px' }} formatter={(v: any) => formatCurrency(Number(v) || 0)} />
                <Bar dataKey="revenue" fill="hsl(221, 83%, 53%)" radius={[6, 6, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Profit — Last 7 Days</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data?.dailyChartData ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 20%)" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(222 47% 13%)', border: '1px solid hsl(222 47% 20%)', borderRadius: '12px' }} formatter={(v: any) => formatCurrency(Number(v) || 0)} />
                <Line type="monotone" dataKey="profit" stroke="hsl(142, 71%, 45%)" strokeWidth={2.5} dot={{ fill: 'hsl(142, 71%, 45%)' }} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
