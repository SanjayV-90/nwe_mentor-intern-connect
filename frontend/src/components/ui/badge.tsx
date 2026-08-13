import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-primary/15 text-brand-primary border-brand-primary/30",
        success:
          "border-transparent bg-success/15 text-success border-success/30",
        warning:
          "border-transparent bg-warning/15 text-warning border-warning/30",
        destructive:
          "border-transparent bg-danger/15 text-danger border-danger/30",
        outline: "text-text-secondary border-border-default",
        purple:
          "border-transparent bg-brand-primary-soft text-brand-primary border-brand-primary/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
