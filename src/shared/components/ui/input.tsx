import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded border border-[#3D251C] bg-[#1A120E] px-3.5 py-2 text-sm text-[#F5F1EB] font-mono ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#8C7760] focus-visible:outline-none focus-visible:border-[#E89B55] focus-visible:ring-1 focus-visible:ring-[#E89B55] disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
