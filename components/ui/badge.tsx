import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-[#5e8b7e] text-white hover:bg-[#4a6e63]",
        secondary: "bg-[#e9f1e7] text-[#5e8b7e] hover:bg-[#d8e8d2]",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "text-[#5e8b7e] border border-[#5e8b7e]/30",
        orange: "bg-[#f5e6d8] text-[#b38867] hover:bg-[#f0d7c2]",
        blue: "bg-[#e6f0f9] text-[#5a87ad] hover:bg-[#d0e4f5]",
        pink: "bg-[#f9e6eb] text-[#c25e7c] hover:bg-[#f5d0da]",
        purple: "bg-[#f0e6f5] text-[#8a5aad] hover:bg-[#e5d0f0]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
