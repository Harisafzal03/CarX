import { Sidebar } from '@/components/layout/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  )
}
