// Domain models and API contracts

export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string
  createdAt: string
}

export interface SessionInfo {
  token: string
  user: User
  expiresAt: string
}

export interface Edition {
  id: string
  name: string // e.g. "Edição Padrão", "Edição Limitada Holográfica"
  priceEth: string // Decimal string (e.g. "0.045")
  totalQuantity: number
  availableQuantity: number
}

export interface NFT {
  id: string
  title: string
  description: string
  imageUrl: string
  creator: {
    name: string
    avatarUrl: string
    address: string
  }
  category: 'art' | 'collectibles' | 'gaming' | 'photography' | 'music'
  priceEth: string // Decimal string
  editions: Edition[]
  selectedEditionId?: string
  isFavorite?: boolean
  likesCount: number
  createdAt: string
  attributes?: Array<{
    trait_type: string
    value: string
  }>
  history?: Array<{
    event: 'minted' | 'listed' | 'sold'
    priceEth?: string
    from: string
    to?: string
    date: string
  }>
}

export interface NFTFilterParams {
  search?: string
  category?: string
  minPrice?: string
  maxPrice?: string
  sortBy?: 'recent' | 'price_asc' | 'price_desc' | 'popular'
  page?: number
  pageSize?: number
}

export interface NFTListResponse {
  items: NFT[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CartItem {
  nftId: string
  editionId: string
  title: string
  imageUrl: string
  editionName: string
  priceEth: string
  quantity: number
  maxAvailable: number
}

export interface Coupon {
  code: string
  discountPercentage: number
  expiresAt: string
  description: string
}

export interface CartQuote {
  subtotalEth: string
  discountEth: string
  appliedCoupon?: Coupon
  networkFeeEth: string
  totalEth: string
  isValid: boolean
  validationErrors?: string[]
}

export type OrderStatus = 'pending' | 'confirmed' | 'rejected'

export interface OrderItem {
  nftId: string
  editionId: string
  title: string
  imageUrl: string
  editionName: string
  priceEth: string
  quantity: number
}

export interface Order {
  id: string
  userId: string
  idempotencyKey: string
  items: OrderItem[]
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  walletAddress: string
  network: string
  status: OrderStatus
  transactionHash?: string
  rejectionReason?: string
  createdAt: string
  confirmedAt?: string
}

export interface CreateOrderPayload {
  idempotencyKey: string
  items: Array<{
    nftId: string
    editionId: string
    quantity: number
  }>
  couponCode?: string
  walletAddress: string
  network: string
}

export interface Wallet {
  id: string
  userId: string
  name: string
  address: string
  isPrimary: boolean
  network: 'Ethereum' | 'Polygon' | 'Arbitrum' | 'Optimism'
  createdAt: string
}

// Real-time Socket.IO Event Contracts
export interface RealtimeEvent<T = unknown> {
  type: string
  resourceId: string
  version: number
  timestamp: string
  payload: T
}

export interface NFTUpdatedPayload {
  nftId: string
  newPriceEth?: string
  editions?: Array<{
    editionId: string
    availableQuantity: number
    priceEth: string
  }>
}

export interface OrderUpdatedPayload {
  orderId: string
  status: OrderStatus
  transactionHash?: string
  rejectionReason?: string
}
