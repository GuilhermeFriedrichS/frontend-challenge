import BigNumber from 'bignumber.js'

// Configure BigNumber for cryptographic / ETH financial precision
BigNumber.config({
  DECIMAL_PLACES: 18,
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
  EXPONENTIAL_AT: [-18, 30],
})

/**
 * Validates whether a value is a valid non-negative decimal string
 */
export function isValidEthString(value: string): boolean {
  try {
    const bn = new BigNumber(value)
    return !bn.isNaN() && bn.isGreaterThanOrEqualTo(0)
  } catch {
    return false
  }
}

/**
 * Adds two ETH string values with arbitrary precision: a + b
 */
export function addEth(a: string, b: string): string {
  const bnA = new BigNumber(a || '0')
  const bnB = new BigNumber(b || '0')
  return bnA.plus(bnB).toFixed()
}

/**
 * Subtracts two ETH string values: a - b (clamped at 0 if below zero)
 */
export function subtractEth(a: string, b: string): string {
  const bnA = new BigNumber(a || '0')
  const bnB = new BigNumber(b || '0')
  const result = bnA.minus(bnB)
  return result.isLessThan(0) ? '0' : result.toFixed()
}

/**
 * Multiplies an ETH string price by an integer quantity: price * quantity
 */
export function multiplyEth(price: string, quantity: number): string {
  const bnPrice = new BigNumber(price || '0')
  const bnQty = new BigNumber(Math.max(0, Math.floor(quantity)))
  return bnPrice.multipliedBy(bnQty).toFixed()
}

/**
 * Calculates a percentage discount on an ETH price: price * (percent / 100)
 */
export function calculateDiscount(price: string, percent: number): string {
  if (percent <= 0) return '0'
  const bnPrice = new BigNumber(price || '0')
  const bnPercent = new BigNumber(percent).dividedBy(100)
  return bnPrice.multipliedBy(bnPercent).toFixed(4)
}

/**
 * Formats an ETH string for presentation:
 * e.g., "0.0450" -> "0.045 ETH", preserving significant decimals up to maxDecimals (default: 4)
 */
export function formatEth(value: string | number, maxDecimals: number = 4): string {
  if (!value && value !== 0) return '0 ETH'
  try {
    const bn = new BigNumber(value)
    if (bn.isNaN()) return '0 ETH'
    
    // Trim unnecessary trailing zeros after decimal point
    const formatted = bn.decimalPlaces(maxDecimals).toString(10)
    return `${formatted} ETH`
  } catch {
    return '0 ETH'
  }
}

/**
 * Approximates ETH to USD conversion for preview/display
 */
export function ethToUsd(ethAmount: string, ethUsdRate: number = 2650): string {
  try {
    const bn = new BigNumber(ethAmount || '0')
    const usd = bn.multipliedBy(ethUsdRate)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usd.toNumber())
  } catch {
    return '$0.00'
  }
}
