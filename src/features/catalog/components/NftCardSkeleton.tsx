import React from 'react'
import { Skeleton } from '@/shared/components/ui/skeleton'

export const NftCardSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 font-mono">
      {/* Image Skeleton */}
      <Skeleton className="w-full aspect-square rounded-2xl bg-[#241612]" />

      {/* Title & Price Skeleton */}
      <div className="space-y-2 pt-1">
        <Skeleton className="h-4 w-3/4 rounded bg-[#241612]" />
        <Skeleton className="h-4 w-1/3 rounded bg-[#241612]" />
      </div>
    </div>
  )
}
