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
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, CheckCircle } from 'lucide-react'

import { ProductWithStock } from '@/lib/types'

export default function POSPage() {
  const [products, setProducts] = useState<ProductWithStock[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash')
  const [checkingOut, setCheckingOut] = useState(false)
  const [success, setSuccess] = useState(false)

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

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err?.error ?? 'Sale failed. Check stock & try again.')
      return
    }

    setSuccess(true)
    clearCart()
    setCustomerName('')
    setTimeout(() => { setSuccess(false); fetchProducts('') }, 3000)
    toast.success('Sale completed successfully!')
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4 animate-fade-in">
        <div className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, hsl(142 71% 45%), hsl(160 70% 48%))' }}>
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Sale Complete!</h2>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>Stock updated. Ready for next sale.</p>
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
                  onClick={() => handleAddToCart(product)}
                  style={{ borderColor: inCart ? 'hsl(var(--primary))' : undefined }}
                >
                  {inCart && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold"
                      style={{ background: 'hsl(var(--primary))' }}>
                      {inCart.quantity}
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{product.name}</p>
                        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{product.brand}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                      <Badge variant={product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'destructive'} className="text-xs">
                        {product.stock} in stock
                      </Badge>
                    </div>
                    {product.batches?.[0] && (
                      <p className="text-base font-bold mt-2" style={{ color: 'hsl(var(--primary))' }}>
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
          <ShoppingCart className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
          <h2 className="font-semibold">Cart</h2>
          <Badge variant="secondary" className="ml-auto">{items.length} items</Badge>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-400 hover:text-red-300 h-6 px-2 text-xs">Clear</Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 && (
            <div className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Click a product to add it</p>
            </div>
          )}
          {items.map(item => (
            <div key={item.product.id} className="rounded-xl p-3" style={{ backgroundColor: 'hsl(var(--card))' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product.name}</p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{formatCurrency(item.unitPrice)} each</p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => removeItem(item.product.id)}>
                  <Trash2 className="w-3 h-3 text-red-400" />
                </Button>
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
                <span className="text-sm font-bold" style={{ color: 'hsl(var(--primary))' }}>
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
              <Label className="text-xs">Customer Name (optional)</Label>
              <Input className="h-8 text-sm" placeholder="Walk-in customer" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Discount %</Label>
              <Input className="h-8 text-sm" type="number" min="0" max="100" placeholder="0"
                value={discountPercentage || ''} onChange={e => setDiscountPercentage(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Payment Method</Label>
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
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>Subtotal</span>
              <span>{formatCurrency(subtotal())}</span>
            </div>
            {discountPercentage > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Discount ({discountPercentage}%)</span>
                <span>-{formatCurrency(discountAmount())}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-1">
              <span>Total</span>
              <span style={{ color: 'hsl(var(--primary))' }}>{formatCurrency(finalTotal())}</span>
            </div>
          </div>

          <Button className="w-full h-11 text-base font-semibold" onClick={handleCheckout}
            disabled={items.length === 0 || checkingOut}
            style={{ background: 'linear-gradient(135deg, hsl(142 71% 45%), hsl(160 70% 48%))' }}>
            {checkingOut ? 'Processing...' : `Complete Sale · ${formatCurrency(finalTotal())}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
