import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

// Listen for socket reconnection and reconcile active queries with the REST API
if (typeof window !== 'undefined') {
  window.addEventListener('kurio:socket-reconnected', () => {
    queryClient.invalidateQueries({ refetchType: 'active' })
  })
}
