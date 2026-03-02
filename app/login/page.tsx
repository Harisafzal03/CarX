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
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'black' }}
    >
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Subtle glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 blur-[120px] rounded-full" />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo area */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-4 p-1 rounded-3xl bg-white/5 border border-white/10">
            <Image src="/logo.png" alt="CarX" width={100} height={100} className="rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)]" />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-white uppercase italic">CarX</h1>
          <p className="text-xs mt-2 font-medium tracking-[0.2em] uppercase text-zinc-500">
            Internal Management System
          </p>
        </div>

        <Card className="glass border-white/10 shadow-2xl">
          <CardContent className="p-10">
            <div className="flex items-center gap-2 mb-8 justify-center">
              <ShieldCheck className="w-4 h-4 text-zinc-400" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Authorized Personnel Only</h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 ml-1">Email Identifier</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@carx.io"
                  className="bg-white/5 border-white/10 h-12 focus:border-white/40 transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" title="Enter Password" className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 ml-1">Security Key</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 h-12 focus:border-white/40 transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-sm font-bold uppercase tracking-widest transition-all duration-300 transform active:scale-[0.98]"
                disabled={loading}
                style={{
                  background: 'white',
                  color: 'black',
                  boxShadow: '0 8px 30px rgba(255, 255, 255, 0.15)',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Authenticating
                  </>
                ) : (
                  'Establish Session'
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-[10px] text-center uppercase tracking-tighter text-zinc-600">
                Designated for CarX Auto Parts Group &copy; 2024
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
