import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded font-mono text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-[#E89B55] text-[#140D0A] hover:bg-[#D28A4C] shadow-sm',
        secondary:
          'bg-[#2F1D15] text-[#F5F1EB] hover:bg-[#3D251C] border border-[#3D251C]',
        outline:
          'border border-[#3D251C] bg-transparent text-[#F5F1EB] hover:bg-[#241612] hover:border-[#E89B55]',
        ghost:
          'hover:bg-[#241612] text-[#F5F1EB] hover:text-[#E89B55]',
        destructive:
          'bg-[#F0805F] text-white hover:bg-[#d96e4f]',
        link:
          'text-[#E89B55] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-12 px-8 text-base tracking-wider',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

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
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
