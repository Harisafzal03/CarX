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
      className="flex flex-col w-64 h-screen sticky top-0 border-r"
      style={{
        backgroundColor: 'hsl(var(--sidebar))',
        borderColor: 'hsl(var(--sidebar-border))',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <Image src="/logo.jpeg" alt="CarX" width={46} height={36} className="rounded-xl" />
        <div>
          <span className="text-xl font-bold text-gradient">CarX</span>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Auto Parts</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Menu
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'text-white shadow-md'
                  : 'hover:bg-white/5'
              )}
              style={isActive ? {
                background: 'linear-gradient(135deg, hsl(221 83% 53% / 0.9), hsl(240 83% 60% / 0.9))',
                color: 'white',
                boxShadow: '0 4px 12px hsl(221 83% 53% / 0.25)',
              } : {
                color: 'hsl(var(--sidebar-foreground))',
              }}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110", isActive && "text-white")} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: Logout */}
      <div className="px-3 pb-4 border-t pt-4" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all duration-200 hover:bg-red-500/10 group"
          style={{ color: 'hsl(var(--sidebar-foreground))' }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0 group-hover:text-red-400 transition-colors" />
          <span className="group-hover:text-red-400 transition-colors">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
