import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'

interface FilterSidebarProps {
  category?: string
  minPrice?: string
  maxPrice?: string
  onCategoryChange: (category: string) => void
  onPriceChange: (min: string, max: string) => void
  onClear: () => void
}

const COLLECTIONS = [
  { id: 'art', label: 'Arte digital', count: 33 },
  { id: 'photography', label: 'Fotografia', count: 12 },
  { id: 'music', label: 'Música', count: 65 },
  { id: '3d', label: 'Arte 3D', count: 39 },
  { id: 'collectibles', label: 'Colecionáveis', count: 23 },
  { id: 'generative', label: 'Generativa', count: 17 },
  { id: 'games', label: 'Jogos', count: 19 },
  { id: 'subscriptions', label: 'Assinaturas', count: 13 },
  { id: 'utility', label: 'Utilidade', count: 18 },
]

const NETWORKS = [
  { name: 'Ethereum', count: 119 },
  { name: 'Polygon', count: 78 },
  { name: 'Solana', count: 86 },
]

const RANGE_MIN = 0.00
const RANGE_MAX = 15.00

const REGISTERED_NFT_IDS = [
  'nft-009',
  'nft-042',
  'nft-552',
  'nft-118',
  'nft-314',
  'nft-088',
  'nft-207',
  'nft-160',
]

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  category = '',
  minPrice = '',
  maxPrice = '',
  onCategoryChange,
  onPriceChange,
}) => {
  const navigate = useNavigate()
  const [localMin, setLocalMin] = useState(minPrice || '0.02')
  const [localMax, setLocalMax] = useState(maxPrice || '12.30')
  const [selectedNetwork, setSelectedNetwork] = useState('Ethereum')
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null)

  const trackRef = useRef<HTMLDivElement>(null)

  const handleFeaturedClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const randomIndex = Math.floor(Math.random() * REGISTERED_NFT_IDS.length)
    const randomId = REGISTERED_NFT_IDS[randomIndex]
    navigate({ to: '/nft/$id', params: { id: randomId } })
  }

  useEffect(() => {
    if (minPrice !== undefined && minPrice !== '') {
      setLocalMin(minPrice)
    }
  }, [minPrice])

  useEffect(() => {
    if (maxPrice !== undefined && maxPrice !== '') {
      setLocalMax(maxPrice)
    }
  }, [maxPrice])

  const parsedMin = Math.max(RANGE_MIN, Math.min(RANGE_MAX, parseFloat(localMin) || RANGE_MIN))
  const parsedMax = Math.max(RANGE_MIN, Math.min(RANGE_MAX, parseFloat(localMax) || RANGE_MAX))

  const minPercent = ((parsedMin - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100
  const maxPercent = ((parsedMax - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100

  const updateFromClientX = useCallback(
    (clientX: number, handle: 'min' | 'max') => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const rawRatio = (clientX - rect.left) / rect.width
      const clampedRatio = Math.max(0, Math.min(1, rawRatio))
      const rawVal = clampedRatio * (RANGE_MAX - RANGE_MIN) + RANGE_MIN
      const rounded = Math.round(rawVal * 100) / 100

      if (handle === 'min') {
        const curMax = parseFloat(localMax) || RANGE_MAX
        const safeMin = Math.min(rounded, Math.max(RANGE_MIN, curMax - 0.05))
        setLocalMin(safeMin.toFixed(2))
      } else {
        const curMin = parseFloat(localMin) || RANGE_MIN
        const safeMax = Math.max(rounded, Math.min(RANGE_MAX, curMin + 0.05))
        setLocalMax(safeMax.toFixed(2))
      }
    },
    [localMin, localMax]
  )

  const handlePointerDownHandle = (handle: 'min' | 'max') => (e: React.PointerEvent) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(handle)
  }

  const handlePointerMoveHandle = (handle: 'min' | 'max') => (e: React.PointerEvent) => {
    if (dragging === handle) {
      updateFromClientX(e.clientX, handle)
    }
  }

  const handlePointerUpHandle = (handle: 'min' | 'max') => (e: React.PointerEvent) => {
    if (dragging === handle) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // ignore
      }
      setDragging(null)
      onPriceChange(localMin, localMax)
    }
  }

  const handleTrackPointerDown = (e: React.PointerEvent) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const rawRatio = (e.clientX - rect.left) / rect.width
    const clickVal = rawRatio * (RANGE_MAX - RANGE_MIN) + RANGE_MIN
    const distToMin = Math.abs(clickVal - parsedMin)
    const distToMax = Math.abs(clickVal - parsedMax)
    const chosenHandle = distToMin <= distToMax ? 'min' : 'max'

    updateFromClientX(e.clientX, chosenHandle)
    onPriceChange(
      chosenHandle === 'min' ? Math.max(0, clickVal).toFixed(2) : localMin,
      chosenHandle === 'max' ? Math.min(RANGE_MAX, clickVal).toFixed(2) : localMax
    )
  }

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault()
    onPriceChange(localMin, localMax)
  }

  return (
    <aside className="w-full lg:w-60 space-y-8 font-mono text-xs">
      {/* 1. Coleções */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-[#F5F1EB]">Coleções</h3>
        <ul className="space-y-2 pl-4">
          {COLLECTIONS.map(item => {
            const isSelected = category === item.id
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onCategoryChange(isSelected ? '' : item.id)}
                  className={`w-full flex items-center justify-between transition-colors text-left py-0.5 ${
                    isSelected
                      ? 'text-[#D28A4C] font-bold'
                      : 'text-[#CFB28C] hover:text-[#F5F1EB]'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[#8C7760]">({item.count})</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* 2. Faixa de preço */}
      <div className="space-y-3 pt-2">
        <h3 className="font-bold text-sm text-[#F5F1EB]">Faixa de preço</h3>

        {/* Visual Dual Slider track matching Figma with full dragging support */}
        <div className="pl-4 space-y-3 pt-2">
          <div
            ref={trackRef}
            onPointerDown={handleTrackPointerDown}
            className="relative h-6 flex items-center cursor-pointer select-none touch-none"
            aria-label="Controle de faixa de preço"
          >
            {/* Background track line */}
            <div className="h-0.5 w-full bg-[#3D251C] relative">
              {/* Highlighted active range bar */}
              <div
                className="absolute top-0 bottom-0 bg-[#D28A4C]"
                style={{
                  left: `${minPercent}%`,
                  width: `${Math.max(0, maxPercent - minPercent)}%`,
                }}
              />
            </div>

            {/* Left Thumb (Min Price) */}
            <button
              type="button"
              role="slider"
              aria-label="Preço mínimo"
              aria-valuemin={RANGE_MIN}
              aria-valuemax={parsedMax}
              aria-valuenow={parsedMin}
              onPointerDown={handlePointerDownHandle('min')}
              onPointerMove={handlePointerMoveHandle('min')}
              onPointerUp={handlePointerUpHandle('min')}
              onPointerCancel={handlePointerUpHandle('min')}
              style={{ left: `${minPercent}%` }}
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#D28A4C] hover:scale-125 focus:outline-none focus:ring-2 focus:ring-[#D28A4C] cursor-grab active:cursor-grabbing transition-transform touch-none shadow ${
                dragging === 'min' ? 'scale-125 ring-2 ring-[#D28A4C]' : ''
              }`}
            />

            {/* Right Thumb (Max Price) */}
            <button
              type="button"
              role="slider"
              aria-label="Preço máximo"
              aria-valuemin={parsedMin}
              aria-valuemax={RANGE_MAX}
              aria-valuenow={parsedMax}
              onPointerDown={handlePointerDownHandle('max')}
              onPointerMove={handlePointerMoveHandle('max')}
              onPointerUp={handlePointerUpHandle('max')}
              onPointerCancel={handlePointerUpHandle('max')}
              style={{ left: `${maxPercent}%` }}
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#D28A4C] hover:scale-125 focus:outline-none focus:ring-2 focus:ring-[#D28A4C] cursor-grab active:cursor-grabbing transition-transform touch-none shadow ${
                dragging === 'max' ? 'scale-125 ring-2 ring-[#D28A4C]' : ''
              }`}
            />
          </div>

          <p className="text-[11px] text-[#CFB28C]">
            Preço: {localMin.replace('.', ',')} – {localMax.replace('.', ',')} ETH
          </p>

          <form onSubmit={handleApplyPrice} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={localMin}
                onChange={e => setLocalMin(e.target.value)}
                className="w-16 h-7 px-2 rounded-none bg-[#241612] border border-[#3D251C] text-[11px] text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                placeholder="0.02"
              />
              <span className="text-[#8C7760]">-</span>
              <input
                type="text"
                value={localMax}
                onChange={e => setLocalMax(e.target.value)}
                className="w-16 h-7 px-2 rounded-none bg-[#241612] border border-[#3D251C] text-[11px] text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                placeholder="12.30"
              />
            </div>

            <button
              type="submit"
              className="bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-[11px] uppercase tracking-wider px-4 py-1.5 transition-colors rounded-none"
            >
              Aplicar
            </button>
          </form>
        </div>
      </div>

      {/* 3. Rede */}
      <div className="space-y-3 pt-2">
        <h3 className="font-bold text-sm text-[#F5F1EB]">Rede</h3>
        <ul className="space-y-2">
          {NETWORKS.map(net => (
            <li key={net.name}>
              <button
                type="button"
                onClick={() => setSelectedNetwork(net.name)}
                className={`w-full flex items-center justify-between text-left py-0.5 transition-colors ${
                  selectedNetwork === net.name ? 'text-[#D28A4C] font-bold' : 'text-[#CFB28C] hover:text-[#F5F1EB]'
                }`}
              >
                <span>{net.name}</span>
                <span className="text-[#8C7760]">({net.count})</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 4. NFT EM DESTAQUE / OFERTA LIMITADA (Clicável -> abre NFT aleatório cadastrado) */}
      <div className="pt-4">
        <div className="text-center pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#D28A4C]">NFT EM DESTAQUE</h4>
          <p className="text-[10px] uppercase tracking-wider text-[#D28A4C] font-semibold">OFERTA LIMITADA</p>
        </div>
        <Link
          to="/nft/$id"
          params={{ id: 'nft-009' }}
          onClick={handleFeaturedClick}
          className="group block rounded-2xl overflow-hidden bg-[#241612] border border-[#3D251C]/40 hover:border-[#D28A4C] aspect-square transition-all duration-300 shadow-md hover:shadow-xl relative cursor-pointer"
          aria-label="Ver NFT em Destaque"
        >
          <img
            src="/assets/nfts/nft-1.jpg"
            alt="Sage Nomad #009 - Oferta Limitada"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#140D0A]/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
            <span className="text-[10px] bg-[#D28A4C] text-[#140D0A] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
              Ver Detalhes
            </span>
          </div>
        </Link>
      </div>
    </aside>
  )
}
