import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { api } from '@/shared/lib/api'
import { Order } from '@/shared/types'
import { subscribeToOrderUpdates } from '@/shared/lib/socket'
import { formatEth, multiplyEth } from '@/shared/utils/eth'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { X, Clock, AlertTriangle } from 'lucide-react'

export const Route = createFileRoute('/order/$id')({
  component: OrderConfirmationPage,
})

function OrderConfirmationPage() {
  const { id } = Route.useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    api.get<Order>(`/orders/${id}`)
      .then(res => {
        setOrder(res.data)
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Falha ao recuperar o comprovante do pedido.')
      })
      .finally(() => setIsLoading(false))
  }, [id])

  useEffect(() => {
    const unsubscribe = subscribeToOrderUpdates(payload => {
      if (payload.orderId === id) {
        setOrder(prev => {
          if (!prev) return prev
          return {
            ...prev,
            status: payload.status,
            transactionHash: payload.transactionHash || prev.transactionHash,
            rejectionReason: payload.rejectionReason || prev.rejectionReason,
          }
        })
      }
    })

    return () => unsubscribe()
  }, [id])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 font-mono space-y-6 max-w-lg">
        <Skeleton className="h-64 w-full rounded-2xl bg-[#241612]" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-20 font-mono text-center space-y-6 max-w-md">
        <div className="w-16 h-16 rounded-full bg-[#2A1410] border border-[#F0805F] flex items-center justify-center mx-auto text-[#F0805F]">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white">Pedido Não Encontrado</h1>
        <p className="text-xs text-[#CFB28C]">{error}</p>
        <Link
          to="/"
          className="inline-block bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase px-6 py-2.5 transition-colors"
        >
          Voltar ao Início
        </Link>
      </div>
    )
  }

  const isConfirmed = order.status === 'confirmed'
  const isPending = order.status === 'pending'
  const isRejected = order.status === 'rejected'

  const formattedDate = new Date(order.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 font-mono text-xs">
      {/* Centered Modal / Receipt Card matching Figma Confirmação de Pedido.png */}
      <div className="relative w-full max-w-lg rounded-2xl bg-[#241612] border border-[#3D251C]/60 shadow-2xl overflow-hidden">
        {/* Top Close Button */}
        <Link
          to="/"
          className="absolute top-4 right-4 p-1.5 text-[#8C7760] hover:text-[#F5F1EB] transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </Link>

        <div className="p-8 space-y-6 text-center">
          {/* Header Icon & Status */}
          {isConfirmed && (
            <div className="space-y-3">
              {/* Thank You Envelope Icon matching Figma */}
              <div className="w-16 h-16 mx-auto relative flex items-center justify-center text-[#D28A4C]">
                <svg viewBox="0 0 48 48" className="w-14 h-14" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="6" y="16" width="36" height="24" rx="2" stroke="currentColor" />
                  <path d="M6 18L24 30L42 18" stroke="currentColor" />
                  <path d="M14 16V10C14 8.89543 14.8954 8 16 8H32C33.1046 8 34 8.89543 34 10V16" stroke="currentColor" />
                  <text x="24" y="14" textAnchor="middle" fill="currentColor" fontSize="6" fontWeight="bold" fontFamily="monospace">THANK</text>
                  <text x="24" y="20" textAnchor="middle" fill="currentColor" fontSize="5" fontWeight="bold" fontFamily="monospace">YOU</text>
                </svg>
              </div>

              <h1 className="text-sm font-bold text-[#F5F1EB]">
                Seus NFTs agora estão na sua carteira
              </h1>
            </div>
          )}

          {isPending && (
            <div className="space-y-3">
              <Clock className="w-12 h-12 text-[#D28A4C] mx-auto animate-pulse" />
              <h1 className="text-sm font-bold text-[#F5F1EB]">
                Aguardando confirmação na rede...
              </h1>
              <p className="text-[11px] text-[#CFB28C]">
                A transação está sendo processada pelos validadores. A página atualizará automaticamente.
              </p>
            </div>
          )}

          {isRejected && (
            <div className="space-y-3">
              <AlertTriangle className="w-12 h-12 text-[#F0805F] mx-auto" />
              <h1 className="text-sm font-bold text-[#F5F1EB]">
                Transação Recusada
              </h1>
              <p className="text-[11px] text-[#F0805F]">
                {order.rejectionReason || 'Falha na validação ou saldo insuficiente.'}
              </p>
            </div>
          )}

          {/* Metadata Row matching Figma: ID da transação | Data | Total | Carteira */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-t  text-[11px] text-left">
            <div>
              <span className="text-[#8C7760] block">ID da transação</span>
              <span className="text-[#F5F1EB] font-bold truncate block">
                {order.transactionHash ? `${order.transactionHash.slice(0, 6)}...${order.transactionHash.slice(-4)}` : '0xA91F...E82C'}
              </span>
            </div>
            <div>
              <span className="text-[#8C7760] block">Data</span>
              <span className="text-[#F5F1EB] block">{formattedDate}</span>
            </div>
            <div>
              <span className="text-[#8C7760] block">Total</span>
              <span className="text-[#D28A4C] font-bold block">{order.totalEth} ETH</span>
            </div>
            <div>
              <span className="text-[#8C7760] block">Carteira</span>
              <span className="text-[#F5F1EB] block">{order.network === 'Polygon' ? 'Coinbase' : 'MetaMask'}</span>
            </div>
          </div>

          {/* "Detalhes da transação" Section matching Figma */}
          <div className="space-y-3 text-left">
            <h3 className="text-xs font-bold text-[#F5F1EB]">Detalhes da transação</h3>

            <div className="flex items-center justify-between text-[11px] text-[#8C7760] pb-2 ">
              <span>NFTs</span>
              <div className="flex gap-12">
                <span>Edições</span>
                <span>Subtotal</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              {order.items.map(item => {
                const itemTotal = multiplyEth(item.priceEth, item.quantity)
                return (
                  <div key={`${item.nftId}-${item.editionId}`} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-12 h-12 rounded-xl object-cover bg-[#1C120E] shrink-0"
                      />
                      <div>
                        <p className="font-bold text-[#F5F1EB]">{item.title}</p>
                        <p className="text-[10px] text-[#8C7760]">ID do token: #{item.nftId.replace('nft-', '')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-12 text-right">
                      <span className="text-[#CFB28C]">(x {item.quantity})</span>
                      <span className="font-bold text-[#D28A4C]">{formatEth(itemTotal)} ETH</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Totals Breakdown matching Figma */}
            <div className="pt-4 border-t border-[#2F1D15] space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-[#CFB28C]">
                <span>Taxa de rede</span>
                <span className="text-[#F5F1EB]">{order.networkFeeEth} ETH</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1">
                <span className="text-[#F5F1EB]">Total</span>
                <span className="text-[#D28A4C]">{order.totalEth} ETH</span>
              </div>
            </div>
          </div>

          {/* Legal / Confirmation Note */}
          <p className="text-[11px] text-[#8C7760] leading-relaxed pt-2">
            Transação confirmada na Ethereum. A propriedade foi transferida para sua carteira conectada e registrada na rede.
          </p>

          {/* Ver no Etherscan button matching Figma */}
          <div className="pt-2">
            <a
              href={`https://etherscan.io/tx/${order.transactionHash || '0xA91F...E82C'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase px-8 py-3 transition-colors rounded-none"
            >
              Ver no Etherscan
            </a>
          </div>
        </div>

        {/* Solid amber accent bar at bottom matching Figma */}
        <div className="h-1.5 w-full bg-[#D28A4C]" />
      </div>
    </div>
  )
}
