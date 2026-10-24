import { http, HttpResponse, delay } from 'msw'
import { mockDb } from '../db/store'
import { extractToken, getUserFromToken } from './token'
import { hashPassword, verifyPassword } from '../db/password'

export const authHandlers = [
  // Login
  http.post('/api/auth/login', async ({ request }) => {
    const scenario = mockDb.getScenario()
    await delay(scenario.latencyMs)

    if (scenario.simulateNetworkError) {
      return HttpResponse.error()
    }

    const body = (await request.json()) as { email?: string; password?: string }
    const { email, password } = body

    if (!email || !password) {
      return HttpResponse.json(
        { message: 'E-mail e senha são obrigatórios.' },
        { status: 400 }
      )
    }

    const user = mockDb.findUserByEmail(email)
    if (!user || !(await verifyPassword(user.id, password, user.passwordHash))) {
      return HttpResponse.json(
        { message: 'Credenciais inválidas. Verifique seu e-mail e senha.' },
        { status: 401 }
      )
    }

    const token = `mock-token-${user.id}-${Date.now()}`
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { passwordHash: _, ...userSafe } = user

    return HttpResponse.json({
      token,
      user: userSafe,
      expiresAt,
    })
  }),

  // Register
  http.post('/api/auth/register', async ({ request }) => {
    const scenario = mockDb.getScenario()
    await delay(scenario.latencyMs)

    if (scenario.simulateNetworkError) {
      return HttpResponse.error()
    }

    const body = (await request.json()) as {
      name?: string
      username?: string
      email?: string
      password?: string
    }

    const { name, username, email, password } = body

    if (!email || !password || !name) {
      return HttpResponse.json(
        { message: 'Campos obrigatórios não preenchidos.' },
        { status: 400 }
      )
    }

    if (mockDb.findUserByEmail(email)) {
      return HttpResponse.json(
        { message: 'Já existe uma conta cadastrada com este e-mail.' },
        { status: 409 }
      )
    }

    const newUserId = `user-${Date.now()}`
    const newUser = mockDb.createUser({
      id: newUserId,
      name,
      username: username || name.toLowerCase().replace(/\s+/g, '_'),
      email,
      passwordHash: await hashPassword(newUserId, password),
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80`,
      createdAt: new Date().toISOString(),
    })

    const token = `mock-token-${newUser.id}-${Date.now()}`
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { passwordHash: _, ...userSafe } = newUser

    return HttpResponse.json(
      {
        token,
        user: userSafe,
        expiresAt,
      },
      { status: 201 }
    )
  }),

  // Session verification
  http.get('/api/auth/session', async ({ request }) => {
    const scenario = mockDb.getScenario()
    await delay(scenario.latencyMs)

    if (scenario.simulateSessionExpired) {
      return HttpResponse.json(
        { message: 'Sessão expirada. Faça login novamente.' },
        { status: 401 }
      )
    }

    const token = extractToken(request)
    const user = getUserFromToken(token)

    if (!user) {
      return HttpResponse.json(
        { message: 'Sessão inválida ou não autenticada.' },
        { status: 401 }
      )
    }

    const { passwordHash: _, ...userSafe } = user
    return HttpResponse.json({
      token,
      user: userSafe,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
  }),

  // Logout
  http.post('/api/auth/logout', async () => {
    return HttpResponse.json({ message: 'Logout realizado com sucesso.' })
  }),

  // Update Profile
  http.put('/api/auth/profile', async ({ request }) => {
    const scenario = mockDb.getScenario()
    await delay(scenario.latencyMs)

    const token = extractToken(request)
    const user = getUserFromToken(token)

    if (!user) {
      return HttpResponse.json({ message: 'Não autorizado.' }, { status: 401 })
    }

    const updates = (await request.json()) as {
      name?: string
      username?: string
      avatarUrl?: string
      ensName?: string
      bio?: string
    }

    const updated = mockDb.updateUser(user.id, updates)
    if (!updated) {
      return HttpResponse.json({ message: 'Erro ao atualizar perfil.' }, { status: 500 })
    }

    const { passwordHash: _, ...userSafe } = updated
    return HttpResponse.json(userSafe)
  }),

  // Change Password
  http.put('/api/auth/password', async ({ request }) => {
    const scenario = mockDb.getScenario()
    await delay(scenario.latencyMs)

    const token = extractToken(request)
    const user = getUserFromToken(token)

    if (!user) {
      return HttpResponse.json({ message: 'Não autorizado.' }, { status: 401 })
    }

    const { currentPassword, newPassword } = (await request.json()) as {
      currentPassword?: string
      newPassword?: string
    }

    if (!currentPassword || !(await verifyPassword(user.id, currentPassword, user.passwordHash))) {
      return HttpResponse.json(
        { message: 'Senha atual incorreta.' },
        { status: 400 }
      )
    }

    if (!newPassword || newPassword.length < 6) {
      return HttpResponse.json(
        { message: 'A nova senha deve conter pelo menos 6 caracteres.' },
        { status: 400 }
      )
    }

    mockDb.updateUser(user.id, { passwordHash: await hashPassword(user.id, newPassword) })
    return HttpResponse.json({ message: 'Senha alterada com sucesso.' })
  }),
]
