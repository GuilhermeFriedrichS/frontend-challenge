import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useNft, useToggleFavorite, useNfts } from '@/features/catalog/api/useNfts'
import { useCart } from '@/features/cart/context/CartContext'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { formatEth } from '@/shared/utils/eth'
import { Heart, Search, Star, Minus, Plus, Linkedin, Mail, Twitter, ChevronLeft, AlertCircle, ShoppingBag } from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'
import { NftCard } from '@/features/catalog/components/NftCard'

export const Route = createFileRoute('/nft/$id')({
  component: NftDetailPage,
})

function NftDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { data: nft, isLoading, isError, error, refetch } = useNft(id)
  const { mutate: toggleFav, isPending: isFavPending } = useToggleFavorite()
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [selectedEditionId, setSelectedEditionId] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details')
  const [selectedThumbIndex, setSelectedThumbIndex] = useState(0)

  const [relatedSlide, setRelatedSlide] = useState(0)

  // Recommendation NFTs
  const { data: relatedData } = useNfts({ pageSize: 15 })

  const currentEdition = nft?.editions?.find(e =>
    selectedEditionId ? e.id === selectedEditionId : e.id === (nft.selectedEditionId || nft.editions[0]?.id)
  ) || nft?.editions?.[0]

  const handleEditionChange = (editionId: string) => {
    setSelectedEditionId(editionId)
    setQuantity(1)
  }

  const handleBuy = () => {
    if (!nft || !currentEdition) return

    if (currentEdition.availableQuantity <= 0) {
      toast({
        title: 'Edição esgotada',
        description: 'Esta edição não possui mais unidades disponíveis para compra.',
        variant: 'destructive',
      })
      return
    }

    addItem(nft, currentEdition, quantity)
    toast({
      title: 'Adicionado ao carrinho!',
      description: `${quantity}x ${nft.title} (${currentEdition.name}) no carrinho.`,
      variant: 'default',
    })
    navigate({ to: '/cart' })
  }

  const handleFavoriteClick = () => {
    if (!nft) return
    if (!isAuthenticated) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para salvar seus NFTs favoritos.',
        variant: 'info',
      })
      return
    }
    toggleFav(nft.id)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-12 font-mono space-y-8">
        <Skeleton className="h-4 w-48 bg-[#241612]" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton className="lg:col-span-6 w-full aspect-square rounded-3xl bg-[#241612]" />
          <div className="lg:col-span-6 space-y-6">
            <Skeleton className="h-8 w-3/4 bg-[#241612]" />
            <Skeleton className="h-6 w-1/4 bg-[#241612]" />
            <Skeleton className="h-20 w-full bg-[#241612]" />
            <Skeleton className="h-12 w-1/2 bg-[#241612]" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !nft) {
    const isNetworkError = (error as any)?.code === 'ERR_NETWORK' || !(error as any)?.response

    return (
      <div className="container mx-auto px-4 sm:px-6 py-20 font-mono text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#2A1410] border border-[#F0805F] flex items-center justify-center mx-auto text-[#F0805F]">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">
          {isNetworkError ? 'Falha de Conexão com o Servidor' : 'NFT Não Encontrado'}
        </h1>
        <p className="text-sm text-[#CFB28C] max-w-md mx-auto">
          {isNetworkError
            ? 'Não foi possível carregar as informações do NFT devido a uma queda de conexão simulada ou erro de rede.'
            : ((error as any)?.response?.data?.message || 'O NFT que você está procurando não existe ou foi removido.')}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          {isNetworkError && (
            <button
              onClick={() => refetch()}
              className="border border-[#D28A4C] text-[#D28A4C] hover:bg-[#D28A4C] hover:text-[#140D0A] font-bold text-xs uppercase px-6 py-2.5 transition-colors"
            >
              Tentar novamente
            </button>
          )}
          <button
            onClick={() => navigate({ to: '/' })}
            className="bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase px-6 py-2.5 transition-colors"
          >
            Voltar ao Catálogo
          </button>
        </div>
      </div>
    )
  }

  // 4 thumbnails of the same artwork matching Figma
  const thumbnails = [
    nft.imageUrl,
    nft.imageUrl,
    nft.imageUrl,
    nft.imageUrl,
  ]

  return (
    <div className="font-mono text-xs pb-20">
      {/* Mobile Top Navigation matching Figma Mobile/Detalhes do NFT.png */}
      <div className="lg:hidden container mx-auto px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate({ to: '/' })}
          className="w-10 h-10 rounded-full bg-[#241612] border border-[#3D251C]/60 text-[#F5F1EB] flex items-center justify-center hover:bg-[#2F1D15] transition-colors"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleFavoriteClick}
          disabled={isFavPending}
          className={`w-10 h-10 rounded-full bg-[#241612] border border-[#3D251C]/60 flex items-center justify-center transition-colors ${
            nft.isFavorite ? 'text-[#F0805F]' : 'text-[#CFB28C] hover:text-[#F5F1EB]'
          }`}
          aria-label="Favoritar"
        >
          <Heart className={`w-5 h-5 ${nft.isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="container mx-auto px-4 sm:px-6 pt-2 lg:pt-6">
        {/* Desktop Breadcrumbs matching Figma: Início / Mercado */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-[#8C7760] pb-6">
          <Link to="/" className="hover:text-[#D28A4C] transition-colors">Início</Link>
          <span>/</span>
          <Link to="/" hash="catalogo" className="hover:text-[#D28A4C] transition-colors">Mercado</Link>
        </div>

        {/* Responsive Detail Presentation matching Figma Desktop & Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
          {/* Left Gallery */}
          <div className="lg:col-span-7 flex flex-col-reverse lg:flex-row gap-4">
            {/* Desktop 4 Vertical Thumbnails */}
            <div className="hidden lg:flex flex-col gap-3">
              {thumbnails.map((thumb, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedThumbIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden bg-[#241612] border transition-all ${
                    selectedThumbIndex === idx ? 'border-[#D28A4C]' : 'border-[#3D251C] hover:border-[#8C7760]'
                  }`}
                >
                  <img src={thumb} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Artwork Container */}
            <div className="flex-1 relative aspect-square rounded-3xl overflow-hidden bg-[#241612] border border-[#3D251C]/40">
              <img
                src={thumbnails[selectedThumbIndex] || nft.imageUrl}
                alt={nft.title}
                className="w-full h-full object-cover"
              />
              {/* Magnifying Glass Zoom Icon on Top Right */}
              <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#140D0A]/70 flex items-center justify-center text-[#F5F1EB] backdrop-blur cursor-pointer hover:bg-[#D28A4C] hover:text-[#140D0A] transition-colors">
                <Search className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Right Info Section */}
          <div className="lg:col-span-5 rounded-3xl lg:rounded-none bg-[#241612] lg:bg-transparent p-5 sm:p-6 lg:p-0 border border-[#3D251C]/40 lg:border-none space-y-5 lg:space-y-6 shadow-xl lg:shadow-none">
            <div>
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#F5F1EB] leading-tight">
                  {nft.title}
                </h1>
                {/* Mobile Rating Pill matching Figma Mobile: ★ 4.8(19) */}
                <div className="flex lg:hidden items-center gap-1 px-2.5 py-1 rounded-full border border-[#D28A4C] text-[#D28A4C] text-[11px] font-bold shrink-0">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>4.8 (19)</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xl font-bold text-[#D28A4C]">
                  {formatEth(currentEdition ? currentEdition.priceEth : nft.priceEth)} ETH
                </span>

                {/* Desktop Rating matching Figma */}
                <div className="hidden lg:flex items-center gap-1 text-[#D28A4C] text-[11px]">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className="w-3.5 h-3.5 fill-current text-[#D28A4C]" />
                    ))}
                  </div>
                  <span className="text-[#8C7760] ml-1">19 avaliações de colecionadores</span>
                </div>
              </div>
            </div>

            {/* About / Description matching Figma */}
            <div className="space-y-2">
              <h3 className="font-bold text-[#F5F1EB] text-xs">Sobre este NFT:</h3>
              <p className="text-xs text-[#CFB28C] leading-relaxed">
                Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.
              </p>
            </div>

            {/* Editions Selector matching Figma: 1/1, 1/10, 1/50, ABERTA */}
            <div className="space-y-2">
              <h3 className="font-bold text-[#F5F1EB] text-xs">Edição:</h3>
              <div className="flex flex-wrap items-center gap-2">
                {['1/1', '1/10', '1/50', 'ABERTA'].map((edLabel, index) => {
                  const targetEdition = nft.editions[index] || nft.editions[0]
                  const isSelected = currentEdition?.id === targetEdition?.id || (edLabel === '1/50' && !selectedEditionId)

                  return (
                    <button
                      key={edLabel}
                      type="button"
                      onClick={() => targetEdition && handleEditionChange(targetEdition.id)}
                      className={`px-3 py-1 rounded-full text-xs transition-colors border ${
                        isSelected
                          ? 'border-[#D28A4C] text-[#D28A4C] bg-[#D28A4C]/10 font-bold'
                          : 'border-[#3D251C] text-[#CFB28C] hover:border-[#8C7760]'
                      }`}
                    >
                      {edLabel}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quantity Selector & Action Buttons matching Figma */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center rounded-full bg-[#1C120E] border border-[#3D251C] px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-7 h-7 rounded-full bg-[#D28A4C] text-[#140D0A] flex items-center justify-center font-bold hover:bg-[#E89B55] disabled:opacity-40"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-[#F5F1EB]">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={currentEdition ? quantity >= currentEdition.availableQuantity : false}
                    className="w-7 h-7 rounded-full bg-[#D28A4C] text-[#140D0A] flex items-center justify-center font-bold hover:bg-[#E89B55] disabled:opacity-40"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleBuy}
                  className="flex-1 bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase py-3.5 px-6 rounded-2xl lg:rounded-none tracking-wider text-center transition-colors shadow-lg"
                >
                  COMPRAR
                </button>

                {/* Mobile Cart Button matching Figma Mobile */}
                <button
                  type="button"
                  onClick={handleBuy}
                  className="lg:hidden w-12 h-12 rounded-2xl bg-[#2E1B15] border border-[#3D251C] text-[#D28A4C] hover:bg-[#D28A4C] hover:text-[#140D0A] flex items-center justify-center transition-colors shrink-0"
                  aria-label="Adicionar ao carrinho"
                  title="Adicionar ao carrinho"
                >
                  <ShoppingBag className="w-5 h-5" />
                </button>

                {/* Desktop Favoritar Button matching Figma Desktop */}
                <button
                  type="button"
                  onClick={handleFavoriteClick}
                  disabled={isFavPending}
                  className="hidden lg:flex items-center gap-2 bg-[#241612] hover:bg-[#2F1D15] border border-[#D28A4C] text-[#D28A4C] text-xs py-3.5 px-4 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${nft.isFavorite ? 'fill-current' : ''}`} />
                  <span>Favoritar</span>
                </button>
              </div>
            </div>

            {/* Token Metadata matching Figma */}
            <div className="space-y-1.5 pt-4 text-xs text-[#CFB28C] border-t border-[#2F1D15]">
              <p>ID do token: <span className="text-[#F5F1EB]">#{nft.id.replace(/^nft-0*/, '') || nft.id}</span></p>
              <p>Coleção: <span className="text-[#F5F1EB]">Kurio Apes</span></p>
              <p>Atributos: <span className="text-[#F5F1EB]">{nft.attributes?.map(a => a.value).join(', ') || 'Óculos, Esmeralda, Raro'}</span></p>
              <div className="flex items-center gap-2 pt-1 text-[#8C7760]">
                <span>Compartilhar este NFT:</span>
                <a href="#linkedin" className="hover:text-[#D28A4C]"><Linkedin className="w-3.5 h-3.5" /></a>
                <a href="#email" className="hover:text-[#D28A4C]"><Mail className="w-3.5 h-3.5" /></a>
                <a href="#twitter" className="hover:text-[#D28A4C]"><Twitter className="w-3.5 h-3.5" /></a>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Detalhes do NFT & Avaliações de colecionadores matching Figma */}
        <div className="mt-16 border-t border-[#2F1D15] pt-8">
          <div className="flex items-center gap-8  pb-3 text-xs">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 relative transition-colors ${activeTab === 'details' ? 'text-[#D28A4C] font-bold' : 'text-[#CFB28C] hover:text-[#F5F1EB]'
                }`}
            >
              Detalhes do NFT
              {activeTab === 'details' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D28A4C]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 relative transition-colors ${activeTab === 'reviews' ? 'text-[#D28A4C] font-bold' : 'text-[#CFB28C] hover:text-[#F5F1EB]'
                }`}
            >
              Avaliações de colecionadores (19)
              {activeTab === 'reviews' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D28A4C]" />
              )}
            </button>
          </div>

          <div className="py-6 space-y-4 max-w-4xl text-xs text-[#CFB28C] leading-relaxed">
            <p>
              {nft.title} é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na Ethereum. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.
            </p>
            <p>
              A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. {nft.creator.name} recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.
            </p>
            <p><strong className="text-[#F5F1EB]">Rede:</strong> Cunhado na Ethereum com procedência imutável e metadados armazenados no IPFS.</p>
            <p><strong className="text-[#F5F1EB]">Contrato:</strong> Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.</p>
            <p><strong className="text-[#F5F1EB]">Direitos autorais:</strong> 0x7A42...19E8 &bull; Contrato inteligente ERC-721 verificado.</p>
          </div>
        </div>

        {/* "Mais desta coleção" Grid matching Figma */}
        <div className="mt-12 pt-8 border-t border-[#2F1D15]">
          <h2 className="text-sm font-bold uppercase text-[#D28A4C] mb-6">
            Mais desta coleção
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 min-h-[300px]">
            {(
              relatedData?.items.slice(relatedSlide * 5, relatedSlide * 5 + 5) || []
            ).map(item => (
              <NftCard key={item.id} nft={item} />
            ))}
          </div>

          {/* 3 Dots Carousel Pagination */}
          <div
            className="flex items-center justify-center gap-2 pt-8"
            role="tablist"
            aria-label="Páginas de Mais desta coleção"
          >
            {[0, 1, 2].map(idx => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={relatedSlide === idx}
                aria-label={`Ver página ${idx + 1}`}
                onClick={() => setRelatedSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${relatedSlide === idx
                    ? 'bg-[#D28A4C] scale-110'
                    : 'bg-[#3D251C] hover:bg-[#8C7760]'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
