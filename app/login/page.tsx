'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/components/ui/sonner'
import Image from 'next/image'
import { Loader2, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Welcome back!')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, hsl(222 47% 8%) 0%, hsl(222 47% 14%) 100%)' }}
    >
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(hsl(221 83% 53%) 1px, transparent 1px), linear-gradient(90deg, hsl(221 83% 53%) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-3">
            <Image src="/logo.jpeg" alt="CarX" width={80} height={80} className="rounded-2xl shadow-lg" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gradient">CarX</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Auto Parts Inventory &amp; POS System
          </p>
        </div>

        <Card className="glass shadow-2xl">
          <CardContent className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              <h2 className="text-lg font-semibold">Admin Login</h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@carx.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, hsl(221 83% 53%), hsl(240 83% 60%))',
                  boxShadow: '0 4px 24px hsl(221 83% 53% / 0.3)',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: 'hsl(var(--muted))' }}>
              <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Restricted access · CarX Admin Portal only
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
