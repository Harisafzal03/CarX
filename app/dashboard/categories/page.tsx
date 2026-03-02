'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/sonner'
import { Plus, Trash2, Tag, Loader2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  created_at: string
}

interface ProductCount {
  category: string
  count: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [productCounts, setProductCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const [catRes, prodRes] = await Promise.all([
      fetch('/api/categories'),
      fetch('/api/products'),
    ])
    const cats: Category[] = await catRes.json()
    const prods: { category: string }[] = await prodRes.json()

    // Build category → product count map
    const counts: Record<string, number> = {}
    prods.forEach(p => {
      counts[p.category] = (counts[p.category] ?? 0) + 1
    })

    setCategories(cats)
    setProductCounts(counts)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleAdd = async () => {
    if (!newName.trim()) { toast.error('Enter a category name'); return }
    setAdding(true)
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed to add'); setAdding(false); return }
    toast.success(`Category "${newName.trim()}" added`)
    setNewName('')
    setAdding(false)
    fetchData()
  }

  const handleDelete = async (cat: Category) => {
    setDeletingId(cat.id)
    const res = await fetch(`/api/categories?id=${cat.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed to delete'); setDeletingId(null); return }
    toast.success(`"${cat.name}" deleted`)
    setDeletingId(null)
    fetchData()
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Manage product categories — {categories.length} total
        </p>
      </div>

      {/* Add Category */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-semibold mb-3">Add New Category</p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <Input
                className="pl-9"
                placeholder="e.g. Brake Pads"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
              />
            </div>
            <Button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              style={{ background: 'linear-gradient(135deg, hsl(221 83% 53%), hsl(240 83% 60%))' }}
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      {loading ? (
        <div className="text-center py-12" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <Loader2 className="w-8 h-8 mx-auto animate-spin mb-2" />
          <p className="text-sm">Loading categories...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map(cat => {
            const count = productCounts[cat.name] ?? 0
            return (
              <Card key={cat.id} className="group hover:scale-[1.01] transition-all duration-200">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'hsl(221 83% 53% / 0.12)' }}>
                      <Tag className="w-4 h-4" style={{ color: 'hsl(221 83% 53%)' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{cat.name}</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Added {new Date(cat.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={count > 0 ? 'secondary' : 'outline'} className="text-xs">
                      {count} {count === 1 ? 'product' : 'products'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(cat)}
                      disabled={deletingId === cat.id}
                      title={count > 0 ? 'Cannot delete — has products' : 'Delete category'}
                    >
                      {deletingId === cat.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5 text-red-400" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {categories.length === 0 && (
            <div className="col-span-3 text-center py-12" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No categories yet. Add your first one above.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
