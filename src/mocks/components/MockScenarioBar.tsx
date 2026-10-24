import React, { useState, useEffect } from 'react'
import { mockDb, ScenarioConfig } from '../db/store'
import { socketServer } from '../socket/server'
import { Button } from '@/shared/components/ui/button'
import { RotateCcw, Zap, SlidersHorizontal, ChevronUp, ChevronDown } from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'
import { queryClient } from '@/shared/lib/queryClient'

export const MockScenarioBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scenario, setScenario] = useState<ScenarioConfig>(() => mockDb.getScenario())
  const { toast } = useToast()

  useEffect(() => {
    const unsub = mockDb.subscribe(() => {
      setScenario(mockDb.getScenario())
    })
    return () => {
      unsub()
    }
  }, [])

  const toggleScenario = (key: keyof ScenarioConfig, val: any) => {
    mockDb.updateScenario({ [key]: val })
    setScenario(mockDb.getScenario())
  }

  const handleResetData = () => {
    mockDb.reset()
    localStorage.removeItem('KURIO_AUTH_TOKEN')
    localStorage.removeItem('KURIO_AUTH_USER')
    localStorage.removeItem('KURIO_CART_V1')
    localStorage.removeItem('KURIO_COUPON_CODE_V1')
    queryClient.clear()
    toast({
      title: 'Dados resetados com sucesso!',
      description: 'Estado inicial restaurado com fixtures limpas.',
      variant: 'success',
    })
    window.location.reload()
  }

  const handleTriggerPriceChange = () => {
    const updated = mockDb.updateNftPrice('nft-042', '1.45')
    if (updated) {
      socketServer.emitNftUpdated({
        nftId: 'nft-042',
        newPriceEth: '1.45',
        editions: updated.nft.editions?.map(e => ({
          editionId: e.id,
          priceEth: '1.45',
          availableQuantity: e.availableQuantity,
        })),
      })
      toast({
        title: '⚡ Evento Socket.IO emitido: nft.updated',
        description: 'Preço do Emerald Ape #042 alterado para 1.45 ETH em tempo real.',
        variant: 'info',
      })
    }
  }

  const handleTriggerFailNext = () => {
    mockDb.updateScenario({ failNextRequest: true })
    toast({
      title: 'Próxima mutation falhará!',
      description: 'Clique no coração de favoritos para ver a atualização otimista reverter (rollback)!',
      variant: 'destructive',
    })
  }

  return (
    <div className="hidden md:block fixed bottom-0 left-4 z-50 font-mono text-xs">
      <div className="bg-[#1C1410] border border-[#3D251C] rounded-t-lg shadow-2xl overflow-hidden">
        {/* Toggle Bar */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 text-[#CFB28C] hover:text-[#E89B55] transition-colors w-full bg-[#241612]"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#E89B55]" />
          <span className="font-bold">Painel de Avaliação (MSW & Socket.IO)</span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 ml-auto" /> : <ChevronUp className="w-3.5 h-3.5 ml-auto" />}
        </button>

        {isOpen && (
          <div className="p-4 space-y-3 bg-[#1A120E] border-t border-[#2F1D15] max-w-sm">
            {/* Latency Selection */}
            <div>
              <label className="text-[11px] text-[#8C7760] font-semibold block mb-1">
                Latência de Rede Simulada:
              </label>
              <div className="flex gap-1.5">
                {[80, 500, 1500, 3000].map(ms => (
                  <button
                    key={ms}
                    onClick={() => toggleScenario('latencyMs', ms)}
                    className={`flex-1 py-1 px-2 rounded border text-[11px] transition-colors ${
                      scenario.latencyMs === ms
                        ? 'border-[#E89B55] bg-[#E89B55]/20 text-[#E89B55] font-bold'
                        : 'border-[#3D251C] bg-[#241612] text-[#CFB28C]'
                    }`}
                  >
                    {ms}ms
                  </button>
                ))}
              </div>
            </div>

            {/* Error Flags */}
            <div className="space-y-1.5 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[#CFB28C] hover:text-white">
                <input
                  type="checkbox"
                  checked={scenario.simulateNetworkError}
                  onChange={e => toggleScenario('simulateNetworkError', e.target.checked)}
                  className="rounded border-[#3D251C] text-[#E89B55] focus:ring-[#E89B55]"
                />
                <span>Simular Queda de Rede (Offline)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#CFB28C] hover:text-white">
                <input
                  type="checkbox"
                  checked={scenario.simulateSessionExpired}
                  onChange={e => toggleScenario('simulateSessionExpired', e.target.checked)}
                  className="rounded border-[#3D251C] text-[#E89B55] focus:ring-[#E89B55]"
                />
                <span>Simular Sessão Expirada (401)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#CFB28C] hover:text-white">
                <input
                  type="checkbox"
                  checked={scenario.simulatePaymentFailure}
                  onChange={e => toggleScenario('simulatePaymentFailure', e.target.checked)}
                  className="rounded border-[#3D251C] text-[#E89B55] focus:ring-[#E89B55]"
                />
                <span>Simular Recusa de Pagamento</span>
              </label>
            </div>

            {/* Triggers for Realtime & Optimistic Update */}
            <div className="pt-2 border-t border-[#2F1D15] space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTriggerPriceChange}
                className="w-full text-xs flex items-center justify-center gap-1.5 text-[#E89B55] border-[#E89B55]/40"
              >
                <Zap className="w-3.5 h-3.5" /> Disparar `nft.updated` via Socket
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleTriggerFailNext}
                className="w-full text-xs flex items-center justify-center gap-1.5 text-[#F0805F] border-[#F0805F]/40"
              >
                Simular Falha na Próxima Ação (Rollback)
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetData}
                className="w-full text-xs flex items-center justify-center gap-1.5 text-[#8C7760] hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Resetar Mocks e Cache
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
