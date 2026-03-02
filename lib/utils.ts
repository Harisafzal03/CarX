import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function generateSKU(category: string, brand: string): string {
  const cat = category.slice(0, 3).toUpperCase()
  const br = brand.slice(0, 3).toUpperCase()
  const num = Math.floor(Math.random() * 9000) + 1000
  return `${cat}-${br}-${num}`
}

export function generateBatchNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `BATCH-${dateStr}-${rand}`
}
