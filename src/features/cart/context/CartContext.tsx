import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { CartItem, CartQuote, NFT, Edition } from '@/shared/types'
import { api } from '@/shared/lib/api'
import { subscribeToNftUpdates } from '@/shared/lib/socket'
import { addEth, multiplyEth } from '@/shared/utils/eth'

interface CartContextType {
  items: CartItem[]
  addItem: (nft: NFT, edition: Edition, quantity?: number) => void
  updateQuantity: (nftId: string, editionId: string, quantity: number) => void
  removeItem: (nftId: string, editionId: string) => void
  clearCart: () => void
  removePurchasedItems: (purchasedItems: Array<{ nftId: string; editionId: string }>) => void
  couponCode: string
  applyCoupon: (code: string) => Promise<boolean>
  removeCoupon: () => void
  couponError: string | null
  quote: CartQuote | null
  isQuoteLoading: boolean
  hasPriceChanged: boolean
  acknowledgePriceChange: () => void
  priceChangeMessage: string | null
  totalItemsCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'KURIO_CART_V1'
const COUPON_STORAGE_KEY = 'KURIO_COUPON_CODE_V1'

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [couponCode, setCouponCode] = useState<string>(() => {
    return localStorage.getItem(COUPON_STORAGE_KEY) || ''
  })

  const [couponError, setCouponError] = useState<string | null>(null)
  const [quote, setQuote] = useState<CartQuote | null>(null)
  const [isQuoteLoading, setIsQuoteLoading] = useState<boolean>(false)
  const [hasPriceChanged, setHasPriceChanged] = useState<boolean>(false)
  const [priceChangeMessage, setPriceChangeMessage] = useState<string | null>(null)

  // Persist items
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Ignore
    }
  }, [items])

  // Persist coupon
  useEffect(() => {
    try {
      if (couponCode) {
        localStorage.setItem(COUPON_STORAGE_KEY, couponCode)
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY)
      }
    } catch {
      // Ignore
    }
  }, [couponCode])

  // Recalculate quote whenever items or coupon changes
  const fetchQuote = useCallback(async (currentItems: CartItem[], currentCoupon: string) => {
    if (currentItems.length === 0) {
      setQuote({
        subtotalEth: '0',
        discountEth: '0',
        networkFeeEth: '0',
        totalEth: '0',
        isValid: false,
      })
      return
    }

    setIsQuoteLoading(true)
    try {
      const payload = {
        items: currentItems.map(i => ({
          nftId: i.nftId,
          editionId: i.editionId,
          quantity: i.quantity,
        })),
        couponCode: currentCoupon || undefined,
      }

      const response = await api.post<CartQuote>('/cart/quote', payload)
      setQuote(response.data)

      if (currentCoupon && !response.data.appliedCoupon) {
        setCouponError('Cupom inválido ou expirado.')
      } else {
        setCouponError(null)
      }
    } catch (err: any) {
      console.warn('Erro ao calcular cotação do carrinho:', err)
      // Fallback local calculation
      let sub = '0'
      currentItems.forEach(i => {
        sub = addEth(sub, multiplyEth(i.priceEth, i.quantity))
      })
      setQuote({
        subtotalEth: sub,
        discountEth: '0',
        networkFeeEth: '0.016',
        totalEth: addEth(sub, '0.016'),
        isValid: true,
      })
    } finally {
      setIsQuoteLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQuote(items, couponCode)
  }, [items, couponCode, fetchQuote])

  // Real-time listener: Listen for NFT price & availability updates
  useEffect(() => {
    const unsubscribe = subscribeToNftUpdates(payload => {
      setItems(prevItems => {
        let changed = false
        let msg = ''

        const updated = prevItems.map(item => {
          if (item.nftId === payload.nftId) {
            // Check if price changed
            if (payload.newPriceEth && payload.newPriceEth !== item.priceEth) {
              changed = true
              msg = `O preço do item '${item.title}' mudou de ${item.priceEth} ETH para ${payload.newPriceEth} ETH.`
              return { ...item, priceEth: payload.newPriceEth }
            }

            // Check if edition availability changed
            if (payload.editions) {
              const ed = payload.editions.find(e => e.editionId === item.editionId)
              if (ed && ed.priceEth !== item.priceEth) {
                changed = true
                msg = `A cotação de '${item.title}' foi atualizada para ${ed.priceEth} ETH.`
                return { ...item, priceEth: ed.priceEth, maxAvailable: ed.availableQuantity }
              }
            }
          }
          return item
        })

        if (changed) {
          setHasPriceChanged(true)
          setPriceChangeMessage(msg || 'Valores de itens no carrinho foram alterados em tempo real.')
        }

        return updated
      })
    })

    return () => unsubscribe()
  }, [])

  const addItem = useCallback((nft: NFT, edition: Edition, quantity: number = 1) => {
    setItems(prev => {
      const existingIdx = prev.findIndex(i => i.nftId === nft.id && i.editionId === edition.id)
      if (existingIdx !== -1) {
        const existing = prev[existingIdx]
        const newQty = Math.min(edition.availableQuantity, existing.quantity + quantity)
        const updated = [...prev]
        updated[existingIdx] = { ...existing, quantity: newQty }
        return updated
      } else {
        const newItem: CartItem = {
          nftId: nft.id,
          editionId: edition.id,
          title: nft.title,
          imageUrl: nft.imageUrl,
          editionName: edition.name,
          priceEth: edition.priceEth,
          quantity: Math.min(edition.availableQuantity, Math.max(1, quantity)),
          maxAvailable: edition.availableQuantity,
        }
        return [...prev, newItem]
      }
    })
  }, [])

  const updateQuantity = useCallback((nftId: string, editionId: string, quantity: number) => {
    setItems(prev =>
      prev
        .map(item => {
          if (item.nftId === nftId && item.editionId === editionId) {
            if (quantity <= 0) return null
            const validQty = Math.min(item.maxAvailable, quantity)
            return { ...item, quantity: validQty }
          }
          return item
        })
        .filter(Boolean) as CartItem[]
    )
  }, [])

  const removeItem = useCallback((nftId: string, editionId: string) => {
    setItems(prev => prev.filter(i => !(i.nftId === nftId && i.editionId === editionId)))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setCouponCode('')
    setCouponError(null)
  }, [])

  const removePurchasedItems = useCallback((purchased: Array<{ nftId: string; editionId: string }>) => {
    setItems(prev =>
      prev.filter(
        item => !purchased.some(p => p.nftId === item.nftId && p.editionId === item.editionId)
      )
    )
  }, [])

  const applyCoupon = useCallback(async (code: string) => {
    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode) return false
    setCouponCode(cleanCode)
    return true
  }, [])

  const removeCoupon = useCallback(() => {
    setCouponCode('')
    setCouponError(null)
  }, [])

  const acknowledgePriceChange = useCallback(() => {
    setHasPriceChanged(false)
    setPriceChangeMessage(null)
  }, [])

  const totalItemsCount = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0)
  }, [items])

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        removePurchasedItems,
        couponCode,
        applyCoupon,
        removeCoupon,
        couponError,
        quote,
        isQuoteLoading,
        hasPriceChanged,
        acknowledgePriceChange,
        priceChangeMessage,
        totalItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
