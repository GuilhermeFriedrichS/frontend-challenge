/**
 * Password hashing for the mock backend.
 * Passwords are never persisted in clear text: we store SHA-256(`kurio:<userId>:<password>`),
 * salted per user so equal passwords produce different hashes.
 * This is a simulation-grade hash (a real backend would use bcrypt/argon2 server-side).
 */
export async function hashPassword(userId: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`kurio:${userId}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPassword(
  userId: string,
  password: string,
  storedHash: string
): Promise<boolean> {
  return (await hashPassword(userId, password)) === storedHash
}
