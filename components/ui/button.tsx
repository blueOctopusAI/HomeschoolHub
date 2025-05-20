import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#5e8b7e] text-white hover:bg-[#4a6e63]",
        outline: "border border-[#5e8b7e] bg-transparent hover:bg-[#e9f1e7] hover:text-[#5e8b7e]",
        secondary: "bg-[#e9f1e7] text-[#5e8b7e] hover:bg-[#d8e8d2]",
        ghost: "hover:bg-[#e9f1e7] hover:text-[#5e8b7e]",
        link: "text-[#5e8b7e] underline-offset-4 hover:underline",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        orange: "bg-[#b38867] text-white hover:bg-[#9a7054]",
        blue: "bg-[#5a87ad] text-white hover:bg-[#4a7090]",
        pink: "bg-[#c25e7c] text-white hover:bg-[#a54e69]",
        purple: "bg-[#8a5aad] text-white hover:bg-[#744a91]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
