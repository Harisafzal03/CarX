import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-lg hover:brightness-110 active:scale-95",
        destructive: "bg-destructive text-white shadow-xs hover:brightness-110 active:scale-95",
        outline: "border border-border bg-transparent hover:bg-secondary text-foreground active:scale-95",
        secondary: "bg-secondary text-secondary-foreground hover:brightness-110 active:scale-95",
        ghost: "hover:bg-secondary text-foreground active:scale-95",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-white shadow-lg hover:brightness-110 active:scale-95",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-xl px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      style={{
        '--primary': 'hsl(221 83% 53%)',
        '--primary-foreground': 'hsl(210 40% 98%)',
        '--destructive': 'hsl(0 84% 60%)',
        '--secondary': 'hsl(222 47% 18%)',
        '--secondary-foreground': 'hsl(213 31% 91%)',
        '--success': 'hsl(142 71% 45%)',
      } as React.CSSProperties}
      {...props}
    />
  )
}

export { Button, buttonVariants }
