import { cn } from '@/shared/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'shimmer rounded bg-[#241612] border border-[#2F1D15]',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
