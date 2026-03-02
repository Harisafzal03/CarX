'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/sonner'
import { Plus, Search, Package, Edit } from 'lucide-react'

interface FormValues {
  name: string
  category: string
  brand: string
  car_model?: string
  description?: string
  minimum_threshold: number
}

interface Product {
  id: string
  name: string
  sku: string
  category: string
  brand: string
  car_model: string | null
  description: string | null
  minimum_threshold: number
  created_at: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: { minimum_threshold: 5 },
  })

  const fetchProducts = async () => {
    setLoading(true)
    const [prodRes, catRes] = await Promise.all([
      fetch(`/api/products?search=${search}`),
      fetch('/api/categories'),
    ])
    setProducts(await prodRes.json())
    const cats: { name: string }[] = await catRes.json()
    setCategories(cats.map(c => c.name))
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [search])

  const onSubmit = async (values: FormValues) => {
    const url = '/api/products'
    const method = editProduct ? 'PUT' : 'POST'
    const body = editProduct ? { ...values, id: editProduct.id } : values

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { toast.error('Failed to save product'); return }
    toast.success(editProduct ? 'Product updated' : 'Product created')
    setOpen(false)
    setEditProduct(null)
    reset()
    fetchProducts()
  }

  const openEdit = (p: Product) => {
    setEditProduct(p)
    reset({ name: p.name, category: p.category, brand: p.brand, car_model: p.car_model ?? '', description: p.description ?? '', minimum_threshold: p.minimum_threshold })
    setValue('category', p.category)
    setOpen(true)
  }

  const openAdd = () => { setEditProduct(null); reset({ minimum_threshold: 5 }); setOpen(true) }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{products.length} products in catalog</p>
        </div>
        <Button onClick={openAdd} className="h-10 text-xs font-bold uppercase tracking-widest bg-black text-white hover:bg-zinc-800 transition-all active:scale-[0.98]">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
        <Input className="pl-9" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Car Model</TableHead>
                <TableHead>Min Stock</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={7} className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</TableCell></TableRow>}
              {!loading && products.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>No products found. Create your first product.</TableCell></TableRow>}
              {products.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><Badge variant="outline" className="font-mono text-xs">{p.sku}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{p.category}</Badge></TableCell>
                  <TableCell>{p.brand}</TableCell>
                  <TableCell style={{ color: 'hsl(var(--muted-foreground))' }}>{p.car_model || '—'}</TableCell>
                  <TableCell>{p.minimum_threshold}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              {editProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Name *</Label>
                <Input {...register('name')} placeholder="e.g. K&N Air Filter" />
                {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Brand *</Label>
                <Input {...register('brand')} placeholder="e.g. K&N" />
                {errors.brand && <p className="text-xs text-red-400">{errors.brand.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select onValueChange={v => setValue('category', v)} defaultValue={editProduct?.category}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-red-400">{errors.category.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Car Model (optional)</Label>
                <Input {...register('car_model')} placeholder="e.g. Toyota Corolla" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Min Stock Threshold</Label>
              <Input type="number" {...register('minimum_threshold', { valueAsNumber: true, min: 0 })} placeholder="5" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea {...register('description')} placeholder="Optional description..." rows={2} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 h-11 text-xs font-bold uppercase tracking-widest bg-white text-black hover:bg-zinc-200" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
