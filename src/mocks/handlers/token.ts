import { mockDb } from '../db/store'

export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  return authHeader.replace('Bearer ', '').trim()
}

export function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null
  // Match mock-token-${userId}-${timestamp}
  const matchWithTimestamp = token.match(/^mock-token-(.+)-(\d+)$/)
  if (matchWithTimestamp) return matchWithTimestamp[1]

  // Fallback for mock-token-${userId}
  const matchDirect = token.match(/^mock-token-(.+)$/)
  if (matchDirect) return matchDirect[1]

  return null
}

export function getUserFromToken(token: string | null) {
  const userId = getUserIdFromToken(token)
  if (!userId) return null
  return mockDb.findUserById(userId)
}
