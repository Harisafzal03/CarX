'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, AlertTriangle, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  brand: string
  car_model: string | null
  minimum_threshold: number
  stock: number
  isLowStock: boolean
  batches: {
    id: string
    batch_number: string
    remaining_quantity: number
    selling_price_per_unit: number
    expiry_date: string | null
  }[]
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterLow, setFilterLow] = useState(false)

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true)
      const res = await fetch('/api/inventory')
      setInventory(await res.json())
      setLoading(false)
    }
    fetch_()
  }, [])

  const filtered = inventory.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase())
    const matchLow = !filterLow || item.isLowStock
    return matchSearch && matchLow
  })

  const lowCount = inventory.filter(i => i.isLowStock).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Real-time stock levels across all batches</p>
        </div>
        <div className="flex items-center gap-2">
          {lowCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="w-3 h-3" />{lowCount} Low Stock
            </Badge>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/5 border border-black/10">
              <Package className="w-5 h-5 text-black" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inventory.length}</p>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Products</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-400/10 border border-zinc-400/20">
              <Package className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inventory.filter(i => i.stock > 0).length}</p>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>In Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{lowCount}</p>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Low Stock</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <Input className="pl-9" placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button
          onClick={() => setFilterLow(!filterLow)}
          className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
            filterLow ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 inline mr-2" />
          Low Stock Only
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Min Threshold</TableHead>
                <TableHead>Batches</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={7} className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading inventory...</TableCell></TableRow>}
              {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>No items found.</TableCell></TableRow>}
              {filtered.map(item => (
                <React.Fragment key={item.id}>
                  <TableRow key={item.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{item.sku}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                    <TableCell>
                      <span className={`text-lg font-bold tracking-tighter ${item.isLowStock ? 'text-red-500' : 'text-black'}`}>
                        {item.stock}
                      </span>
                    </TableCell>
                    <TableCell style={{ color: 'hsl(var(--muted-foreground))' }}>{item.minimum_threshold}</TableCell>
                    <TableCell><Badge variant="outline">{item.batches.length} batches</Badge></TableCell>
                    <TableCell>
                      {item.stock === 0 ? <Badge variant="destructive">Out of Stock</Badge>
                        : item.isLowStock ? <Badge variant="warning">Low Stock</Badge>
                        : <Badge variant="success">In Stock</Badge>}
                    </TableCell>
                  </TableRow>
                  {expandedId === item.id && item.batches.length > 0 && (
                    <TableRow key={`${item.id}-batches`}>
                      <TableCell colSpan={7} className="p-0">
                        <div className="px-6 py-3" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                          <p className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Batch Details</p>
                          <div className="grid grid-cols-3 gap-2">
                            {item.batches.map((batch, i) => (
                              <div key={i} className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'hsl(var(--card))' }}>
                                <p className="font-mono text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{batch.batch_number}</p>
                                <p className="font-semibold">{batch.remaining_quantity} units</p>
                                <p style={{ color: 'hsl(var(--primary))' }}>{formatCurrency(batch.selling_price_per_unit)}/unit</p>
                                {batch.expiry_date && <p className="text-xs mt-1 text-orange-400">Exp: {new Date(batch.expiry_date).toLocaleDateString()}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
