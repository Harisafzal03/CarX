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
    const existing = get().items.find(i => i.product.id === product.id)
    if (existing) {
      set(state => ({
        items: state.items.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + 1, product.stock) }
            : i
        ),
      }))
    } else {
      set(state => ({
        items: [...state.items, { product, quantity: 1, unitPrice, purchaseItemId, purchasePrice }],
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
        i.product.id === productId ? { ...i, quantity } : i
      ),
    }))
  },

  clearCart: () => set({ items: [], discountPercentage: 0 }),

  subtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),

  setDiscountPercentage: (pct) => set({ discountPercentage: pct }),

  discountAmount: () => {
    const sub = get().subtotal()
    return (sub * get().discountPercentage) / 100
  },

  finalTotal: () => get().subtotal() - get().discountAmount(),
}))
