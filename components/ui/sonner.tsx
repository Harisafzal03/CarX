'use client'

import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        style: {
          background: 'hsl(222 47% 13%)',
          border: '1px solid hsl(222 47% 20%)',
          color: 'hsl(213 31% 91%)',
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
