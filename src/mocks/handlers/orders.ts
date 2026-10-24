import { http, HttpResponse, delay } from 'msw'
import { mockDb } from '../db/store'
import { addEth, subtractEth, multiplyEth, calculateDiscount } from '@/shared/utils/eth'
import { Order, OrderItem, CreateOrderPayload } from '@/shared/types'
import { socketServer } from '../socket/server'
import { extractToken, getUserIdFromToken } from './token'

export const orderHandlers = [
  // Create Order (with Idempotency-Key support)
  http.post('/api/orders', async ({ request }) => {
    const scenario = mockDb.getScenario()
    await delay(scenario.latencyMs)

    if (scenario.simulateNetworkError) {
      return HttpResponse.error()
    }

    const userId = getUserIdFromToken(extractToken(request))
    if (!userId) {
      return HttpResponse.json({ message: 'Autenticação necessária para finalizar a compra.' }, { status: 401 })
    }

    const idempotencyKey = request.headers.get('Idempotency-Key')
    if (!idempotencyKey) {
      return HttpResponse.json(
        { message: 'Cabeçalho Idempotency-Key é obrigatório.' },
        { status: 400 }
      )
    }

    const payload = (await request.json()) as CreateOrderPayload

    // Check existing order by idempotency key
    const existingOrder = mockDb.getOrderByKey(idempotencyKey)
    if (existingOrder) {
      // Check if payload matches the existing order
      const existingItemsKey = existingOrder.items
        .map(i => `${i.nftId}-${i.editionId}-${i.quantity}`)
        .sort()
        .join(',')
      const payloadItemsKey = (payload.items || [])
        .map(i => `${i.nftId}-${i.editionId}-${i.quantity}`)
        .sort()
        .join(',')

      if (existingItemsKey === payloadItemsKey && existingOrder.walletAddress === payload.walletAddress) {
        // Return existing order without creating duplicate!
        return HttpResponse.json(existingOrder, { status: 200 })
      } else {
        // Idempotency key reused with different payload -> 409 Conflict
        return HttpResponse.json(
          {
            message: 'Conflito de idempotência: a mesma chave foi utilizada com parâmetros de pedido diferentes.',
          },
          { status: 409 }
        )
      }
    }

    // Check payment failure scenario
    if (scenario.simulatePaymentFailure) {
      return HttpResponse.json(
        {
          message: 'Transação recusada pela rede blockchain ou saldo insuficiente na carteira.',
          code: 'PAYMENT_REJECTED',
        },
        { status: 402 }
      )
    }

    // Revalidate items, stock, prices
    const orderItems: OrderItem[] = []
    let subtotalEth = '0'

    for (const item of payload.items || []) {
      const nft = mockDb.getNftById(item.nftId)
      if (!nft) {
        return HttpResponse.json(
          { message: `NFT com ID ${item.nftId} não está mais disponível.` },
          { status: 409 }
        )
      }

      const edition = nft.editions.find(e => e.id === item.editionId)
      if (!edition) {
        return HttpResponse.json(
          { message: `A edição selecionada para '${nft.title}' não está mais disponível.` },
          { status: 409 }
        )
      }

      if (edition.availableQuantity < item.quantity) {
        return HttpResponse.json(
          {
            message: `A quantidade de '${nft.title}' no estoque mudou para ${edition.availableQuantity}. Atualize seu carrinho.`,
          },
          { status: 409 }
        )
      }

      const itemTotal = multiplyEth(edition.priceEth, item.quantity)
      subtotalEth = addEth(subtotalEth, itemTotal)

      orderItems.push({
        nftId: nft.id,
        editionId: edition.id,
        title: nft.title,
        imageUrl: nft.imageUrl,
        editionName: edition.name,
        priceEth: edition.priceEth,
        quantity: item.quantity,
      })
    }

    // Discount
    let discountEth = '0'
    if (payload.couponCode) {
      const coupon = mockDb.getCoupon(payload.couponCode)
      if (coupon && new Date(coupon.expiresAt).getTime() >= Date.now()) {
        discountEth = calculateDiscount(subtotalEth, coupon.discountPercentage)
      }
    }

    const networkFeeEth = '0.016'
    const totalEth = addEth(subtractEth(subtotalEth, discountEth), networkFeeEth)

    // Generate simulated transaction hash
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')

    // Create Order with pending status initially, then confirm via real-time simulation
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      userId,
      idempotencyKey,
      items: orderItems,
      subtotalEth,
      discountEth,
      networkFeeEth,
      totalEth,
      walletAddress: payload.walletAddress,
      network: payload.network || 'Ethereum',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    mockDb.createOrder(newOrder)

    // Decrease available quantities in stock
    for (const item of payload.items) {
      const nft = mockDb.getNftById(item.nftId)
      const edition = nft?.editions.find(e => e.id === item.editionId)
      if (edition) {
        edition.availableQuantity = Math.max(0, edition.availableQuantity - item.quantity)
      }
    }

    // Asynchronously simulate blockchain confirmation via Socket.IO
    setTimeout(() => {
      const updated = mockDb.updateOrderStatus(newOrder.id, 'confirmed', txHash)
      if (updated) {
        socketServer.emitOrderUpdated({
          orderId: newOrder.id,
          status: 'confirmed',
          transactionHash: txHash,
        })
      }
    }, 1200)

    return HttpResponse.json(newOrder, { status: 201 })
  }),

  // Get Single Order (immutable snapshot receipt)
  http.get('/api/orders/:id', async ({ params, request }) => {
    const scenario = mockDb.getScenario()
    await delay(scenario.latencyMs)

    const userId = getUserIdFromToken(extractToken(request))
    if (!userId) {
      return HttpResponse.json({ message: 'Não autorizado.' }, { status: 401 })
    }

    const order = mockDb.getOrderById(params.id as string)
    if (!order) {
      return HttpResponse.json({ message: 'Pedido não encontrado.' }, { status: 404 })
    }

    if (order.userId !== userId) {
      return HttpResponse.json({ message: 'Acesso negado a este pedido.' }, { status: 403 })
    }

    return HttpResponse.json(order)
  }),

  // List Orders for Authenticated User
  http.get('/api/orders', async ({ request }) => {
    const scenario = mockDb.getScenario()
    await delay(scenario.latencyMs)

    const userId = getUserIdFromToken(extractToken(request))
    if (!userId) {
      return HttpResponse.json({ message: 'Não autorizado.' }, { status: 401 })
    }

    const orders = mockDb.getOrders(userId)
    return HttpResponse.json({ items: orders })
  }),
]
