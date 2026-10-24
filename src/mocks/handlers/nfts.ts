import { http, HttpResponse, delay } from 'msw'
import { mockDb } from '../db/store'
import BigNumber from 'bignumber.js'
import { extractToken, getUserIdFromToken } from './token'

export const nftHandlers = [
  // List NFTs with search, filters, sorting, and pagination
  http.get('/api/nfts', async ({ request }) => {
    const scenario = mockDb.getScenario()
    
    // Simulate variable latency or out-of-order jitter if requested
    const jitter = scenario.simulateOutOfOrder ? Math.random() * 800 : 0
    await delay(scenario.latencyMs + jitter)

    if (scenario.simulateNetworkError) {
      return HttpResponse.error()
    }

    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase().trim() || ''
    const category = url.searchParams.get('category')?.toLowerCase().trim() || ''
    const minPrice = url.searchParams.get('minPrice') || ''
    const maxPrice = url.searchParams.get('maxPrice') || ''
    const sortBy = url.searchParams.get('sortBy') || 'recent'
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') || '8', 10)

    const userId = getUserIdFromToken(extractToken(request))
    const userFavorites = userId ? mockDb.getFavorites(userId) : []

    let nfts = mockDb.getNfts().map(nft => ({
      ...nft,
      isFavorite: userFavorites.includes(nft.id),
    }))

    // Filter by search
    if (search) {
      nfts = nfts.filter(
        n =>
          n.title.toLowerCase().includes(search) ||
          n.description.toLowerCase().includes(search) ||
          n.creator.name.toLowerCase().includes(search)
      )
    }

    // Filter by category
    if (category && category !== 'all' && category !== 'todos') {
      nfts = nfts.filter(n => n.category.toLowerCase() === category)
    }

    // Filter by price range
    if (minPrice) {
      const minBn = new BigNumber(minPrice)
      if (!minBn.isNaN()) {
        nfts = nfts.filter(n => new BigNumber(n.priceEth).isGreaterThanOrEqualTo(minBn))
      }
    }
    if (maxPrice) {
      const maxBn = new BigNumber(maxPrice)
      if (!maxBn.isNaN()) {
        nfts = nfts.filter(n => new BigNumber(n.priceEth).isLessThanOrEqualTo(maxBn))
      }
    }

    // Sort
    switch (sortBy) {
      case 'price_asc':
        nfts.sort((a, b) => (new BigNumber(a.priceEth).comparedTo(new BigNumber(b.priceEth)) || 0))
        break
      case 'price_desc':
        nfts.sort((a, b) => (new BigNumber(b.priceEth).comparedTo(new BigNumber(a.priceEth)) || 0))
        break
      case 'popular':
        nfts.sort((a, b) => b.likesCount - a.likesCount)
        break
      case 'recent':
      default:
        nfts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
    }

    const total = nfts.length
    const totalPages = Math.ceil(total / pageSize) || 1
    const startIndex = (page - 1) * pageSize
    const paginatedItems = nfts.slice(startIndex, startIndex + pageSize)

    return HttpResponse.json({
      items: paginatedItems,
      total,
      page,
      pageSize,
      totalPages,
    })
  }),

  // Get Single NFT by ID
  http.get('/api/nfts/:id', async ({ params, request }) => {
    const scenario = mockDb.getScenario()
    await delay(scenario.latencyMs)

    if (scenario.simulateNetworkError) {
      return HttpResponse.error()
    }

    const id = params.id as string
    const nft = mockDb.getNftById(id)

    if (!nft) {
      return HttpResponse.json(
        { message: `NFT com ID '${id}' não encontrado.` },
        { status: 404 }
      )
    }

    const userId = getUserIdFromToken(extractToken(request))
    const isFavorite = userId ? mockDb.getFavorites(userId).includes(id) : false

    return HttpResponse.json({
      ...nft,
      isFavorite,
    })
  }),

  // Get User Favorites
  http.get('/api/favorites', async ({ request }) => {
    const scenario = mockDb.getScenario()
    await delay(scenario.latencyMs)

    const userId = getUserIdFromToken(extractToken(request))
    if (!userId) {
      return HttpResponse.json({ message: 'Autenticação necessária.' }, { status: 401 })
    }

    const favoriteIds = mockDb.getFavorites(userId)
    const items = mockDb.getNfts().filter(n => favoriteIds.includes(n.id)).map(n => ({
      ...n,
      isFavorite: true,
    }))

    return HttpResponse.json({ items })
  }),

  // Toggle Favorite (with failure simulation support for Optimistic Rollback test!)
  http.post('/api/favorites/:id', async ({ params, request }) => {
    const scenario = mockDb.getScenario()
    await delay(scenario.latencyMs)

    if (scenario.failNextRequest) {
      // One-time failure flag consumed
      mockDb.updateScenario({ failNextRequest: false })
      return HttpResponse.json(
        { message: 'Erro simulado no servidor ao favoritar NFT.' },
        { status: 500 }
      )
    }

    const userId = getUserIdFromToken(extractToken(request))
    if (!userId) {
      return HttpResponse.json({ message: 'Autenticação necessária.' }, { status: 401 })
    }

    const id = params.id as string
    const nft = mockDb.getNftById(id)
    if (!nft) {
      return HttpResponse.json({ message: 'NFT não encontrado.' }, { status: 404 })
    }

    const isFav = mockDb.toggleFavorite(userId, id)
    nft.likesCount += isFav ? 1 : -1

    return HttpResponse.json({
      nftId: id,
      isFavorite: isFav,
      likesCount: nft.likesCount,
    })
  }),
]
