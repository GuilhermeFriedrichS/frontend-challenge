import { authHandlers } from './auth'
import { nftHandlers } from './nfts'
import { cartHandlers } from './cart'
import { orderHandlers } from './orders'
import { walletHandlers } from './wallets'
import { socketLink } from '../socket/server'

export const handlers = [
  socketLink,
  ...authHandlers,
  ...nftHandlers,
  ...cartHandlers,
  ...orderHandlers,
  ...walletHandlers,
]
