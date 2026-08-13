import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-brand-primary text-bg-page font-bold shadow hover:bg-brand-primary-hover hover:shadow-lg hover:shadow-[#CFFF3D]/10",
        destructive:
          "bg-danger text-bg-page font-bold shadow-sm hover:bg-danger/90",
        outline:
          "border border-border-default bg-transparent shadow-sm hover:bg-bg-surface-elevated hover:text-text-primary",
        secondary:
          "bg-bg-surface text-text-primary border border-border-default shadow-sm hover:bg-bg-surface-elevated",
        ghost: "hover:bg-bg-surface-elevated hover:text-text-primary",
        link: "text-brand-primary underline-offset-4 hover:underline",
        glass: "bg-bg-surface/60 backdrop-blur-md border border-border-default text-text-primary hover:bg-bg-surface-elevated",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
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
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
