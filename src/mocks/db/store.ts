import { NFT, Wallet, Coupon, Order, CartItem } from '@/shared/types'
import { INITIAL_USERS, INITIAL_WALLETS, INITIAL_COUPONS, INITIAL_NFTS, MockUser } from './fixtures'

const STORAGE_KEY = 'KURIO_MOCK_DB_V3'
const SCENARIO_KEY = 'KURIO_SCENARIO_SETTINGS'

export interface ScenarioConfig {
  latencyMs: number
  simulateNetworkError: boolean
  simulateSessionExpired: boolean
  simulatePaymentFailure: boolean
  simulateOutOfOrder: boolean
  failNextRequest: boolean
}

const DEFAULT_SCENARIO: ScenarioConfig = {
  latencyMs: 80,
  simulateNetworkError: false,
  simulateSessionExpired: false,
  simulatePaymentFailure: false,
  simulateOutOfOrder: false,
  failNextRequest: false,
}

export interface MockDbState {
  users: MockUser[]
  wallets: Wallet[]
  coupons: Coupon[]
  nfts: NFT[]
  favorites: Record<string, string[]> // userId -> nftId[]
  orders: Order[]
  carts: Record<string, CartItem[]> // userId or 'guest' -> CartItem[]
  eventVersion: number
}

class MockDatabase {
  private state: MockDbState
  private scenario: ScenarioConfig
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.state = this.loadState()
    this.scenario = this.loadScenario()
  }

  private loadState(): MockDbState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && Array.isArray(parsed.nfts) && parsed.nfts.length < INITIAL_NFTS.length) {
          parsed.nfts = [...INITIAL_NFTS]
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
          } catch {
            // Ignore
          }
        }
        return parsed
      }
    } catch {
      // LocalStorage not available or parse error
    }
    return this.getInitialState()
  }

  private loadScenario(): ScenarioConfig {
    try {
      const stored = localStorage.getItem(SCENARIO_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {
      // Ignore
    }
    return { ...DEFAULT_SCENARIO }
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
      this.listeners.forEach(cb => cb())
    } catch {
      // Ignore
    }
  }

  private saveScenario() {
    try {
      localStorage.setItem(SCENARIO_KEY, JSON.stringify(this.scenario))
      this.listeners.forEach(cb => cb())
    } catch {
      // Ignore
    }
  }

  public getInitialState(): MockDbState {
    return {
      users: [...INITIAL_USERS],
      wallets: [...INITIAL_WALLETS],
      coupons: [...INITIAL_COUPONS],
      nfts: [...INITIAL_NFTS],
      favorites: {
        'user-alex': ['nft-042', 'nft-552'],
        'user-elena': ['nft-118'],
      },
      orders: [],
      carts: {
        guest: [],
      },
      eventVersion: 1,
    }
  }

  public reset() {
    this.state = this.getInitialState()
    this.scenario = { ...DEFAULT_SCENARIO }
    this.saveState()
    this.saveScenario()
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  // --- Scenario Controls ---
  public getScenario(): ScenarioConfig {
    return { ...this.scenario }
  }

  public updateScenario(partial: Partial<ScenarioConfig>) {
    this.scenario = { ...this.scenario, ...partial }
    this.saveScenario()
  }

  // --- Users & Auth ---
  public getUsers() {
    return this.state.users
  }

  public findUserByEmail(email: string) {
    return this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase())
  }

  public findUserById(id: string) {
    return this.state.users.find(u => u.id === id)
  }

  public createUser(user: MockUser) {
    this.state.users.push(user)
    this.state.favorites[user.id] = []
    this.state.carts[user.id] = []
    this.saveState()
    return user
  }

  public updateUser(userId: string, updates: Partial<MockUser>) {
    const idx = this.state.users.findIndex(u => u.id === userId)
    if (idx !== -1) {
      this.state.users[idx] = { ...this.state.users[idx], ...updates }
      this.saveState()
      return this.state.users[idx]
    }
    return null
  }

  // --- NFTs ---
  public getNfts() {
    return this.state.nfts
  }

  public getNftById(id: string) {
    return this.state.nfts.find(n => n.id === id)
  }

  public updateNftPrice(nftId: string, newPriceEth: string) {
    const nft = this.state.nfts.find(n => n.id === nftId)
    if (nft) {
      nft.priceEth = newPriceEth
      if (nft.editions && Array.isArray(nft.editions)) {
        nft.editions.forEach(ed => {
          ed.priceEth = newPriceEth
        })
      }
      this.state.eventVersion += 1
      this.saveState()
      return { nft, version: this.state.eventVersion }
    }
    return null
  }

  // --- Favorites ---
  public getFavorites(userId: string): string[] {
    return this.state.favorites[userId] || []
  }

  public toggleFavorite(userId: string, nftId: string): boolean {
    if (!this.state.favorites[userId]) {
      this.state.favorites[userId] = []
    }
    const list = this.state.favorites[userId]
    const idx = list.indexOf(nftId)
    let isFav = false
    if (idx !== -1) {
      list.splice(idx, 1)
      isFav = false
    } else {
      list.push(nftId)
      isFav = true
    }
    this.saveState()
    return isFav
  }

  // --- Wallets ---
  public getWallets(userId: string): Wallet[] {
    return this.state.wallets.filter(w => w.userId === userId)
  }

  public addWallet(wallet: Wallet) {
    if (wallet.isPrimary) {
      // Set others to false
      this.state.wallets.forEach(w => {
        if (w.userId === wallet.userId) w.isPrimary = false
      })
    }
    this.state.wallets.push(wallet)
    this.saveState()
    return wallet
  }

  public updateWallet(walletId: string, updates: Partial<Wallet>) {
    const idx = this.state.wallets.findIndex(w => w.id === walletId)
    if (idx !== -1) {
      if (updates.isPrimary) {
        const userId = this.state.wallets[idx].userId
        this.state.wallets.forEach(w => {
          if (w.userId === userId) w.isPrimary = false
        })
      }
      this.state.wallets[idx] = { ...this.state.wallets[idx], ...updates }
      this.saveState()
      return this.state.wallets[idx]
    }
    return null
  }

  // --- Coupons ---
  public getCoupon(code: string): Coupon | undefined {
    return this.state.coupons.find(c => c.code.toUpperCase() === code.toUpperCase().trim())
  }

  // --- Orders & Idempotency ---
  public getOrders(userId?: string): Order[] {
    if (!userId) return this.state.orders
    return this.state.orders.filter(o => o.userId === userId)
  }

  public getOrderById(id: string): Order | undefined {
    return this.state.orders.find(o => o.id === id)
  }

  public getOrderByKey(idempotencyKey: string): Order | undefined {
    return this.state.orders.find(o => o.idempotencyKey === idempotencyKey)
  }

  public createOrder(order: Order): Order {
    this.state.orders.push(order)
    this.state.eventVersion += 1
    this.saveState()
    return order
  }

  public updateOrderStatus(orderId: string, status: Order['status'], txHash?: string, reason?: string) {
    const order = this.state.orders.find(o => o.id === orderId)
    if (order) {
      order.status = status
      if (txHash) order.transactionHash = txHash
      if (reason) order.rejectionReason = reason
      this.state.eventVersion += 1
      this.saveState()
      return { order, version: this.state.eventVersion }
    }
    return null
  }

  // --- Cart ---
  public getCart(sessionKey: string): CartItem[] {
    return this.state.carts[sessionKey] || []
  }

  public saveCart(sessionKey: string, items: CartItem[]) {
    this.state.carts[sessionKey] = items
    this.saveState()
  }

  public getEventVersion(): number {
    return this.state.eventVersion
  }
}

export const mockDb = new MockDatabase()
