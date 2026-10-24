import React, { useState } from 'react'
import { Link, useRouterState, useNavigate } from '@tanstack/react-router'
import { Home, Heart, ShoppingBag, User as UserIcon, ScanLine } from 'lucide-react'
import { useCart } from '@/features/cart/context/CartContext'
import { useAuth } from '@/features/auth/context/AuthContext'
import { AuthModal } from '@/features/auth/components/AuthModal'

export const MobileBottomNav: React.FC = () => {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const { totalItemsCount } = useCart()
  const { isAuthenticated } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const navigate = useNavigate()

  // Hide bottom nav on specific fullscreen mobile flows if needed, but per Figma mobile all main screens feature bottom nav or full mobile layout
  const isHome = pathname === '/'
  const isCart = pathname === '/cart'
  const isProfile = pathname === '/profile'
  const isWallets = pathname === '/wallets'

  const handleProfileClick = () => {
    if (isAuthenticated) {
      navigate({ to: '/profile' })
    } else {
      setAuthModalOpen(true)
    }
  }

  const handleWalletClick = () => {
    if (isAuthenticated) {
      navigate({ to: '/wallets' })
    } else {
      setAuthModalOpen(true)
    }
  }

  const handleFavoritesClick = () => {
    if (isAuthenticated) {
      navigate({ to: '/profile' })
    } else {
      setAuthModalOpen(true)
    }
  }

  return (
    <>
      <nav
        aria-label="Navegação móvel"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#1C120E]/95 backdrop-blur-md border-t border-[#3D251C]/80 px-4 py-2 font-mono"
      >
        <div className="flex items-center justify-around relative max-w-md mx-auto">
          {/* 1. Home */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center p-2 transition-colors ${
              isHome ? 'text-[#D28A4C]' : 'text-[#CFB28C] hover:text-[#F5F1EB]'
            }`}
            aria-label="Início"
          >
            <Home className="w-5 h-5" />
          </Link>

          {/* 2. Favorites */}
          <button
            type="button"
            onClick={handleFavoritesClick}
            className="flex flex-col items-center justify-center p-2 text-[#CFB28C] hover:text-[#D28A4C] transition-colors"
            aria-label="Favoritos"
          >
            <Heart className="w-5 h-5" />
          </button>

          {/* 3. Center Elevated Action Button (Wallets / Scanner) matching Figma */}
          <div className="-mt-7">
            <button
              type="button"
              onClick={handleWalletClick}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform border-4 border-[#140D0A] ${
                isWallets ? 'bg-[#F5F1EB] text-[#140D0A]' : 'bg-gradient-to-tr from-[#D28A4C] to-[#E89B55] text-[#140D0A]'
              }`}
              aria-label="Minhas Carteiras e Scanner"
              title="Carteiras"
            >
              <ScanLine className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* 4. Cart */}
          <Link
            to="/cart"
            className={`flex flex-col items-center justify-center p-2 relative transition-colors ${
              isCart ? 'text-[#D28A4C]' : 'text-[#CFB28C] hover:text-[#F5F1EB]'
            }`}
            aria-label="Carrinho de compras"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItemsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#D28A4C] text-[#140D0A] text-[9px] font-bold flex items-center justify-center">
                {totalItemsCount}
              </span>
            )}
          </Link>

          {/* 5. Profile */}
          <button
            type="button"
            onClick={handleProfileClick}
            className={`flex flex-col items-center justify-center p-2 transition-colors ${
              isProfile ? 'text-[#D28A4C]' : 'text-[#CFB28C] hover:text-[#F5F1EB]'
            }`}
            aria-label="Perfil do colecionador"
          >
            <UserIcon className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Auth Modal for mobile login/register */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  )
}
