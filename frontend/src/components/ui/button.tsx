import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Button variant styles using class-variance-authority.
 * Supports default, primary, ghost, danger, and outline variants with multiple sizes.
 */
const buttonVariants = cva(
  `inline-flex items-center justify-center whitespace-nowrap rounded-xl
   text-sm font-medium transition-all focus-visible:outline-none
   focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
   disabled:pointer-events-none disabled:opacity-50 select-none`,
  {
    variants: {
      variant: {
        default: 'neu-btn text-text-primary',
        primary: 'neu-btn-primary',
        ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover',
        danger: 'neu-btn-primary bg-danger text-white',
        outline: 'border border-border bg-transparent text-text-primary hover:bg-surface',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 rounded-lg px-4 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-10 w-10 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

/** Props for the Button component combining HTML button attributes with variant options. */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** When true, renders the button as a child element using Radix Slot */
  asChild?: boolean
}

/**
 * Neumorphism-styled button component with multiple variants and sizes.
 * Supports primary, default, ghost, danger, and outline color schemes.
 * Can be rendered as a child component using the asChild prop.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
