import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm shadow-xs transition-colors",
        "placeholder-muted-foreground focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{
        backgroundColor: 'hsl(var(--input))',
        borderColor: 'hsl(var(--border))',
        color: 'hsl(var(--foreground))',
      }}
      {...props}
    />
  )
}

export { Textarea }
