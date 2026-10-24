import { describe, it, expect } from 'vitest'
import { addEth, subtractEth, multiplyEth, calculateDiscount } from '@/shared/utils/eth'

describe('Cart Calculations & Integrity', () => {
  it('correctly calculates subtotal for multiple items with precision', () => {
    const item1 = multiplyEth('1.19', 2) // 2.38
    const item2 = multiplyEth('1.39', 6) // 8.34
    const item3 = multiplyEth('1.79', 9) // 16.11

    const subtotal = addEth(addEth(item1, item2), item3)
    expect(subtotal).toBe('26.83')
  })

  it('correctly applies coupon discount and calculates net total with network fee', () => {
    const subtotal = '26.83'
    const discount = calculateDiscount(subtotal, 10) // 10% of 26.83 = 2.6830
    const netSubtotal = subtractEth(subtotal, discount)
    const networkFee = '0.016'
    const total = addEth(netSubtotal, networkFee)

    expect(discount).toBe('2.6830')
    expect(total).toBe('24.163')
  })

  it('handles 0% or negative discounts safely', () => {
    expect(calculateDiscount('1.5', 0)).toBe('0')
    expect(calculateDiscount('1.5', -10)).toBe('0')
  })
})
