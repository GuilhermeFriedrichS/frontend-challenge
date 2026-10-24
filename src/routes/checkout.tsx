import React, { useState, useEffect, useRef } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCart } from '@/features/cart/context/CartContext'
import { useAuth } from '@/features/auth/context/AuthContext'
import { api } from '@/shared/lib/api'
import { formatEth, multiplyEth } from '@/shared/utils/eth'
import { Order } from '@/shared/types'
import { AlertCircle, Loader2, ChevronLeft, MoreVertical } from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'
import { AuthModal } from '@/features/auth/components/AuthModal'

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
})

function CheckoutPage() {
  const { items, quote, couponCode, removePurchasedItems } = useCart()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [selectedWalletType, setSelectedWalletType] = useState('coinbase')
  const [selectedConnectedWallet, setSelectedConnectedWallet] = useState<'reserva' | 'principal'>('reserva')
  const [selectedNetwork, setSelectedNetwork] = useState('Ethereum')

  // Form Fields matching Figma
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [profileName, setProfileName] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [secondaryWallet, setSecondaryWallet] = useState('')
  const [walletTypeSelect, setWalletTypeSelect] = useState('metamask')
  const [referralCode, setReferralCode] = useState('')
  const [email, setEmail] = useState('')
  const [ensName, setEnsName] = useState('')
  const [useOtherWallet, setUseOtherWallet] = useState(false)
  const [notes, setNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)

  // Stable Idempotency-Key
  const idempotencyKeyRef = useRef<string>('')
  if (!idempotencyKeyRef.current) {
    idempotencyKeyRef.current = `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  // Prepopulate if user logged in
  useEffect(() => {
    if (user) {
      setDisplayName(user.name)
      setUsername((user as any).username || 'alex_collector')
      setProfileName(user.name)
      setEmail(user.email)
      setEnsName((user as any).ensName ? (user as any).ensName.replace('.eth', '') : 'alex')
      setWalletAddress('0x71C8A9b2931D45A2F2190E49B90D88F3A2B1449A')
    }
  }, [user])

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmissionError(null)

    if (!isAuthenticated) {
      setAuthModalOpen(true)
      return
    }

    if (items.length === 0) {
      toast({
        title: 'Carrinho vazio',
        description: 'Adicione itens ao carrinho antes de realizar o pagamento.',
        variant: 'destructive',
      })
      navigate({ to: '/' })
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Revalidate price & availability
      const quoteCheck = await api.post('/cart/quote', {
        items: items.map(i => ({ nftId: i.nftId, editionId: i.editionId, quantity: i.quantity })),
        couponCode: couponCode || undefined,
      })

      if (!quoteCheck.data.isValid) {
        setSubmissionError('Houve uma alteração nos preços ou no estoque dos itens. Revise seu carrinho.')
        setIsSubmitting(false)
        return
      }

      // 2. Submit order with Idempotency-Key
      const response = await api.post<Order>(
        '/orders',
        {
          items: items.map(i => ({
            nftId: i.nftId,
            editionId: i.editionId,
            quantity: i.quantity,
            priceEth: i.priceEth,
            title: i.title,
            imageUrl: i.imageUrl,
          })),
          subtotalEth: quoteCheck.data.subtotalEth,
          discountEth: quoteCheck.data.discountEth,
          networkFeeEth: quoteCheck.data.networkFeeEth,
          totalEth: quoteCheck.data.totalEth,
          couponCode: couponCode || undefined,
          walletAddress: walletAddress || '0x71C8A9b2931D45A2F2190E49B90D88F3A2B1449A',
          network: selectedNetwork,
          collectorNotes: notes || undefined,
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKeyRef.current,
          },
        }
      )

      const createdOrder = response.data

      // Clean purchased items from cart
      removePurchasedItems(items.map(i => ({ nftId: i.nftId, editionId: i.editionId })))

      toast({
        title: 'Pedido realizado!',
        description: `Transação criada com sucesso na rede ${selectedNetwork}.`,
        variant: 'default',
      })

      // Navigate to order confirmation
      navigate({
        to: '/order/$id',
        params: { id: createdOrder.id },
      })
    } catch (err: any) {
      console.error('Order submission error:', err)
      const errorMsg =
        err?.response?.data?.message ||
        'Não foi possível concluir a transação. Verifique a carteira ou tente novamente.'
      setSubmissionError(errorMsg)
      toast({
        title: 'Falha no pagamento',
        description: errorMsg,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const subtotalEth = quote?.subtotalEth || '0.00'
  const discountEth = quote?.discountEth || '00.00'
  const networkFeeEth = quote?.networkFeeEth || '0.016'
  const totalEth = quote?.totalEth || '0.00'

  return (
    <div className="font-mono text-xs pb-24">
      <div className="container mx-auto px-4 sm:px-6 pt-6">
        {/* Mobile Top Header matching Figma Mobile/Pagamento.png */}
        <div className="lg:hidden flex items-center justify-between pb-6">
          <button
            type="button"
            onClick={() => navigate({ to: '/cart' })}
            className="w-10 h-10 rounded-full bg-[#241612] border border-[#3D251C]/60 text-[#F5F1EB] flex items-center justify-center hover:bg-[#2F1D15] transition-colors"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-bold text-[#F5F1EB] tracking-wider">
            Pagamento com carteira
          </h1>
          <div className="w-10" />
        </div>

        {/* Desktop Breadcrumbs matching Figma: Início / Mercado / Pagamento */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-[#8C7760] pb-6">
          <Link to="/" className="hover:text-[#D28A4C] transition-colors">Início</Link>
          <span>/</span>
          <Link to="/" hash="catalogo" className="hover:text-[#D28A4C] transition-colors">Mercado</Link>
          <span>/</span>
          <span className="text-[#F5F1EB]">Pagamento</span>
        </div>

        {submissionError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl border border-[#F0805F] bg-[#2A1410] flex items-center gap-3 text-white"
          >
            <AlertCircle className="w-5 h-5 text-[#F0805F] shrink-0" />
            <p className="text-xs">{submissionError}</p>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} noValidate>
          {/* Mobile Payment Presentation matching Figma Mobile/Pagamento.png */}
          <div className="lg:hidden space-y-6 pb-2">
            {/* Section 1: Carteira conectada */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-[#F5F1EB]">Carteira conectada</h2>
                <Link to="/wallets" className="text-xs text-[#D28A4C] hover:underline">
                  Trocar carteira
                </Link>
              </div>

              {/* Wallet Card 1: Reserva */}
              <div
                onClick={() => setSelectedConnectedWallet('reserva')}
                className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-colors ${
                  selectedConnectedWallet === 'reserva'
                    ? 'bg-[#241612] border border-[#D28A4C]'
                    : 'bg-[#1C1410] border border-[#3D251C]/60 opacity-80 hover:border-[#8C7760]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedConnectedWallet === 'reserva' ? 'border-[#D28A4C]' : 'border-[#3D251C]'
                  }`}>
                    {selectedConnectedWallet === 'reserva' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#D28A4C]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-[#F5F1EB]">Reserva</h3>
                    <p className="text-[11px] text-[#8C7760]">nova.kurio.eth</p>
                    <p className="text-[10px] text-[#CFB28C]">Rede Polygon</p>
                  </div>
                </div>
                <MoreVertical className="w-4 h-4 text-[#8C7760]" />
              </div>

              {/* Wallet Card 2: Principal */}
              <div
                onClick={() => setSelectedConnectedWallet('principal')}
                className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-colors ${
                  selectedConnectedWallet === 'principal'
                    ? 'bg-[#241612] border border-[#D28A4C]'
                    : 'bg-[#1C1410] border border-[#3D251C]/60 opacity-80 hover:border-[#8C7760]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedConnectedWallet === 'principal' ? 'border-[#D28A4C]' : 'border-[#3D251C]'
                  }`}>
                    {selectedConnectedWallet === 'principal' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#D28A4C]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-[#F5F1EB]">Principal</h3>
                    <p className="text-[11px] text-[#8C7760]">0xA91F...E82C</p>
                    <p className="text-[10px] text-[#CFB28C]">Rede principal Ethereum</p>
                  </div>
                </div>
                <MoreVertical className="w-4 h-4 text-[#8C7760]" />
              </div>
            </div>

            {/* Section 2: Carteira e rede */}
            <div className="space-y-3 pt-2">
              <h2 className="text-xs font-bold text-[#F5F1EB]">Carteira e rede</h2>

              {/* WalletConnect */}
              <label
                className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-colors ${
                  selectedWalletType === 'walletconnect'
                    ? 'bg-[#241612] border border-[#D28A4C]'
                    : 'bg-[#1C1410] border border-[#3D251C]/60 hover:border-[#8C7760]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    selectedWalletType === 'walletconnect' ? 'bg-[#D28A4C] text-[#140D0A]' : 'bg-[#2A1D15] text-[#D28A4C]'
                  }`}>
                    W
                  </div>
                  <span className="text-xs text-[#F5F1EB]">WalletConnect</span>
                </div>
                <input
                  type="radio"
                  name="mobileWallet"
                  value="walletconnect"
                  checked={selectedWalletType === 'walletconnect'}
                  onChange={() => setSelectedWalletType('walletconnect')}
                  className="accent-[#D28A4C] w-4 h-4 cursor-pointer"
                />
              </label>

              {/* MetaMask */}
              <label
                className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-colors ${
                  selectedWalletType === 'metamask'
                    ? 'bg-[#241612] border border-[#D28A4C]'
                    : 'bg-[#1C1410] border border-[#3D251C]/60 hover:border-[#8C7760]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    selectedWalletType === 'metamask' ? 'bg-[#D28A4C] text-[#140D0A]' : 'bg-[#2A1D15] text-[#D28A4C]'
                  }`}>
                    M
                  </div>
                  <span className="text-xs text-[#F5F1EB]">MetaMask</span>
                </div>
                <input
                  type="radio"
                  name="mobileWallet"
                  value="metamask"
                  checked={selectedWalletType === 'metamask'}
                  onChange={() => setSelectedWalletType('metamask')}
                  className="accent-[#D28A4C] w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Coinbase Wallet */}
              <label
                className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-colors ${
                  selectedWalletType === 'coinbase'
                    ? 'bg-[#241612] border border-[#D28A4C]'
                    : 'bg-[#1C1410] border border-[#3D251C]/60 hover:border-[#8C7760]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    selectedWalletType === 'coinbase' ? 'bg-[#D28A4C] text-[#140D0A]' : 'bg-[#2A1D15] text-[#D28A4C]'
                  }`}>
                    C
                  </div>
                  <span className="text-xs text-[#F5F1EB]">Coinbase Wallet</span>
                </div>
                <input
                  type="radio"
                  name="mobileWallet"
                  value="coinbase"
                  checked={selectedWalletType === 'coinbase'}
                  onChange={() => setSelectedWalletType('coinbase')}
                  className="accent-[#D28A4C] w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Form "Perfil do colecionador" (2 Subcolumns matching Figma) */}
            <div className="hidden lg:block lg:col-span-7 space-y-6">
              <h1 className="text-base font-bold text-[#F5F1EB]">
                Perfil do colecionador
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Subcol 1 */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] text-[#CFB28C] block mb-1">
                      Nome de exibição<span className="text-[#F0805F]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="w-full h-10 px-3 bg-[#241612] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#CFB28C] block mb-1">
                      Rede <span className="text-[#F0805F]">*</span>
                    </label>
                    <select
                      value={selectedNetwork}
                      onChange={e => setSelectedNetwork(e.target.value)}
                      className="w-full h-10 px-3 bg-[#241612] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                    >
                      <option value="Ethereum">Ethereum</option>
                      <option value="Polygon">Polygon</option>
                      <option value="Solana">Solana</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#CFB28C] block mb-1">
                      Endereço da carteira<span className="text-[#F0805F]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={walletAddress}
                      onChange={e => setWalletAddress(e.target.value)}
                      placeholder="Endereço 0x da carteira"
                      className="w-full h-10 px-3 bg-[#241612] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#CFB28C] block mb-1">
                      Tipo de carteira<span className="text-[#F0805F]">*</span>
                    </label>
                    <select
                      value={walletTypeSelect}
                      onChange={e => setWalletTypeSelect(e.target.value)}
                      className="w-full h-10 px-3 bg-[#241612] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                    >
                      <option value="metamask">MetaMask</option>
                      <option value="coinbase">Coinbase Wallet</option>
                      <option value="walletconnect">WalletConnect</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#CFB28C] block mb-1">
                      E-mail<span className="text-[#F0805F]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="alex@nftmarketplace.io"
                      className="w-full h-10 px-3 bg-[#241612] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="useOtherWallet"
                      checked={useOtherWallet}
                      onChange={e => setUseOtherWallet(e.target.checked)}
                      className="accent-[#D28A4C]"
                    />
                    <label htmlFor="useOtherWallet" className="text-xs text-[#CFB28C] cursor-pointer">
                      Usar outra carteira?
                    </label>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#CFB28C] block mb-1">
                      Observação do colecionador (opcional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={3}
                      className="w-full p-3 bg-[#241612] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                    />
                  </div>
                </div>

                {/* Subcol 2 */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] text-[#CFB28C] block mb-1">
                      Nome de usuário<span className="text-[#F0805F]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="alex_collector"
                      className="w-full h-10 px-3 bg-[#241612] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#CFB28C] block mb-1">
                      Nome do perfil<span className="text-[#F0805F]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="w-full h-10 px-3 bg-[#241612] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#CFB28C] block mb-1">
                      ENS ou carteira secundária (opcional)
                    </label>
                    <input
                      type="text"
                      value={secondaryWallet}
                      onChange={e => setSecondaryWallet(e.target.value)}
                      placeholder="ENS ou carteira secundária (opcional)"
                      className="w-full h-10 px-3 bg-[#241612] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#CFB28C] block mb-1">
                      Código de indicação<span className="text-[#F0805F]">*</span>
                    </label>
                    <input
                      type="text"
                      value={referralCode}
                      onChange={e => setReferralCode(e.target.value)}
                      placeholder="KURIO-REF"
                      className="w-full h-10 px-3 bg-[#241612] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#CFB28C] block mb-1">
                      Nome ENS <span className="text-[#F0805F]">*</span>
                    </label>
                    <div className="flex">
                      <select className="h-10 px-2 bg-[#1C1410] border border-[#3D251C] border-r-0 text-xs text-[#D28A4C] focus:outline-none">
                        <option value=".eth">.eth</option>
                      </select>
                      <input
                        type="text"
                        value={ensName}
                        onChange={e => setEnsName(e.target.value)}
                        placeholder="alex"
                        className="flex-1 h-10 px-3 bg-[#241612] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: "Seus NFTs" Summary & Submit Button (Responsive) */}
            <div className="lg:col-span-5 space-y-4 lg:space-y-5 lg:rounded-2xl lg:bg-[#241612] lg:border lg:border-[#3D251C]/40 lg:p-6">
              <div className="hidden lg:block space-y-5">
                <div className="flex items-center justify-between pb-2 text-[#8C7760]">
                  <h2 className="text-sm font-bold text-[#F5F1EB]">Seus NFTs</h2>
                  <span className="text-xs">Subtotal</span>
                </div>

                {/* Items List */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {items.map(item => {
                    const itemTotalEth = multiplyEth(item.priceEth, item.quantity)
                    return (
                      <div
                        key={`${item.nftId}-${item.editionId}`}
                        className="flex items-center justify-between gap-3 py-2 "
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-12 h-12 rounded-xl object-cover bg-[#1C120E] shrink-0"
                          />
                          <div>
                            <p className="text-xs font-bold text-[#F5F1EB] truncate max-w-[140px]">{item.title}</p>
                            <p className="text-[11px] text-[#8C7760]">ID do token: #{item.nftId.replace('nft-', '')} <span className="text-[#CFB28C]">(x {item.quantity})</span></p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#D28A4C]">
                          {formatEth(itemTotalEth)} ETH
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="text-right">
                  <Link to="/cart" className="text-[11px] text-[#CFB28C] hover:text-[#D28A4C]">
                    Tem um código promocional? Aplique aqui
                  </Link>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 pt-2 border-t border-[#2F1D15] text-xs">
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
                </div>

                {/* Carteira e Rede Selection matching Figma */}
                <div className="pt-3 border-t border-[#2F1D15] space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5F1EB] text-center">
                    Carteira e rede
                  </h3>

                  <div className="space-y-2">
                    <label className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedWalletType === 'all'
                        ? 'bg-[#241612] border border-[#D28A4C]'
                        : 'bg-[#1C1410] border border-[#3D251C] hover:border-[#8C7760]'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="walletOption"
                          value="all"
                          checked={selectedWalletType === 'all'}
                          onChange={() => setSelectedWalletType('all')}
                          className="accent-[#D28A4C]"
                        />
                        <span className="text-[10px] tracking-widest text-[#CFB28C] font-semibold">
                          METAMASK &bull; WALLETCONNECT &bull; COINBASE
                        </span>
                      </div>
                    </label>

                    <label className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedWalletType === 'metamask'
                        ? 'bg-[#241612] border border-[#D28A4C]'
                        : 'bg-[#1C1410] border border-[#3D251C] hover:border-[#8C7760]'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="walletOption"
                          value="metamask"
                          checked={selectedWalletType === 'metamask'}
                          onChange={() => setSelectedWalletType('metamask')}
                          className="accent-[#D28A4C]"
                        />
                        <span className="text-xs text-[#F5F1EB]">MetaMask</span>
                      </div>
                    </label>

                    <label className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedWalletType === 'coinbase'
                        ? 'bg-[#241612] border border-[#D28A4C]'
                        : 'bg-[#1C1410] border border-[#3D251C] hover:border-[#8C7760]'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="walletOption"
                          value="coinbase"
                          checked={selectedWalletType === 'coinbase'}
                          onChange={() => setSelectedWalletType('coinbase')}
                          className="accent-[#D28A4C]"
                        />
                        <span className="text-xs text-[#F5F1EB]">Coinbase Wallet</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Total & Submit Button (Mobile & Desktop) */}
              <div className="pt-2 lg:pt-2 space-y-4">
                <div className="flex items-center justify-between text-base border-t border-[#2F1D15] lg:border-t-0 pt-3 lg:pt-0">
                  <span className="font-bold text-[#F5F1EB]">Total:</span>
                  <span className="font-bold text-[#D28A4C]">{totalEth} ETH</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 lg:py-3 rounded-2xl lg:rounded-none bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase tracking-wider transition-colors shadow-lg disabled:opacity-50 text-center"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Processando...
                    </span>
                  ) : (
                    'Confirmar compra'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab="login"
      />
    </div>
  )
}
