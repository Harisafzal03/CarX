'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/sonner'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  BarChart3,
  LogOut,
  Warehouse,
  Receipt,
  Tag,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/pos', label: 'POS / Sales', icon: ShoppingCart },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/categories', label: 'Categories', icon: Tag },
  { href: '/dashboard/purchases', label: 'Purchases', icon: ClipboardList },
  { href: '/dashboard/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/dashboard/orders', label: 'Order History', icon: Receipt },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out successfully')
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="flex flex-col w-64 h-screen sticky top-0 border-r bg-black"
      style={{
        borderColor: '#18181b', // zinc-900 equivalent
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-900">
        <Image src="/logo.png" alt="CarX" width={70} height={70} className="rounded-lg border border-zinc-800" />
        <div>
          <span className="text-xl font-black tracking-tighter text-white">CarX</span>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Auto Parts</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
          Main Menu
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 group relative overflow-hidden',
                isActive
                  ? 'text-black bg-white shadow-[0_4px_20px_rgba(255,255,255,0.15)]'
                  : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
              )}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110", isActive ? "text-black" : "text-zinc-500 group-hover:text-white")} />
              <span className="relative z-10 uppercase tracking-widest text-[11px]">{label}</span>
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-black rounded-r-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: Logout */}
      <div className="px-3 pb-6 border-t border-zinc-900 pt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest w-full transition-all duration-200 hover:bg-red-500/10 text-zinc-500 group"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 group-hover:text-red-400 transition-colors" />
          <span className="group-hover:text-red-400 transition-colors">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
