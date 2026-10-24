import { io, Socket } from 'socket.io-client'
import { RealtimeEvent, NFTUpdatedPayload, OrderUpdatedPayload } from '@/shared/types'

let socketInstance: Socket | null = null

// Track latest observed resource versions to ignore stale or duplicate events
const observedVersions: Map<string, number> = new Map()

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      path: '/socket.io/',
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    })

    socketInstance.on('connect', () => {
      console.log('⚡ [Socket.IO] Conectado ao servidor de eventos em tempo real.')
      // Notify application to reconcile active resources with REST APIs
      window.dispatchEvent(new CustomEvent('kurio:socket-reconnected'))
    })

    socketInstance.on('disconnect', reason => {
      console.warn('⚠️ [Socket.IO] Desconectado:', reason)
    })
  }

  return socketInstance
}

/**
 * Checks if incoming event is newer than the last seen version for this resource
 */
export function isEventNewer(event: RealtimeEvent): boolean {
  const currentVersion = observedVersions.get(event.resourceId) || 0
  if (event.version <= currentVersion) {
    console.warn(`[Socket.IO] Evento obsoleto descartado para recurso ${event.resourceId} (v${event.version} <= v${currentVersion})`)
    return false
  }
  observedVersions.set(event.resourceId, event.version)
  return true
}

/**
 * Clears recorded event versions (e.g. on user logout / session reset)
 */
export function clearObservedVersions() {
  observedVersions.clear()
}

/**
 * Type-safe helper to listen to nft.updated events
 */
export function subscribeToNftUpdates(callback: (payload: NFTUpdatedPayload) => void) {
  const socket = getSocket()

  const handler = (event: RealtimeEvent<NFTUpdatedPayload>) => {
    if (isEventNewer(event)) {
      callback(event.payload)
    }
  }

  socket.on('nft.updated', handler)

  const windowHandler = (customEvent: Event) => {
    const detail = (customEvent as CustomEvent<RealtimeEvent<NFTUpdatedPayload>>).detail
    if (detail && detail.type === 'nft.updated') {
      if (isEventNewer(detail)) {
        callback(detail.payload)
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('kurio:nft.updated', windowHandler)
  }

  return () => {
    socket.off('nft.updated', handler)
    if (typeof window !== 'undefined') {
      window.removeEventListener('kurio:nft.updated', windowHandler)
    }
  }
}

/**
 * Type-safe helper to listen to order.updated events
 */
export function subscribeToOrderUpdates(callback: (payload: OrderUpdatedPayload) => void) {
  const socket = getSocket()

  const handler = (event: RealtimeEvent<OrderUpdatedPayload>) => {
    if (isEventNewer(event)) {
      callback(event.payload)
    }
  }

  socket.on('order.updated', handler)

  const windowHandler = (customEvent: Event) => {
    const detail = (customEvent as CustomEvent<RealtimeEvent<OrderUpdatedPayload>>).detail
    if (detail && detail.type === 'order.updated') {
      if (isEventNewer(detail)) {
        callback(detail.payload)
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('kurio:order.updated', windowHandler)
  }

  return () => {
    socket.off('order.updated', handler)
    if (typeof window !== 'undefined') {
      window.removeEventListener('kurio:order.updated', windowHandler)
    }
  }
}
