import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/lib/api'
import { NFT, NFTFilterParams, NFTListResponse } from '@/shared/types'
import { useToast } from '@/shared/components/ui/toast'
import { useEffect } from 'react'
import { subscribeToNftUpdates } from '@/shared/lib/socket'

export function useNfts(params: NFTFilterParams) {
  const queryClient = useQueryClient()

  // Realtime synchronization with Socket.IO
  useEffect(() => {
    const unsubscribe = subscribeToNftUpdates(payload => {
      // Invalidate queries or optimistically update prices
      queryClient.setQueriesData<NFTListResponse>(
        { queryKey: ['nfts'] },
        oldData => {
          if (!oldData) return oldData
          return {
            ...oldData,
            items: oldData.items.map(item => {
              if (item.id === payload.nftId) {
                return {
                  ...item,
                  priceEth: payload.newPriceEth || item.priceEth,
                }
              }
              return item
            }),
          }
        }
      )
    })
    return () => unsubscribe()
  }, [queryClient])

  return useQuery<NFTListResponse>({
    queryKey: ['nfts', params],
    queryFn: async () => {
      const response = await api.get<NFTListResponse>('/nfts', { params })
      return response.data
    },
    placeholderData: previousData => previousData,
  })
}

export function useNft(id: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const unsubscribe = subscribeToNftUpdates(payload => {
      if (payload.nftId === id) {
        queryClient.setQueryData<NFT>(['nft', id], old => {
          if (!old) return old
          return {
            ...old,
            priceEth: payload.newPriceEth || old.priceEth,
          }
        })
      }
    })
    return () => unsubscribe()
  }, [id, queryClient])

  return useQuery<NFT>({
    queryKey: ['nft', id],
    queryFn: async () => {
      const response = await api.get<NFT>(`/nfts/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

/**
 * Optimistic update mutation with rollback for toggling NFT favorites
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (nftId: string) => {
      const response = await api.post<{ nftId: string; isFavorite: boolean; likesCount: number }>(
        `/favorites/${nftId}`
      )
      return response.data
    },
    // 1. On Mutate: Snapshot and optimistically apply change
    onMutate: async (nftId: string) => {
      await queryClient.cancelQueries({ queryKey: ['nfts'] })
      await queryClient.cancelQueries({ queryKey: ['nft', nftId] })

      // Snapshot previous list queries
      const previousLists = queryClient.getQueriesData<NFTListResponse>({ queryKey: ['nfts'] })
      const previousNft = queryClient.getQueryData<NFT>(['nft', nftId])

      // Optimistically update list queries
      queryClient.setQueriesData<NFTListResponse>({ queryKey: ['nfts'] }, old => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map(item => {
            if (item.id === nftId) {
              const newIsFav = !item.isFavorite
              return {
                ...item,
                isFavorite: newIsFav,
                likesCount: item.likesCount + (newIsFav ? 1 : -1),
              }
            }
            return item
          }),
        }
      })

      // Optimistically update single detail query
      if (previousNft) {
        queryClient.setQueryData<NFT>(['nft', nftId], {
          ...previousNft,
          isFavorite: !previousNft.isFavorite,
          likesCount: previousNft.likesCount + (!previousNft.isFavorite ? 1 : -1),
        })
      }

      return { previousLists, previousNft }
    },

    // 2. On Error: Rollback state to snapshot
    onError: (err: any, nftId, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
      if (context?.previousNft) {
        queryClient.setQueryData(['nft', nftId], context.previousNft)
      }

      toast({
        title: 'Falha ao atualizar favorito (Rollback executado)',
        description: err.response?.data?.message || 'A operação falhou e o estado anterior foi restaurado.',
        variant: 'destructive',
      })
    },

    // 3. On Settled: Revalidate from server
    onSettled: (_data, _error, nftId) => {
      queryClient.invalidateQueries({ queryKey: ['nfts'] })
      queryClient.invalidateQueries({ queryKey: ['nft', nftId] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}
