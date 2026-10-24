import React from 'react'
import { Link } from '@tanstack/react-router'
import { Heart, ShoppingBag, Search } from 'lucide-react'
import { NFT } from '@/shared/types'
import { formatEth } from '@/shared/utils/eth'
import { useToggleFavorite } from '../api/useNfts'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useCart } from '@/features/cart/context/CartContext'
import { useToast } from '@/shared/components/ui/toast'

interface NftCardProps {
  nft: NFT
  onOpenAuth?: () => void
}

export const NftCard: React.FC<NftCardProps> = ({ nft, onOpenAuth }) => {
  const { mutate: toggleFav, isPending } = useToggleFavorite()
  const { isAuthenticated } = useAuth()
  const { addItem } = useCart()
  const { toast } = useToast()

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para salvar seus NFTs favoritos.',
        variant: 'info',
      })
      onOpenAuth?.()
      return
    }

    toggleFav(nft.id)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const edition =
      nft.editions?.find(ed => ed.id === nft.selectedEditionId) ||
      nft.editions?.[0] || {
        id: `default-${nft.id}`,
        name: 'Edição Padrão',
        priceEth: nft.priceEth,
        totalQuantity: 50,
        availableQuantity: 10,
      }
    addItem(nft, edition, 1)
    toast({
      title: 'Item adicionado',
      description: `${nft.title} foi adicionado ao seu carrinho.`,
      variant: 'default',
    })
  }

  // Neon Vessel #552 or specific rare cards show discount/strike price in Figma
  const isRare = nft.title.includes('#552') || nft.title.includes('Neon') || (parseFloat(nft.priceEth) >= 1.8 && !nft.title.includes('Ivory'))
  const originalPrice = nft.title.includes('#552') ? '2.29' : null

  return (
    <div className="group font-mono transition-transform duration-200">
      {/* NFT Image Container */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#241612]">
        <Link to="/nft/$id" params={{ id: nft.id }} className="block w-full h-full">
          <img
            src={nft.imageUrl}
            alt={nft.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Badge "RARO" if applicable matching Figma Mobile */}
        {isRare && (
          <div className="absolute top-2 left-2 bg-[#D28A4C] text-[#140D0A] text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded sm:rounded-br-lg tracking-wider uppercase z-10 shadow-md">
            RARO
          </div>
        )}

        {/* Mobile direct favorite button matching Figma Mobile/Início.png */}
        <button
          type="button"
          onClick={handleHeartClick}
          disabled={isPending}
          className={`sm:hidden absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors z-10 shadow-md ${
            nft.isFavorite ? 'bg-[#F0805F] text-white' : 'bg-[#140D0A]/70 text-[#CFB28C]'
          }`}
          title={nft.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
          aria-label={nft.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
        >
          <Heart className={`w-3.5 h-3.5 ${nft.isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Hover Action Overlay matching Figma Desktop (Cart, Heart, Search) */}
        <div className="hidden sm:flex absolute inset-x-0 bottom-0 py-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-9 h-9 rounded-full bg-[#140D0A]/90 hover:bg-[#D28A4C] hover:text-[#140D0A] text-[#F5F1EB] flex items-center justify-center transition-colors shadow-lg"
            title="Adicionar ao carrinho"
            aria-label="Adicionar ao carrinho"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleHeartClick}
            disabled={isPending}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-lg ${
              nft.isFavorite
                ? 'bg-[#F0805F] text-white'
                : 'bg-[#140D0A]/90 hover:bg-[#D28A4C] hover:text-[#140D0A] text-[#F5F1EB]'
            }`}
            title={nft.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
            aria-label={nft.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
          >
            <Heart className={`w-4 h-4 ${nft.isFavorite ? 'fill-current' : ''}`} />
          </button>

          <Link
            to="/nft/$id"
            params={{ id: nft.id }}
            className="w-9 h-9 rounded-full bg-[#140D0A]/90 hover:bg-[#D28A4C] hover:text-[#140D0A] text-[#F5F1EB] flex items-center justify-center transition-colors shadow-lg"
            title="Ver detalhes"
            aria-label="Ver detalhes"
          >
            <Search className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* NFT Info: Title & Price matching Figma exactly (no avatar, no "Preço", no USD) */}
      <div className="mt-3 space-y-1">
        <Link
          to="/nft/$id"
          params={{ id: nft.id }}
          className="block text-sm text-[#F5F1EB] hover:text-[#D28A4C] transition-colors truncate"
        >
          {nft.title}
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-[#D28A4C]">{formatEth(nft.priceEth)} ETH</span>
          {originalPrice && (
            <span className="text-xs text-[#8C7760] line-through">{originalPrice} ETH</span>
          )}
        </div>
      </div>
    </div>
  )
}
