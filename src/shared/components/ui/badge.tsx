import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded px-2.5 py-0.5 text-xs font-semibold font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-[#E89B55] text-[#140D0A]',
        secondary:
          'bg-[#2F1D15] text-[#CFB28C] border border-[#3D251C]',
        success:
          'bg-[#59C36A]/20 text-[#59C36A] border border-[#59C36A]/30',
        destructive:
          'bg-[#F0805F]/20 text-[#F0805F] border border-[#F0805F]/30',
        outline:
          'text-[#F5F1EB] border border-[#3D251C]',
      },
    },
    defaultVariants: {
      variant: 'default',
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
