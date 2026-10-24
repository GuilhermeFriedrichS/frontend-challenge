import { http, HttpResponse, delay } from 'msw'
import { mockDb } from '../db/store'
import { addEth, subtractEth, multiplyEth, calculateDiscount } from '@/shared/utils/eth'
import { CartQuote } from '@/shared/types'

export const cartHandlers = [
  // Calculate Quote and Validate Cart Items
  http.post('/api/cart/quote', async ({ request }) => {
    const scenario = mockDb.getScenario()
    await delay(scenario.latencyMs)

    if (scenario.simulateNetworkError) {
      return HttpResponse.error()
    }

    const body = (await request.json()) as {
      items: Array<{
        nftId: string
        editionId: string
        quantity: number
      }>
      couponCode?: string
    }

    const { items = [], couponCode } = body

    let subtotalEth = '0'
    const validationErrors: string[] = []
    let isValid = true

    for (const item of items) {
      const nft = mockDb.getNftById(item.nftId)
      if (!nft) {
        validationErrors.push(`NFT '${item.nftId}' não foi encontrado no catálogo.`)
        isValid = false
        continue
      }

      const edition = nft.editions.find(e => e.id === item.editionId)
      if (!edition) {
        validationErrors.push(`Edição '${item.editionId}' do NFT '${nft.title}' está indisponível.`)
        isValid = false
        continue
      }

      if (edition.availableQuantity < item.quantity) {
        validationErrors.push(
          `Quantidade solicitada (${item.quantity}) para '${nft.title}' excede o estoque disponível (${edition.availableQuantity}).`
        )
        isValid = false
        continue
      }

      const itemTotal = multiplyEth(edition.priceEth, item.quantity)
      subtotalEth = addEth(subtotalEth, itemTotal)
    }

    // Coupon calculation
    let discountEth = '0'
    let appliedCoupon = undefined

    if (couponCode && couponCode.trim()) {
      const coupon = mockDb.getCoupon(couponCode)
      if (!coupon) {
        validationErrors.push(`Cupom '${couponCode}' é inválido.`)
      } else {
        const isExpired = new Date(coupon.expiresAt).getTime() < Date.now()
        if (isExpired) {
          validationErrors.push(`Cupom '${couponCode}' expirou em ${new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}.`)
        } else {
          appliedCoupon = coupon
          discountEth = calculateDiscount(subtotalEth, coupon.discountPercentage)
        }
      }
    }

    // Network fee (fixed at 0.016 ETH as in Figma, or 0 if cart is empty)
    const networkFeeEth = items.length > 0 ? '0.016' : '0'

    // Total: Subtotal - Discount + Network Fee
    const afterDiscount = subtractEth(subtotalEth, discountEth)
    const totalEth = addEth(afterDiscount, networkFeeEth)

    const quote: CartQuote = {
      subtotalEth,
      discountEth,
      appliedCoupon,
      networkFeeEth,
      totalEth,
      isValid: isValid && (items.length > 0 ? true : false),
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
    }

    return HttpResponse.json(quote)
  }),
]
