'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Receipt, TrendingUp, Eye, Printer, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/components/ui/sonner'

interface Sale {
  id: string
  customer_name: string | null
  subtotal: number
  discount_percentage: number
  discount_amount: number
  labour_cost: number
  final_total: number
  payment_method: string
  sale_date: string
  created_at: string
  sale_items: {
    id: string
    quantity: number
    unit_price: number
    purchase_price: number
    total_price: number
    profit: number
    product: { name: string; sku: string; category: string } | null
  }[]
}

const SHOP_NAME = 'CarX Auto Parts'
const PHONE_1 = '+92 306 3784205'
const PHONE_2 = '+92 313 6415972'

function printSlip(sale: Sale) {
  const logoUrl = window.location.origin + '/logo.png'
  const items = sale.sale_items.map(si => `
    <tr>
      <td style="padding:8px 4px;border-bottom:1px solid #eee;font-size:13px">
        <div style="font-weight:bold">${si.product?.name ?? '—'}</div>
        <div style="font-size:11px;color:#666">${si.product?.sku ?? ''}</div>
      </td>
      <td style="padding:8px 4px;border-bottom:1px solid #eee;text-align:center;font-size:13px">${si.quantity}</td>
      <td style="padding:8px 4px;border-bottom:1px solid #eee;text-align:right;font-size:13px">${si.unit_price.toFixed(2)}</td>
      <td style="padding:8px 4px;border-bottom:1px solid #eee;text-align:right;font-size:13px;font-weight:bold">${si.total_price.toFixed(2)}</td>
    </tr>`).join('')

  const discount = sale.discount_amount > 0
    ? `<tr><td colspan="3" style="text-align:right;padding:4px;font-size:13px;color:#16a34a">Discount (${sale.discount_percentage}%)</td><td style="text-align:right;padding:4px;font-size:13px;color:#16a34a">-PKR ${sale.discount_amount.toFixed(2)}</td></tr>`
    : ''

  const html = `<!DOCTYPE html><html><head><title>CarX Receipt - ${sale.id.slice(0, 8)}</title>
  <style>
    body{font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:380px;margin:0 auto;padding:20px;color:#111;line-height:1.4}
    .header{text-align:center;margin-bottom:20px}
    .logo{width:80px;height:80px;object-fit:contain;margin-bottom:10px;border-radius:12px;background:#000;padding:5px}
    h1{margin:0;font-size:24px;font-weight:900;letter-spacing:-0.5px;color:#000}
    .meta-info{margin:15px 0;font-size:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .meta-info p{margin:0}
    table{width:100%;border-collapse:collapse;margin:15px 0}
    th{background:#f8f9fa;padding:8px 4px;font-size:11px;text-align:left;text-transform:uppercase;letter-spacing:0.5px;color:#666;border-bottom:2px solid #000}
    th:nth-child(2){text-align:center}th:nth-child(3),th:nth-child(4){text-align:right}
    .total-table{width:100%;margin-top:10px}
    .total-row td{font-weight:900;font-size:18px;padding:12px 4px;border-top:2px solid #000;color:#000}
    .divider{border:none;border-top:1px dashed #ccc;margin:15px 0}
    .footer{text-align:center;font-size:11px;color:#666;margin-top:30px;padding-top:15px;border-top:1px solid #eee}
    @media print{body{padding:10px} .no-print{display:none}}
  </style></head><body>
  <div class="header">
    <img src="${logoUrl}" class="logo" alt="CarX Logo">
    <h1>${SHOP_NAME}</h1>
    <p style="font-size:12px;margin:4px 0;font-weight:500">${PHONE_1} | ${PHONE_2}</p>
  </div>
  
  <div class="meta-info">
    <div>
      <p style="color:#666;text-transform:uppercase;font-size:10px;font-weight:bold">Customer</p>
      <p style="font-weight:bold;font-size:14px">${sale.customer_name || 'Walk-in'}</p>
    </div>
    <div style="text-align:right">
      <p style="color:#666;text-transform:uppercase;font-size:10px;font-weight:bold">Date</p>
      <p style="font-weight:bold">${new Date(sale.sale_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
    </div>
    <div>
      <p style="color:#666;text-transform:uppercase;font-size:10px;font-weight:bold">Invoice #</p>
      <p style="font-family:monospace;font-weight:bold">${sale.id.slice(0, 8).toUpperCase()}</p>
    </div>
    <div style="text-align:right">
      <p style="color:#666;text-transform:uppercase;font-size:10px;font-weight:bold">Payment</p>
      <p style="font-weight:bold">${sale.payment_method.toUpperCase()}</p>
    </div>
  </div>

  <table>
    <thead><tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
    <tbody>${items}</tbody>
  </table>

  <table class="total-table">
    <tr><td colspan="3" style="text-align:right;padding:4px;font-size:13px;color:#666">Subtotal</td><td style="text-align:right;padding:4px;font-size:13px;font-weight:bold">PKR ${sale.subtotal.toFixed(2)}</td></tr>
    ${discount}
    <tr class="total-row"><td colspan="3" style="text-align:right">TOTAL</td><td style="text-align:right">PKR ${sale.final_total.toFixed(2)}</td></tr>
  </table>

  <div class="footer">
    <p style="font-weight:bold;color:#000;font-size:13px;margin-bottom:4px">Thank you for your business!</p>
    <p>Please keep this receipt for your records.<br>Software by CarX Systems</p>
  </div>

  <script>window.onload=()=>{setTimeout(() => { window.print(); window.onafterprint=()=>window.close(); }, 300)}<\/script>
  </body></html>`

  const w = window.open('', '_blank', 'width=450,height=700')
  if (w) { w.document.write(html); w.document.close() }
}

export default function OrdersPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selected, setSelected] = useState<Sale | null>(null)
  const [editSale, setEditSale] = useState<Sale | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editCustomer, setEditCustomer] = useState('')
  const [editDiscount, setEditDiscount] = useState(0)
  const [editLabourCost, setEditLabourCost] = useState(0)
  const [editPayment, setEditPayment] = useState<'cash' | 'online' | 'credit'>('cash')
  const [editDate, setEditDate] = useState('')

  const fetchSales = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    let params = ''
    if (filter === 'today') params = `from=${today}&to=${today}`
    else if (filter === 'month') {
      const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
      params = `from=${start}&to=${today}`
    } else if (filter === 'custom' && fromDate && toDate) {
      params = `from=${fromDate}&to=${toDate}`
    }
    const res = await fetch(`/api/sales?${params}&limit=100`)
    setSales(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchSales() }, [filter])
  useEffect(() => { if (filter === 'custom' && fromDate && toDate) fetchSales() }, [fromDate, toDate])

  const openEdit = (sale: Sale) => {
    setEditSale(sale)
    setEditCustomer(sale.customer_name ?? '')
    setEditDiscount(sale.discount_percentage)
    setEditLabourCost(sale.labour_cost || 0)
    setEditPayment(sale.payment_method as 'cash' | 'online' | 'credit')
    setEditDate(sale.sale_date)
  }

  const handleEdit = async () => {
    if (!editSale) return
    setSaving(true)
    const subtotal = editSale.sale_items.reduce((s, i) => s + i.total_price, 0)
    const discountAmount = (subtotal * editDiscount) / 100
    const finalTotal = subtotal + editLabourCost - discountAmount
    const res = await fetch('/api/sales', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editSale.id, customer_name: editCustomer || null, discount_percentage: editDiscount, discount_amount: discountAmount, labour_cost: editLabourCost, final_total: finalTotal, payment_method: editPayment, sale_date: editDate }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('Failed to update sale'); return }
    toast.success('Sale updated!')
    setEditSale(null)
    fetchSales()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/sales?id=${deleteTarget.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (!res.ok) { const e = await res.json(); toast.error(e?.error ?? 'Delete failed'); return }
    toast.success('Sale deleted & stock restored!')
    setDeleteTarget(null)
    setSelected(null)
    fetchSales()
  }

  const totalRevenue = sales.reduce((s, sale) => s + sale.final_total, 0)
  const totalProfit = sales.reduce((s, sale) => s + sale.sale_items.reduce((p, si) => p + si.profit, 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order History</h1>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{sales.length} orders found</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Period</Label>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {filter === 'custom' && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" className="w-36 h-9" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" className="w-36 h-9" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="glass overflow-hidden border-white/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-black/5 border border-black/10 flex-shrink-0">
              <Receipt className="w-6 h-6 text-black" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tighter">{formatCurrency(totalRevenue)}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass overflow-hidden border-white/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-black/5 border border-black/10 flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-black" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tighter">{formatCurrency(totalProfit)}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Profit</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={8} className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading orders...</TableCell></TableRow>}
              {!loading && sales.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>No orders found.</TableCell></TableRow>}
              {sales.map(sale => {
                const profit = sale.sale_items.reduce((p, si) => p + si.profit, 0)
                return (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.customer_name || 'Walk-in'}</TableCell>
                    <TableCell><Badge variant="secondary">{sale.sale_items.length} items</Badge></TableCell>
                    <TableCell style={{ color: 'hsl(142 71% 45%)' }}>{sale.discount_percentage > 0 ? `${sale.discount_percentage}%` : '—'}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(sale.final_total)}</TableCell>
                    <TableCell style={{ color: 'hsl(142 71% 45%)' }}>{formatCurrency(profit)}</TableCell>
                    <TableCell><Badge variant={sale.payment_method === 'cash' ? 'success' : 'default'}>{sale.payment_method}</Badge></TableCell>
                    <TableCell className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setSelected(sale)} title="View Details"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => printSlip(sale)} title="Print Receipt"><Printer className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(sale)} title="Edit Sale"><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(sale)} title="Delete Sale"><Trash2 className="w-4 h-4 text-red-400" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} /> Sale Details
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span style={{ color: 'hsl(var(--muted-foreground))' }}>Customer: </span>{selected.customer_name || 'Walk-in'}</div>
                <div><span style={{ color: 'hsl(var(--muted-foreground))' }}>Date: </span>{new Date(selected.sale_date).toLocaleDateString()}</div>
                <div><span style={{ color: 'hsl(var(--muted-foreground))' }}>Payment: </span>
                  <Badge variant={selected.payment_method === 'cash' ? 'success' : 'default'} className="ml-1">{selected.payment_method}</Badge>
                </div>
                <div><span style={{ color: 'hsl(var(--muted-foreground))' }}>Discount: </span>{selected.discount_percentage}%</div>
              </div>
              <Separator />
              <div className="space-y-2">
                {selected.sale_items.map((si, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{si.product?.name}</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{si.quantity} × {formatCurrency(si.unit_price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(si.total_price)}</p>
                      <p className="text-xs" style={{ color: 'hsl(142 71% 45%)' }}>+{formatCurrency(si.profit)} profit</p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span style={{ color: 'hsl(var(--muted-foreground))' }}>Subtotal</span><span>{formatCurrency(selected.subtotal)}</span></div>
                {selected.discount_amount > 0 && <div className="flex justify-between text-green-400"><span>Discount</span><span>-{formatCurrency(selected.discount_amount)}</span></div>}
                {selected.labour_cost > 0 && <div className="flex justify-between"><span>Labour Cost</span><span>+{formatCurrency(selected.labour_cost)}</span></div>}
                <div className="flex justify-between font-bold text-base"><span>Total</span><span style={{ color: 'hsl(var(--primary))' }}>{formatCurrency(selected.final_total)}</span></div>
                <div className="flex justify-between" style={{ color: 'hsl(142 71% 45%)' }}>
                  <span>Net Profit</span>
                  <span className="font-semibold">{formatCurrency(selected.sale_items.reduce((p, si) => p + si.profit, 0))}</span>
                </div>
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button className="flex-1 gap-2" variant="outline" onClick={() => { setSelected(null); openEdit(selected) }}>
                  <Pencil className="w-4 h-4" /> Edit
                </Button>
                <Button className="flex-1 h-11 text-xs font-bold uppercase tracking-widest gap-2 bg-white text-black hover:bg-zinc-200 transition-colors" onClick={() => printSlip(selected)}>
                  <Printer className="w-4 h-4" /> Print Slip
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editSale} onOpenChange={o => { if (!o) setEditSale(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} /> Edit Sale
            </DialogTitle>
          </DialogHeader>
          {editSale && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input placeholder="Walk-in" value={editCustomer} onChange={e => setEditCustomer(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Discount %</Label>
                <Input type="number" min={0} max={100} value={editDiscount} onChange={e => setEditDiscount(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Labour Cost</Label>
                <Input type="number" min={0} value={editLabourCost} onChange={e => setEditLabourCost(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={editPayment} onValueChange={v => setEditPayment(v as 'cash' | 'online' | 'credit')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sale Date</Label>
                <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
              </div>
              <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'hsl(var(--muted)/0.5)' }}>
                <div className="flex justify-between"><span style={{ color: 'hsl(var(--muted-foreground))' }}>Subtotal</span><span>{formatCurrency(editSale.sale_items.reduce((s, i) => s + i.total_price, 0))}</span></div>
                <div className="flex justify-between text-green-400">
                  <span>Discount ({editDiscount}%)</span>
                  <span>-{formatCurrency((editSale.sale_items.reduce((s, i) => s + i.total_price, 0) * editDiscount) / 100)}</span>
                </div>
                <div className="flex justify-between" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <span>Labour</span>
                  <span>+{formatCurrency(editLabourCost)}</span>
                </div>
                <div className="flex justify-between font-bold mt-1" style={{ color: 'hsl(var(--primary))' }}>
                  <span>New Total</span>
                  <span>{formatCurrency(editSale.sale_items.reduce((s, i) => s + i.total_price, 0) * (1 - editDiscount / 100) + editLabourCost)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditSale(null)}>Cancel</Button>
                <Button className="flex-1 h-11 text-xs font-bold uppercase tracking-widest bg-white text-black hover:bg-zinc-200" onClick={handleEdit} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" /> Delete Sale
            </DialogTitle>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Delete sale for <strong style={{ color: 'hsl(var(--foreground))' }}>{deleteTarget.customer_name || 'Walk-in'}</strong> ({formatCurrency(deleteTarget.final_total)})?
                This will <strong style={{ color: 'hsl(142 71% 45%)' }}>restore all deducted stock</strong> back to inventory batches.
              </p>
              <div className="p-3 rounded-lg text-xs space-y-1" style={{ backgroundColor: 'hsl(0 84% 60% / 0.1)', borderLeft: '3px solid hsl(0 84% 60%)' }}>
                {deleteTarget.sale_items.map((si, i) => (
                  <p key={i}>↩ Restore <strong>{si.quantity}</strong> × {si.product?.name}</p>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Yes, Delete & Restore'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
