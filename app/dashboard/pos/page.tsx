'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/sonner'
import { useCartStore } from '@/lib/stores/cart'
import { formatCurrency } from '@/lib/utils'
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, CheckCircle, Printer, X, Package } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { ProductWithStock } from '@/lib/types'

export default function POSPage() {
  const [products, setProducts] = useState<ProductWithStock[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash')
  const [checkingOut, setCheckingOut] = useState(false)
  const [success, setSuccess] = useState(false)
  const [lastSale, setLastSale] = useState<any>(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)

  const {
    items, addItem, removeItem, updateQuantity, clearCart,
    subtotal, discountPercentage, setDiscountPercentage, discountAmount, finalTotal
  } = useCartStore()

  const fetchProducts = async (q: string) => {
    setLoading(true)
    const res = await fetch(`/api/inventory?` + (q ? `search=${q}` : ''))
    const data = await res.json()
    setProducts(data?.filter((p: ProductWithStock) => p.stock > 0) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    const t = setTimeout(() => fetchProducts(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const handleAddToCart = (product: ProductWithStock) => {
    if (product.stock <= 0) { toast.error('Out of stock'); return }
    const firstBatch = product.batches?.[0]
    if (!firstBatch) { toast.error('No batch available'); return }
    addItem(
      product,
      firstBatch.id,
      firstBatch.purchase_price_per_unit ?? 0,
      firstBatch.selling_price_per_unit
    )
    toast.success(`${product.name} added to cart`)
  }

  const handleCheckout = async () => {
    if (items.length === 0) { toast.error('Cart is empty'); return }

    // Guard: if any item is missing a batch reference (stale cart), force refresh
    const missingBatch = items.find(i => !i.purchaseItemId)
    if (missingBatch) {
      clearCart()
      await fetchProducts('')
      toast.error(`Cart was outdated — cleared. Please re-add "${missingBatch.product.name}" and try again.`)
      return
    }

    setCheckingOut(true)

    const saleData = {
      customer_name: customerName || null,
      subtotal: subtotal(),
      discount_percentage: discountPercentage,
      discount_amount: discountAmount(),
      final_total: finalTotal(),
      payment_method: paymentMethod,
      sale_date: new Date().toISOString().split('T')[0],
      items: items.map(i => ({
        product_id: i.product.id,
        purchase_item_id: i.purchaseItemId,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        purchase_price: i.purchasePrice,
      })),
    }

    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData),
    })

    setCheckingOut(false)

    const sale = await res.json()
    setLastSale({ ...saleData, id: sale.id, sale_items: items.map(i => ({ ...i, total_price: i.unitPrice * i.quantity, product: i.product })) })
    setSuccess(true)
    setShowReceiptModal(true)
    clearCart()
    setCustomerName('')
    fetchProducts('')
    toast.success('Sale completed successfully!')
  }

  const printReceipt = () => {
    if (!lastSale) return
    const logoUrl = window.location.origin + '/logo.png'
    const itemsHtml = lastSale.items.map((item: any) => {
      const product = products.find(p => p.id === item.product_id)
      return `
        <tr>
          <td style="padding:8px 4px;border-bottom:1px solid #eee;font-size:13px">
            <div style="font-weight:bold">${product?.name ?? 'Item'}</div>
            <div style="font-size:11px;color:#666">${product?.sku ?? ''}</div>
          </td>
          <td style="padding:8px 4px;border-bottom:1px solid #eee;text-align:center;font-size:13px">${item.quantity}</td>
          <td style="padding:8px 4px;border-bottom:1px solid #eee;text-align:right;font-size:13px">${item.unit_price.toFixed(2)}</td>
          <td style="padding:8px 4px;border-bottom:1px solid #eee;text-align:right;font-size:13px;font-weight:bold">${(item.unit_price * item.quantity).toFixed(2)}</td>
        </tr>`
    }).join('')

    const discountHtml = lastSale.discount_amount > 0
      ? `<tr><td colspan="3" style="text-align:right;padding:4px;font-size:13px;color:#16a34a">Discount (${lastSale.discount_percentage}%)</td><td style="text-align:right;padding:4px;font-size:13px;color:#16a34a">-PKR ${lastSale.discount_amount.toFixed(2)}</td></tr>`
      : ''

    const html = `<!DOCTYPE html><html><head><title>CarX Receipt - ${lastSale.id.slice(0, 8)}</title>
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
      .footer{text-align:center;font-size:11px;color:#666;margin-top:30px;padding-top:15px;border-top:1px solid #eee}
    </style></head><body>
    <div class="header">
      <img src="${logoUrl}" class="logo" alt="CarX Logo">
      <h1>CarX Auto Parts</h1>
      <p style="font-size:12px;margin:4px 0;font-weight:500">+92 306 3784205 | +92 313 6415972</p>
    </div>
    <div class="meta-info">
      <div><p style="color:#666;text-transform:uppercase;font-size:10px;font-weight:bold">Customer</p><p style="font-weight:bold;font-size:14px">${lastSale.customer_name || 'Walk-in'}</p></div>
      <div style="text-align:right"><p style="color:#666;text-transform:uppercase;font-size:10px;font-weight:bold">Date</p><p style="font-weight:bold">${new Date(lastSale.sale_date).toLocaleDateString()}</p></div>
      <div><p style="color:#666;text-transform:uppercase;font-size:10px;font-weight:bold">Invoice #</p><p style="font-family:monospace;font-weight:bold">${lastSale.id.slice(0, 8).toUpperCase()}</p></div>
      <div style="text-align:right"><p style="color:#666;text-transform:uppercase;font-size:10px;font-weight:bold">Payment</p><p style="font-weight:bold">${lastSale.payment_method.toUpperCase()}</p></div>
    </div>
    <table><thead><tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
    <table class="total-table">
      <tr><td colspan="3" style="text-align:right;padding:4px;font-size:13px;color:#666">Subtotal</td><td style="text-align:right;padding:4px;font-size:13px;font-weight:bold">PKR ${lastSale.subtotal.toFixed(2)}</td></tr>
      ${discountHtml}
      <tr class="total-row"><td colspan="3" style="text-align:right">TOTAL</td><td style="text-align:right">PKR ${lastSale.final_total.toFixed(2)}</td></tr>
    </table>
    <div class="footer"><p style="font-weight:bold;color:#000;font-size:13px;margin-bottom:4px">Thank you for your business!</p><p>Please keep this receipt for your records.<br>Software by CarX Systems</p></div>
    <script>window.onload=()=>{setTimeout(() => { window.print(); window.onafterprint=()=>window.close(); }, 300)}<\/script>
    </body></html>`

    const w = window.open('', '_blank', 'width=450,height=700')
    if (w) { w.document.write(html); w.document.close() }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-6 animate-fade-in text-center px-6">
        <div className="w-24 h-24 rounded-full flex items-center justify-center bg-green-500/10 border-4 border-green-500 animate-bounce">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight">SALE COMPLETED!</h2>
          <p className="text-zinc-500 max-w-sm mx-auto">The transaction has been recorded and stock levels have been updated.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm pt-4">
          <Button 
            className="flex-1 h-14 text-base font-bold uppercase tracking-widest gap-2 bg-black text-white hover:bg-zinc-800"
            onClick={printReceipt}
          >
            <Printer className="w-5 h-5" /> Print Receipt
          </Button>
          <Button 
            variant="outline"
            className="flex-1 h-14 text-base font-bold uppercase tracking-widest"
            onClick={() => { setSuccess(false); setShowReceiptModal(false); setLastSale(null); }}
          >
            Next Sale
          </Button>
        </div>

        <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Receipt Ready
              </DialogTitle>
            </DialogHeader>
            <div className="py-6 text-center space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800">
                <p className="text-sm text-zinc-500">Invoice Amount</p>
                <p className="text-3xl font-black">{formatCurrency(lastSale?.final_total || 0)}</p>
              </div>
              <p className="text-sm text-zinc-500">Would you like to print a copy for the customer?</p>
              <div className="flex gap-3 pt-2">
                <Button className="flex-1 h-12 gap-2 bg-black text-white" onClick={printReceipt}>
                  <Printer className="w-4 h-4" /> Print Now
                </Button>
                <Button variant="outline" className="flex-1 h-12" onClick={() => setShowReceiptModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* Products Panel */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-1">Point of Sale</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <Input className="pl-9" placeholder="Search products by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <p className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>Searching...</p>}
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {products.map(product => {
              const inCart = items.find(i => i.product.id === product.id)
              return (
                <Card key={product.id}
                  className="cursor-pointer hover:scale-[1.02] transition-all duration-200 relative overflow-hidden"
                  style={{ borderColor: inCart ? 'hsl(var(--primary))' : undefined }}
                >
                  {inCart && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold z-10"
                      style={{ background: 'hsl(var(--primary))' }}>
                      {inCart.quantity}
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex gap-3 mb-2">
                      <div 
                        className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-black/5 bg-black/5 group relative"
                        onClick={(e) => { e.stopPropagation(); product.image_url && setEnlargedImage(product.image_url); }}
                      >
                        {product.image_url ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 opacity-20" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0" onClick={() => handleAddToCart(product)}>
                        <p className="font-semibold text-sm line-clamp-2">{product.name}</p>
                        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{product.brand}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2" onClick={() => handleAddToCart(product)}>
                      <Badge variant="secondary" className="text-[10px] px-1.5 h-4">{product.category}</Badge>
                      <Badge variant={product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'destructive'} className="text-[10px] px-1.5 h-4">
                        {product.stock} in stock
                      </Badge>
                    </div>
                    {product.batches?.[0] && (
                      <p className="text-base font-bold mt-2" style={{ color: 'hsl(var(--primary))' }} onClick={() => handleAddToCart(product)}>
                        {formatCurrency(product.batches[0].selling_price_per_unit)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
            {!loading && products.length === 0 && (
              <div className="col-span-3 text-center py-12" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No products found with stock</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-96 flex flex-col border-l" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--sidebar))' }}>
        <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: 'hsl(var(--border))' }}>
          <ShoppingCart className="w-5 h-5 text-white" />
          <h2 className="font-semibold text-white">Cart</h2>
          <Badge variant="secondary" className="ml-auto">{items.length} items</Badge>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-400 hover:text-red-300 h-6 px-2 text-xs">Clear</Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 && (
            <div className="text-center py-8 text-white/50">
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Click a product to add it</p>
            </div>
          )}
          {items.map(item => (
            <div key={item.product.id} className="rounded-xl p-3" style={{ backgroundColor: 'hsl(var(--card))' }}>
              <div className="flex items-start gap-3">
                <div 
                  className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-black/20 flex-shrink-0 cursor-pointer hover:bg-black/30 transition-all"
                  onClick={() => item.product.image_url && setEnlargedImage(item.product.image_url)}
                >
                  {item.product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-white/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => removeItem(item.product.id)}>
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </Button>
                  </div>
                  <p className="text-xs text-white/60">{formatCurrency(item.unitPrice)} each</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => updateQuantity(item.product.id, Math.min(item.quantity + 1, item.product.stock))}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <span className="text-sm font-bold text-white">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Area */}
        <div className="p-4 border-t space-y-4" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-white/90">Customer Name (optional)</Label>
              <Input className="h-8 text-sm" placeholder="Walk-in customer" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-white/90">Discount %</Label>
              <Input className="h-8 text-sm" type="number" min="0" max="100" placeholder="0"
                value={discountPercentage || ''} onChange={e => setDiscountPercentage(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-white/90">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v: 'cash' | 'online') => setPaymentMethod(v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <span className="flex items-center gap-2"><Banknote className="w-4 h-4" />Cash</span>
                  </SelectItem>
                  <SelectItem value="online">
                    <span className="flex items-center gap-2"><CreditCard className="w-4 h-4" />Online</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">Subtotal</span>
              <span className="text-white font-medium">{formatCurrency(subtotal())}</span>
            </div>
            {discountPercentage > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/70">Discount ({discountPercentage}%)</span>
                <span className="text-green-400 font-medium">-{formatCurrency(discountAmount())}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-1 text-white">
              <span>Total</span>
              <span className="text-[#2563eb] font-black">
                {formatCurrency(finalTotal())}
              </span>
            </div>
          </div>

          <Button className="w-full h-11 text-base font-semibold" onClick={handleCheckout}
            disabled={items.length === 0 || checkingOut}
            style={{ background: 'linear-gradient(135deg, hsl(142 71% 45%), hsl(160 70% 48%))' }}>
            {checkingOut ? 'Processing...' : `Complete Sale · ${formatCurrency(finalTotal())}`}
          </Button>
        </div>
      </div>

      {/* Enlarged Image Modal */}
      <Dialog open={!!enlargedImage} onOpenChange={(o) => !o && setEnlargedImage(null)}>
        <DialogContent className="max-w-4xl p-1 bg-black overflow-hidden border-none shadow-2xl">
          <DialogHeader className="hidden">
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {enlargedImage && (
            <div className="relative w-full h-[80vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={enlargedImage} alt="Enlarged" className="w-full h-full object-contain" />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 text-white bg-black/40 hover:bg-black/60 rounded-full"
                onClick={() => setEnlargedImage(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
