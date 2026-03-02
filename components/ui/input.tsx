import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-lg border px-3 py-1 text-sm shadow-xs transition-colors",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder-muted-foreground focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{
        backgroundColor: 'hsl(var(--input))',
        borderColor: 'hsl(var(--border))',
        color: 'hsl(var(--foreground))',
        '--ring': 'hsl(var(--ring))',
      } as React.CSSProperties}
      {...props}
    />
  )
}

export { Input }
