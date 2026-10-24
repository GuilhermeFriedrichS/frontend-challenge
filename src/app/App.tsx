import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { queryClient } from '@/shared/lib/queryClient'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { CartProvider } from '@/features/cart/context/CartContext'
import { ToastProvider } from '@/shared/components/ui/toast'
import { routeTree } from '../routeTree.gen'

// Create Router instance
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

// Register router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
