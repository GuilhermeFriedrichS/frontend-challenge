import { http, HttpResponse, delay } from 'msw'
import { mockDb } from '../db/store'
import { Wallet } from '@/shared/types'
import { extractToken, getUserIdFromToken } from './token'

export const walletHandlers = [
  // List Wallets
  http.get('/api/wallets', async ({ request }) => {
    const scenario = mockDb.getScenario()
    await delay(scenario.latencyMs)

    const userId = getUserIdFromToken(extractToken(request))
    if (!userId) {
      return HttpResponse.json({ message: 'Não autorizado.' }, { status: 401 })
    }

    const wallets = mockDb.getWallets(userId)
    return HttpResponse.json({ items: wallets })
  }),

  // Add Wallet
  http.post('/api/wallets', async ({ request }) => {
    const scenario = mockDb.getScenario()
    await delay(scenario.latencyMs)

    const userId = getUserIdFromToken(extractToken(request))
    if (!userId) {
      return HttpResponse.json({ message: 'Não autorizado.' }, { status: 401 })
    }

    const body = (await request.json()) as {
      name?: string
      address?: string
      network?: Wallet['network']
      isPrimary?: boolean
    }

    if (!body.name || !body.address || !body.network) {
      return HttpResponse.json(
        { message: 'Nome, endereço e rede são obrigatórios.' },
        { status: 400 }
      )
    }

    // Basic Ethereum address validation regex (0x...)
    if (!/^0x[a-fA-F0-9]{40}$/.test(body.address)) {
      return HttpResponse.json(
        { message: 'Endereço de carteira inválido. Deve começar com 0x e conter 42 caracteres.' },
        { status: 400 }
      )
    }

    const newWallet: Wallet = {
      id: `w-${Date.now()}`,
      userId,
      name: body.name,
      address: body.address,
      network: body.network,
      isPrimary: body.isPrimary ?? false,
      createdAt: new Date().toISOString(),
    }

    mockDb.addWallet(newWallet)
    return HttpResponse.json(newWallet, { status: 201 })
  }),

  // Update Wallet
  http.put('/api/wallets/:id', async ({ params, request }) => {
    const scenario = mockDb.getScenario()
    await delay(scenario.latencyMs)

    const userId = getUserIdFromToken(extractToken(request))
    if (!userId) {
      return HttpResponse.json({ message: 'Não autorizado.' }, { status: 401 })
    }

    const id = params.id as string
    const updates = (await request.json()) as Partial<Wallet>

    const updated = mockDb.updateWallet(id, updates)
    if (!updated) {
      return HttpResponse.json({ message: 'Carteira não encontrada.' }, { status: 404 })
    }

    return HttpResponse.json(updated)
  }),
]
