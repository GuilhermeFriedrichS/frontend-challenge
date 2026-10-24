import React, { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCart } from '@/features/cart/context/CartContext'
import { useNfts } from '@/features/catalog/api/useNfts'
import { formatEth, multiplyEth } from '@/shared/utils/eth'
import { Trash2, Minus, Plus, AlertTriangle, ChevronLeft } from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'
import { NftCard } from '@/features/catalog/components/NftCard'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    couponCode,
    applyCoupon,
    removeCoupon,
    quote,
    hasPriceChanged,
    acknowledgePriceChange,
    priceChangeMessage,
  } = useCart()

  const navigate = useNavigate()
  const { toast } = useToast()
  const [couponInput, setCouponInput] = useState('')
  const [recSlide, setRecSlide] = useState(0)
  const { data: recommendedData } = useNfts({ pageSize: 15 })

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponInput.trim()) return

    const ok = await applyCoupon(couponInput)
    if (ok) {
      toast({
        title: 'Verificando cupom...',
        description: `Código '${couponInput.toUpperCase()}' enviado para validação.`,
        variant: 'default',
      })
    }
  }

  const handleProceedToCheckout = () => {
    if (hasPriceChanged) {
      toast({
        title: 'Atenção: Valores alterados',
        description: 'Por favor, confirme as alterações de preço antes de ir para o pagamento.',
        variant: 'destructive',
      })
      return
    }

    if (items.length === 0) return

    navigate({ to: '/checkout' })
  }

  const subtotalEth = quote?.subtotalEth || '0.00'
  const discountEth = quote?.discountEth || '00.00'
  const networkFeeEth = quote?.networkFeeEth || '0.016'
  const totalEth = quote?.totalEth || '0.00'

  return (
    <div className="font-mono text-xs pb-24">
      <div className="container mx-auto px-4 sm:px-6 pt-6">
        {/* Mobile Top Header matching Figma Mobile/Carrinho de NFTs.png */}
        <div className="sm:hidden flex items-center justify-between pb-6">
          <button
            onClick={() => navigate({ to: '/' })}
            className="w-10 h-10 rounded-full bg-[#241612] border border-[#3D251C]/60 text-[#F5F1EB] flex items-center justify-center hover:bg-[#2F1D15] transition-colors"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-bold text-[#F5F1EB] tracking-wider">
            Carrinho de NFTs
          </h1>
          <div className="w-10" />
        </div>

        {/* Desktop Breadcrumbs matching Figma: Início / Mercado / Carrinho */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-[#8C7760] pb-6">
          <Link to="/" className="hover:text-[#D28A4C] transition-colors">Início</Link>
          <span>/</span>
          <Link to="/" hash="catalogo" className="hover:text-[#D28A4C] transition-colors">Mercado</Link>
          <span>/</span>
          <span className="text-[#F5F1EB]">Carrinho</span>
        </div>

        {/* Real-time price change alert */}
        {hasPriceChanged && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl border border-[#D28A4C] bg-[#2A1D15] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#D28A4C] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-bold text-white">Alteração de Cotação em Tempo Real!</h2>
                <p className="text-xs text-[#CFB28C] mt-0.5">{priceChangeMessage}</p>
              </div>
            </div>
            <button
              onClick={acknowledgePriceChange}
              className="bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase px-4 py-2 shrink-0"
            >
              Confirmar e Atualizar
            </button>
          </div>
        )}

        {items.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-[#3D251C] bg-[#241612] space-y-4 max-w-lg mx-auto">
            <h2 className="text-base font-bold text-[#F5F1EB]">Seu carrinho está vazio</h2>
            <p className="text-xs text-[#CFB28C]">
              Explore nosso catálogo e adicione obras exclusivas à sua coleção.
            </p>
            <Link
              to="/"
              className="inline-block bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase px-6 py-2.5 transition-colors"
            >
              Explorar Catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Items Table (matching Figma) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Desktop Table Header */}
              <div className="hidden sm:grid grid-cols-12 gap-4 pb-3  text-[#8C7760] font-bold">
                <div className="col-span-6">NFTs</div>
                <div className="col-span-2 text-center">Preço</div>
                <div className="col-span-2 text-center">Edições</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {items.map(item => {
                  const itemTotalEth = multiplyEth(item.priceEth, item.quantity)
                  return (
                    <div
                      key={`${item.nftId}-${item.editionId}`}
                      className="p-3 sm:p-4 rounded-2xl bg-[#241612] border border-[#3D251C]/40 flex items-center justify-between gap-3 sm:grid sm:grid-cols-12 sm:gap-4"
                    >
                      {/* Image & Title */}
                      <div className="sm:col-span-6 flex items-center gap-3 min-w-0">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-16 h-16 sm:w-14 sm:h-14 rounded-xl object-cover bg-[#1C120E] shrink-0"
                        />
                        <div className="space-y-0.5 min-w-0">
                          <Link
                            to="/nft/$id"
                            params={{ id: item.nftId }}
                            className="font-bold text-xs text-[#F5F1EB] hover:text-[#D28A4C] transition-colors block truncate"
                          >
                            {item.title}
                          </Link>
                          <p className="text-[11px] text-[#8C7760]">Edição: 1/50</p>
                          <p className="text-xs font-bold text-[#D28A4C] sm:hidden">
                            {formatEth(item.priceEth)} ETH
                          </p>
                        </div>
                      </div>

                      {/* Unit Price (Desktop) */}
                      <div className="col-span-2 text-center sm:block hidden">
                        <span className="text-xs text-[#CFB28C]">{formatEth(item.priceEth)} ETH</span>
                      </div>

                      {/* Stepper matching Figma [-] N [+] */}
                      <div className="sm:col-span-2 flex items-center justify-center gap-1.5 shrink-0">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.nftId, item.editionId, item.quantity - 1)}
                            className="w-6 h-6 rounded-full bg-[#D28A4C] text-[#140D0A] flex items-center justify-center font-bold hover:bg-[#E89B55]"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-[#F5F1EB]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.nftId, item.editionId, item.quantity + 1)}
                            disabled={item.quantity >= item.maxAvailable}
                            className="w-6 h-6 rounded-full bg-[#D28A4C] text-[#140D0A] flex items-center justify-center font-bold hover:bg-[#E89B55] disabled:opacity-40"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Total & Trash Can Icon */}
                      <div className="col-span-2 hidden sm:flex items-center justify-end gap-3 w-auto">
                        <span className="text-xs font-bold text-[#D28A4C]">
                          {formatEth(itemTotalEth)} ETH
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.nftId, item.editionId)}
                          className="p-1.5 text-[#8C7760] hover:text-[#F0805F] transition-colors"
                          aria-label={`Remover ${item.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right Column: "Resumo da carteira" (matching Figma exactly) */}
            <div className="lg:col-span-4 rounded-3xl bg-[#241612] border border-[#3D251C]/40 p-5 sm:p-6 space-y-5 shadow-xl">
              <h2 className="text-sm font-bold text-[#F5F1EB]">
                Resumo da carteira
              </h2>

              {/* Promo Code Form */}
              <div className="space-y-2">
                <label className="text-[11px] text-[#CFB28C] block font-medium">
                  Código promocional
                </label>
                <form onSubmit={handleApplyCoupon} className="flex">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value)}
                    placeholder="Digite o código promocional..."
                    className="flex-1 h-10 px-3 bg-[#1C1410] border border-[#3D251C] text-xs text-[#F5F1EB] rounded-l-xl focus:outline-none focus:border-[#D28A4C]"
                  />
                  <button
                    type="submit"
                    className="bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase px-4 h-10 flex-shrink-0 rounded-r-xl transition-colors"
                  >
                    Aplicar
                  </button>
                </form>
                {couponCode && (
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-[#59C36A]">Cupom ativo: {couponCode}</span>
                    <button onClick={removeCoupon} className="text-[#F0805F] hover:underline">Remover</button>
                  </div>
                )}
              </div>

              {/* Price Breakdown matching Figma */}
              <div className="space-y-3 pt-3 border-t border-[#2F1D15] text-xs">
                <div className="flex items-center justify-between text-[#CFB28C]">
                  <span>Subtotal</span>
                  <span className="text-[#F5F1EB]">{subtotalEth} ETH</span>
                </div>

                <div className="flex items-center justify-between text-[#CFB28C]">
                  <span>Desconto do lançamento</span>
                  <span className="text-[#F5F1EB]">(-) {discountEth}</span>
                </div>

                <div className="flex items-center justify-between text-[#CFB28C]">
                  <div>
                    <span>Taxa de rede</span>
                    <span className="text-[10px] text-[#8C7760] block">Taxa estimada</span>
                  </div>
                  <span className="text-[#F5F1EB]">{networkFeeEth} ETH</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#2F1D15] text-sm">
                  <span className="font-bold text-[#F5F1EB]">Total</span>
                  <span className="font-bold text-[#D28A4C]">{totalEth} ETH</span>
                </div>
              </div>

              {/* Checkout Button matching Figma: Conectar e finalizar */}
              <div className="pt-2 space-y-3 text-center">
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="w-full bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase py-3.5 rounded-2xl transition-colors shadow-lg"
                >
                  Conectar e finalizar
                </button>

                <Link
                  to="/"
                  className="inline-block text-xs text-[#CFB28C] hover:text-[#D28A4C] transition-colors"
                >
                  Continuar explorando
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* "Colecionadores também viram" Section matching Figma */}
        <div className="mt-20 pt-10 border-t border-[#2F1D15]">
          <h2 className="text-sm font-bold uppercase text-[#D28A4C] mb-6">
            Colecionadores também viram
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 min-h-[300px]">
            {(
              recommendedData?.items.slice(recSlide * 5, recSlide * 5 + 5) || []
            ).map(item => (
              <NftCard key={item.id} nft={item} />
            ))}
          </div>

          {/* 3 Dots Carousel Pagination */}
          <div
            className="flex items-center justify-center gap-2 pt-8"
            role="tablist"
            aria-label="Páginas de Colecionadores também viram"
          >
            {[0, 1, 2].map(idx => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={recSlide === idx}
                aria-label={`Ver página ${idx + 1}`}
                onClick={() => setRecSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${recSlide === idx
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
