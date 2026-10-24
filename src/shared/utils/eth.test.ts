import { describe, it, expect } from 'vitest'
import {
  addEth,
  subtractEth,
  multiplyEth,
  calculateDiscount,
  formatEth,
  isValidEthString,
  ethToUsd,
} from './eth'

describe('ETH Precision & Formatting Utilities', () => {
  it('validates ETH strings correctly', () => {
    expect(isValidEthString('0.05')).toBe(true)
    expect(isValidEthString('12.3456789012345678')).toBe(true)
    expect(isValidEthString('0')).toBe(true)
    expect(isValidEthString('-0.05')).toBe(false)
    expect(isValidEthString('abc')).toBe(false)
    expect(isValidEthString('')).toBe(false)
  })

  it('performs exact addition without JavaScript floating-point errors', () => {
    // 0.1 + 0.2 in JS float is 0.30000000000000004
    expect(addEth('0.1', '0.2')).toBe('0.3')
    expect(addEth('1.000000000000000001', '2.000000000000000002')).toBe('3.000000000000000003')
    expect(addEth('0', '0.045')).toBe('0.045')
  })

  it('performs exact subtraction and clamps at 0', () => {
    expect(subtractEth('0.5', '0.2')).toBe('0.3')
    expect(subtractEth('0.2', '0.5')).toBe('0')
    expect(subtractEth('1.5', '1.5')).toBe('0')
  })

  it('multiplies price by integer quantity accurately', () => {
    expect(multiplyEth('0.045', 3)).toBe('0.135')
    expect(multiplyEth('1.25', 4)).toBe('5')
    expect(multiplyEth('0.5', 0)).toBe('0')
    expect(multiplyEth('0.5', -2)).toBe('0')
  })

  it('calculates discount correctly', () => {
    expect(calculateDiscount('1.0', 10)).toBe('0.1000')
    expect(calculateDiscount('0.5', 20)).toBe('0.1000')
    expect(calculateDiscount('0.5', 0)).toBe('0')
  })

  it('formats ETH strings neatly for display', () => {
    expect(formatEth('0.0450000')).toBe('0.045 ETH')
    expect(formatEth('1')).toBe('1 ETH')
    expect(formatEth('0')).toBe('0 ETH')
    expect(formatEth('')).toBe('0 ETH')
    expect(formatEth('3.1415926', 2)).toBe('3.14 ETH')
  })

  it('converts ETH to USD string for preview', () => {
    const usd = ethToUsd('1.0', 2000)
    expect(usd).toBe('$2,000.00')
  })
})
