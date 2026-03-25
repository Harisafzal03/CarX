import { create } from 'zustand'
import { CartItem, ProductWithStock } from '@/lib/types'

interface CartStore {
  items: CartItem[]
  addItem: (product: ProductWithStock, purchaseItemId: string, purchasePrice: number, unitPrice: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  subtotal: () => number
  discountPercentage: number
  setDiscountPercentage: (pct: number) => void
  discountAmount: () => number
  finalTotal: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  discountPercentage: 0,

  addItem: (product, purchaseItemId, purchasePrice, unitPrice) => {
    const pPrice = Number(purchasePrice) || 0
    const uPrice = Number(unitPrice) || 0
    const existing = get().items.find(i => i.product.id === product.id)
    if (existing) {
      set(state => ({
        items: state.items.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + 1, product.stock), unitPrice: uPrice, purchasePrice: pPrice }
            : i
        ),
      }))
    } else {
      set(state => ({
        items: [...state.items, { product, quantity: 1, unitPrice: uPrice, purchaseItemId, purchasePrice: pPrice }],
      }))
    }
  },

  removeItem: (productId) => {
    set(state => ({ items: state.items.filter(i => i.product.id !== productId) }))
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    set(state => ({
      items: state.items.map(i =>
        i.product.id === productId ? { ...i, quantity: Math.floor(quantity) } : i
      ),
    }))
  },

  clearCart: () => set({ items: [], discountPercentage: 0 }),

  subtotal: () => {
    const sub = get().items.reduce((sum, i) => sum + (Number(i.unitPrice) || 0) * i.quantity, 0)
    return isNaN(sub) ? 0 : sub
  },

  setDiscountPercentage: (pct) => set({ discountPercentage: Number(pct) || 0 }),

  discountAmount: () => {
    const sub = get().subtotal()
    const pct = Number(get().discountPercentage) || 0
    return (sub * pct) / 100
  },

  finalTotal: () => {
    const total = get().subtotal() - get().discountAmount()
    return isNaN(total) ? 0 : total
  },
}))
