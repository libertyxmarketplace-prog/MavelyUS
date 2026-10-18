import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#00dc82] text-black shadow hover:bg-[#00c774] active:scale-[0.98]",
        destructive:
          "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
        outline:
          "border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200",
        secondary:
          "border border-transparent bg-white/10 text-white hover:bg-white/15",
        ghost: "hover:bg-white/5 text-zinc-300 hover:text-white",
        link: "text-[#00dc82] underline-offset-4 hover:underline",
        ink: "border-transparent bg-white text-black hover:bg-zinc-200",
      },
      size: {
        default: "h-8 px-3 py-1.5 text-xs",
        xs: "h-6 rounded-md px-2 text-[11px]",
        sm: "h-7 rounded-md px-2.5 text-xs",
        lg: "h-9 rounded-md px-4 text-sm",
        icon: "size-8 rounded-md",
        "icon-xs": "size-6 rounded-md text-xs",
        "icon-sm": "size-7 rounded-md text-xs",
        "icon-lg": "size-9 rounded-md text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  tooltip?: React.ReactNode
  shortcut?: string
  focusableWhenDisabled?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, tooltip: _tooltip, shortcut: _shortcut, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
