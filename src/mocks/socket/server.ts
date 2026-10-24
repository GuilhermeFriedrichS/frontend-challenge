import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { NFTUpdatedPayload, OrderUpdatedPayload, RealtimeEvent } from '@/shared/types'
import { mockDb } from '../db/store'

// Intercept WebSocket connections to the mock Socket.IO server
export const socketLink = ws.link(/.*\/socket\.io\/.*/)

// Keep track of connected clients
const connectedClients = new Set<any>()

socketLink.addEventListener('connection', connection => {
  const { client } = toSocketIo(connection)
  connectedClients.add(client)

  // Handshake acknowledgment
  client.emit('connection:ack', {
    message: 'Conectado ao servidor Socket.IO simulado Kurio.',
    serverTime: new Date().toISOString(),
  })

  // Cleanup on close
  connection.client.addEventListener('close', () => {
    connectedClients.delete(client)
  })
})

export const socketServer = {
  emitNftUpdated(payload: NFTUpdatedPayload) {
    const version = mockDb.getEventVersion()
    const event: RealtimeEvent<NFTUpdatedPayload> = {
      type: 'nft.updated',
      resourceId: payload.nftId,
      version,
      timestamp: new Date().toISOString(),
      payload,
    }

    connectedClients.forEach(client => {
      try {
        client.emit('nft.updated', event)
      } catch (err) {
        console.warn('Falha ao emitir nft.updated para cliente:', err)
      }
    })

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kurio:nft.updated', { detail: event }))
    }
  },

  emitOrderUpdated(payload: OrderUpdatedPayload) {
    const version = mockDb.getEventVersion()
    const event: RealtimeEvent<OrderUpdatedPayload> = {
      type: 'order.updated',
      resourceId: payload.orderId,
      version,
      timestamp: new Date().toISOString(),
      payload,
    }

    connectedClients.forEach(client => {
      try {
        client.emit('order.updated', event)
      } catch (err) {
        console.warn('Falha ao emitir order.updated para cliente:', err)
      }
    })

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kurio:order.updated', { detail: event }))
    }
  },

  getConnectedCount() {
    return connectedClients.size
  },
}
