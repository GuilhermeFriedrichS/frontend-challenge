import { describe, it, expect } from 'vitest'
import { getUserIdFromToken } from './handlers/token'
import { hashPassword, verifyPassword } from './db/password'
import { INITIAL_USERS } from './db/fixtures'

describe('getUserIdFromToken', () => {
  it('strips the trailing timestamp from seeded user tokens', () => {
    expect(getUserIdFromToken('mock-token-user-alex-1729781234567')).toBe('user-alex')
    expect(getUserIdFromToken('mock-token-user-elena-1729781234567')).toBe('user-elena')
  })

  it('handles registered users whose id is itself numeric', () => {
    expect(getUserIdFromToken('mock-token-user-1729781200000-1729781234567')).toBe(
      'user-1729781200000'
    )
  })

  it('rejects missing or malformed tokens', () => {
    expect(getUserIdFromToken(null)).toBeNull()
    expect(getUserIdFromToken('garbage')).toBeNull()
  })
})

describe('password hashing', () => {
  it('never stores the demo password in clear text', () => {
    for (const user of INITIAL_USERS) {
      expect(user.passwordHash).not.toBe('Password123!')
      expect(user.passwordHash).toMatch(/^[0-9a-f]{64}$/)
    }
  })

  it('verifies the seeded demo credentials', async () => {
    for (const user of INITIAL_USERS) {
      expect(await verifyPassword(user.id, 'Password123!', user.passwordHash)).toBe(true)
      expect(await verifyPassword(user.id, 'wrong', user.passwordHash)).toBe(false)
    }
  })

  it('salts per user', async () => {
    expect(await hashPassword('user-a', 'same')).not.toBe(await hashPassword('user-b', 'same'))
  })
})
