import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent text-white",
        secondary: "border-transparent",
        destructive: "border-transparent text-white",
        outline: "border",
        success: "border-transparent text-white",
        warning: "border-transparent text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  style,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  const getStyle = () => {
    switch (variant) {
      case 'secondary': return { backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))', ...style }
      case 'destructive': return { backgroundColor: 'hsl(var(--destructive))', ...style }
      case 'outline': return { borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', ...style }
      case 'success': return { backgroundColor: 'hsl(var(--success))', ...style }
      case 'warning': return { backgroundColor: 'hsl(var(--warning))', ...style }
      default: return { backgroundColor: 'hsl(var(--primary))', ...style }
    }
  }

  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={getStyle()}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
