'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/sonner'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, PackagePlus, Image as ImageIcon, Pencil, X, ZoomIn, Eye } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface FormValues {
  supplier_name: string
  invoice_number: string
  purchase_date: string
  total_amount: number
  items: { product_id: string; quantity: number; purchase_price_per_unit: number; selling_price_per_unit: number; expiry_date?: string }[]
}

interface Purchase {
  id: string; supplier_name: string; invoice_number: string; purchase_date: string
  total_amount: number; image_url?: string | null; created_at: string
  purchase_items: { 
    id: string;
    product_id: string;
    quantity: number; 
    purchase_price_per_unit: number; 
    selling_price_per_unit: number; 
    expiry_date?: string;
    product: { name: string; sku: string } | null 
  }[]
}

interface Product { id: string; name: string; sku: string; category: string }

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editPurchase, setEditPurchase] = useState<Purchase | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [viewPurchase, setViewPurchase] = useState<Purchase | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, control, setValue, reset, watch, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      purchase_date: new Date().toISOString().split('T')[0],
      total_amount: 0,
      items: [{ product_id: '', quantity: 1, purchase_price_per_unit: 0, selling_price_per_unit: 0, expiry_date: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = useWatch({ control, name: 'items' })

  const totalPrice = React.useMemo(() => {
    return items?.reduce((sum, item) => {
      const q = Number(item.quantity) || 0
      const p = Number(item.purchase_price_per_unit) || 0
      return sum + (q * p)
    }, 0) || 0
  }, [items])

  useEffect(() => {
    setValue('total_amount', totalPrice)
  }, [totalPrice, setValue])

  const fetchData = async () => {
    setLoading(true)
    const [prRes, pdRes] = await Promise.all([fetch('/api/purchases'), fetch('/api/products')])
    setPurchases(await prRes.json())
    setProducts(await pdRes.json())
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return editPurchase?.image_url ?? null
    setUploading(true)
    const supabase = createClient()
    const ext = imageFile.name.split('.').pop()
    const path = `purchase-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('carx-purchases').upload(path, imageFile, { upsert: true })
    setUploading(false)
    if (error) { toast.error('Image upload failed: ' + error.message); return null }
    const { data } = supabase.storage.from('carx-purchases').getPublicUrl(path)
    return data.publicUrl
  }

  const openAdd = () => {
    setEditPurchase(null)
    setImageFile(null)
    setImagePreview(null)
    reset({ purchase_date: new Date().toISOString().split('T')[0], total_amount: 0, items: [{ product_id: '', quantity: 1, purchase_price_per_unit: 0, selling_price_per_unit: 0 }] })
    setOpen(true)
  }

  const openEdit = (p: Purchase) => {
    setEditPurchase(p)
    setImageFile(null)
    setImagePreview(p.image_url ?? null)
    reset({
      supplier_name: p.supplier_name,
      invoice_number: p.invoice_number,
      purchase_date: p.purchase_date,
      total_amount: p.total_amount,
      items: p.purchase_items.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        purchase_price_per_unit: i.purchase_price_per_unit,
        selling_price_per_unit: i.selling_price_per_unit,
        expiry_date: i.expiry_date || ''
      }))
    })
    setOpen(true)
  }

  const onSubmit = async (values: FormValues) => {
    const imageUrl = await uploadImage()

    const finalValues = { ...values, total_amount: totalPrice }
    if (editPurchase) {
      // Edit mode — update header and potentially items
      const res = await fetch('/api/purchases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editPurchase.id,
          ...finalValues,
          image_url: imageUrl
        }),
      })
      if (!res.ok) { toast.error('Failed to update purchase'); return }
      toast.success('Purchase updated!')
    } else {
      // Create mode
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...finalValues, image_url: imageUrl }),
      })
      if (!res.ok) { const e = await res.json(); toast.error(e?.error ?? 'Failed to save'); return }
      toast.success('Purchase recorded & stock updated!')
    }

    setOpen(false)
    setEditPurchase(null)
    setImageFile(null)
    setImagePreview(null)
    reset()
    fetchData()
  }



  return (
    <div className="p-6 space-y-6">
      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 animate-fade-in" onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={() => setLightboxUrl(null)}>
            <X className="w-8 h-8" />
          </button>
          <img src={lightboxUrl} alt="Purchase" className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchases</h1>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage stock purchases & batch records</p>
        </div>
        <Button onClick={openAdd} className="h-10 text-xs font-bold uppercase tracking-widest bg-black text-white hover:bg-zinc-800 transition-all active:scale-[0.98]">
          <Plus className="w-4 h-4" /> New Purchase
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={7} className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</TableCell></TableRow>}
              {!loading && purchases.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>No purchases yet.</TableCell></TableRow>}
              {purchases.map(p => (
                <React.Fragment key={p.id}>
                  <TableRow className="cursor-pointer" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                    <TableCell className="font-medium">{p.supplier_name}</TableCell>
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{p.invoice_number}</Badge></TableCell>
                    <TableCell>{new Date(p.purchase_date).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant="secondary">{p.purchase_items?.length ?? 0} items</Badge></TableCell>
                    <TableCell className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>{formatCurrency(p.total_amount)}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      {p.image_url ? (
                        <button onClick={() => setLightboxUrl(p.image_url!)} className="group relative">
                          <img src={p.image_url} alt="receipt" className="w-10 h-10 rounded-lg object-cover border" style={{ borderColor: 'hsl(var(--border))' }} />
                          <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="w-4 h-4 text-white" />
                          </div>
                        </button>
                      ) : <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>—</span>}
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewPurchase(p)} title="View">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedId === p.id && (
                    <TableRow key={`${p.id}-exp`}>
                      <TableCell colSpan={7} className="p-0">
                        <div className="px-6 py-4 grid grid-cols-2 gap-6" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                          <div>
                            <p className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Purchase Items</p>
                            <div className="space-y-1">
                              {p.purchase_items?.map((pi, i) => (
                                <div key={i} className="flex items-center gap-4 text-sm">
                                  <span className="font-medium">{pi.product?.name}</span>
                                  <Badge variant="outline" className="text-xs font-mono">{pi.product?.sku}</Badge>
                                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>Qty: {pi.quantity}</span>
                                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>Buy: {formatCurrency(pi.purchase_price_per_unit)}</span>
                                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>Sell: {formatCurrency(pi.selling_price_per_unit)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {p.image_url && (
                            <div>
                              <p className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Attached Image</p>
                              <button onClick={() => setLightboxUrl(p.image_url!)} className="group relative inline-block">
                                <img src={p.image_url} alt="receipt" className="h-40 rounded-xl object-cover border" style={{ borderColor: 'hsl(var(--border))' }} />
                                <div className="absolute inset-0 rounded-xl bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ZoomIn className="w-6 h-6 text-white" />
                                </div>
                              </button>
                            </div>
                          )}
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

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setEditPurchase(null); setImageFile(null); setImagePreview(null) } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              {editPurchase ? 'Edit Purchase' : 'New Purchase Entry'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier Name *</Label>
                <Input {...register('supplier_name', { required: true })} placeholder="e.g. Al-Fatah Auto" />
              </div>
              <div className="space-y-2">
                <Label>Invoice Number *</Label>
                <Input {...register('invoice_number', { required: true })} placeholder="INV-001" />
              </div>
              <div className="space-y-2">
                <Label>Purchase Date *</Label>
                <Input type="date" {...register('purchase_date', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Total (auto-computed)</Label>
                <div className="flex h-9 items-center px-3 rounded-md border text-sm font-semibold" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--muted)/0.4)', color: 'hsl(var(--primary))' }}>
                  {formatCurrency(totalPrice)}
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Attach Image (receipt / document)</Label>
              <div className="flex gap-3 items-start">
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-all hover:scale-[1.01]"
                  style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                  <ImageIcon className="w-4 h-4" />
                  {imageFile ? imageFile.name : 'Choose Image'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                {imagePreview && (
                  <div className="relative group">
                    <img src={imagePreview} alt="preview" className="h-16 w-16 rounded-lg object-cover border" style={{ borderColor: 'hsl(var(--border))' }} />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null) }}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Purchase Items</Label>
                  <Button type="button" size="sm" variant="outline"
                    onClick={() => append({ product_id: '', quantity: 1, purchase_price_per_unit: 0, selling_price_per_unit: 0, expiry_date: '' })}>
                    <Plus className="w-3 h-3" /> Add Item
                  </Button>
                </div>
                {fields.map((field, idx) => (
                  <div key={field.id} className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Item {idx + 1}</span>
                      {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs">Product *</Label>
                        <Select value={watch(`items.${idx}.product_id`)} onValueChange={v => setValue(`items.${idx}.product_id`, v)}>
                          <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                          <SelectContent>
                            {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                          <Label className="text-xs">Quantity *</Label>
                          <Input type="number" {...register(`items.${idx}.quantity`, { valueAsNumber: true })} placeholder="1" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Purchase Price/Unit *</Label>
                          <Input type="number" step="0.01" {...register(`items.${idx}.purchase_price_per_unit`, { valueAsNumber: true })} placeholder="0.00" />
                        </div>
                        <div className="space-y-2 col-span-2 p-3 rounded-lg border border-dashed border-white/10 bg-white/5">
                          <Label className="text-[10px] uppercase font-bold text-zinc-500">Row Total Helper</Label>
                          <div className="flex gap-3 items-center">
                            <Input 
                              type="number" 
                              placeholder="Type total to calc unit price" 
                              className="h-8 text-xs" 
                              onChange={(e) => {
                                const total = Number(e.target.value);
                                const qty = Number(watch(`items.${idx}.quantity`)) || 1;
                                if (total > 0) setValue(`items.${idx}.purchase_price_per_unit`, Number((total / qty).toFixed(2)));
                              }}
                            />
                            <div className="text-xs font-mono text-zinc-400 whitespace-nowrap">
                              Current: {formatCurrency((Number(watch(`items.${idx}.purchase_price_per_unit`)) || 0) * (Number(watch(`items.${idx}.quantity`)) || 0))}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Selling Price/Unit *</Label>
                          <Input type="number" step="0.01" {...register(`items.${idx}.selling_price_per_unit`, { valueAsNumber: true })} placeholder="0.00" />
                        </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Expiry Date (optional)</Label>
                        <Input type="date" {...register(`items.${idx}.expiry_date`)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Computed Total</p>
                <p className="text-xl font-bold" style={{ color: 'hsl(var(--primary))' }}>{formatCurrency(totalPrice)}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || uploading} className="h-10 text-xs font-bold uppercase tracking-widest bg-white text-black hover:bg-zinc-200">
                  {isSubmitting || uploading ? 'Saving...' : editPurchase ? 'Update Purchase' : 'Save Purchase'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Purchase Dialog */}
      <Dialog open={!!viewPurchase} onOpenChange={o => { if (!o) setViewPurchase(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              Purchase Details
            </DialogTitle>
          </DialogHeader>
          {viewPurchase && (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Supplier</p>
                  <p className="font-semibold">{viewPurchase.supplier_name}</p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Invoice #</p>
                  <Badge variant="outline" className="font-mono text-xs">{viewPurchase.invoice_number}</Badge>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Purchase Date</p>
                  <p className="font-medium">{new Date(viewPurchase.purchase_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Amount</p>
                  <p className="font-bold text-base" style={{ color: 'hsl(var(--primary))' }}>{formatCurrency(viewPurchase.total_amount)}</p>
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  ITEMS ({viewPurchase.purchase_items?.length ?? 0})
                </p>
                <div className="space-y-2">
                  {viewPurchase.purchase_items?.map((pi, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                      style={{ backgroundColor: 'hsl(var(--muted)/0.4)' }}>
                      <div>
                        <p className="font-medium">{pi.product?.name ?? '—'}</p>
                        <p className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{pi.product?.sku}</p>
                      </div>
                      <Badge variant="secondary">Qty: {pi.quantity}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attached Image */}
              {viewPurchase.image_url && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>ATTACHED IMAGE</p>
                    <button
                      onClick={() => setLightboxUrl(viewPurchase.image_url!)}
                      className="group relative w-full overflow-hidden rounded-xl border"
                      style={{ borderColor: 'hsl(var(--border))' }}
                    >
                      <img
                        src={viewPurchase.image_url}
                        alt="Purchase document"
                        className="w-full max-h-64 object-contain rounded-xl"
                        style={{ backgroundColor: 'hsl(var(--muted)/0.3)' }}
                      />
                      <div className="absolute inset-0 rounded-xl bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <ZoomIn className="w-6 h-6 text-white" />
                        <span className="text-white text-sm font-medium">Click to enlarge</span>
                      </div>
                    </button>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setViewPurchase(null)}>Close</Button>
                <Button onClick={() => { setViewPurchase(null); openEdit(viewPurchase) }} className="h-10 text-xs font-bold uppercase tracking-widest bg-white text-black hover:bg-zinc-200">
                  <Pencil className="w-4 h-4 mr-1" /> Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

