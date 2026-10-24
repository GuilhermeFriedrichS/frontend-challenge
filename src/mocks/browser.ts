import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...(handlers as any))

export async function enableMocking() {
  // Always enable mocks in development and production demo unless explicitly turned off
  const shouldEnable =
    import.meta.env.DEV ||
    import.meta.env.VITE_ENABLE_MOCKS !== 'false'

  if (!shouldEnable) {
    return
  }

  return worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  })
}
