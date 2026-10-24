import React, { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { HeroBanner } from '@/features/catalog/components/HeroBanner'
import { FilterSidebar } from '@/features/catalog/components/FilterSidebar'
import { NftCard } from '@/features/catalog/components/NftCard'
import { NftCardSkeleton } from '@/features/catalog/components/NftCardSkeleton'
import { useNfts } from '@/features/catalog/api/useNfts'
import { AlertCircle, ChevronDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

const catalogSearchSchema = z.object({
  search: z.string().optional().catch(''),
  category: z.string().optional().catch(''),
  minPrice: z.string().optional().catch(''),
  maxPrice: z.string().optional().catch(''),
  sortBy: z.enum(['recent', 'price_asc', 'price_desc', 'popular']).optional().catch('recent'),
  page: z.number().int().min(1).optional().catch(1),
})

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => catalogSearchSchema.parse(search),
  component: HomePage,
})

function HomePage() {
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'trending'>('all')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSent, setNewsletterSent] = useState(false)
  const [mobileSearch, setMobileSearch] = useState('')

  const {
    search = '',
    category = '',
    minPrice = '',
    maxPrice = '',
    sortBy = 'recent',
    page = 1,
  } = searchParams

  const { data, isLoading, isError, error, refetch } = useNfts({
    search,
    category,
    minPrice,
    maxPrice,
    sortBy,
    page,
    pageSize: 6,
  })

  // URL state update helper
  const updateSearch = (updates: Partial<typeof searchParams>, resetPage = false) => {
    navigate({
      search: prev => ({
        ...prev,
        ...updates,
        page: resetPage ? 1 : (updates.page ?? prev.page),
      }),
      resetScroll: false,
    })
  }

  const handleTabChange = (tab: 'all' | 'new' | 'trending') => {
    setActiveTab(tab)
    if (tab === 'new') {
      updateSearch({ sortBy: 'recent' }, true)
    } else if (tab === 'trending') {
      updateSearch({ sortBy: 'popular' }, true)
    } else {
      updateSearch({ sortBy: 'recent' }, true)
    }
  }

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newsletterEmail) {
      setNewsletterSent(true)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-16 pb-20 font-mono">
      {/* Mobile Top Bar matching Figma Mobile/Início.png */}
      <div className="md:hidden px-4 pt-2 pb-0 flex items-center gap-3">
        <form
          onSubmit={e => {
            e.preventDefault()
            updateSearch({ search: mobileSearch }, true)
          }}
          className="flex-1 relative"
        >
          <Search className="w-4 h-4 text-[#8C7760] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={mobileSearch}
            onChange={e => setMobileSearch(e.target.value)}
            placeholder="Explorar coleções"
            className="w-full h-11 pl-10 pr-4 bg-[#241612] border border-[#3D251C] rounded-2xl text-xs text-[#F5F1EB] placeholder-[#8C7760] focus:outline-none focus:border-[#D28A4C]"
          />
        </form>
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('catalogo')
            el?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="w-11 h-11 rounded-2xl bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] flex items-center justify-center shrink-0 shadow-md transition-colors"
          aria-label="Filtrar catálogo"
          title="Filtros"
        >
          <SlidersHorizontal className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* 1. Hero Section */}
      <HeroBanner />

      {/* 2. Catalog Section (#catalogo) */}
      <section id="catalogo" className="container mx-auto px-4 sm:px-6 scroll-mt-24">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Sidebar (Coleções, Faixa de Preço, Rede, NFT em Destaque) */}
          <FilterSidebar
            category={category}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onCategoryChange={cat => updateSearch({ category: cat }, true)}
            onPriceChange={(min, max) => updateSearch({ minPrice: min, maxPrice: max }, true)}
            onClear={() =>
              updateSearch(
                { search: '', category: '', minPrice: '', maxPrice: '', sortBy: 'recent' },
                true
              )
            }
          />

          {/* Right Main Grid Area */}
          <div className="flex-1 space-y-8">
            {/* Top Control Bar: Tabs & Sort Dropdown matching Figma */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4  pb-3">
              {/* Tabs */}
              <div className="flex items-center gap-6 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => handleTabChange('all')}
                  className={`pb-3 transition-colors relative ${activeTab === 'all'
                      ? 'text-[#D28A4C] font-bold'
                      : 'text-[#CFB28C] hover:text-[#F5F1EB]'
                    }`}
                >
                  Todos os NFTs
                  {activeTab === 'all' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D28A4C]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('new')}
                  className={`pb-3 transition-colors relative ${activeTab === 'new'
                      ? 'text-[#D28A4C] font-bold'
                      : 'text-[#CFB28C] hover:text-[#F5F1EB]'
                    }`}
                >
                  Novos lançamentos
                  {activeTab === 'new' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D28A4C]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('trending')}
                  className={`pb-3 transition-colors relative ${activeTab === 'trending'
                      ? 'text-[#D28A4C] font-bold'
                      : 'text-[#CFB28C] hover:text-[#F5F1EB]'
                    }`}
                >
                  Em alta
                  {activeTab === 'trending' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D28A4C]" />
                  )}
                </button>
              </div>

              {/* Sort Dropdown on the right */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#8C7760] font-medium hidden sm:inline">Ordenar por:</span>
                <div className="relative inline-flex items-center">
                  <select
                    value={sortBy}
                    onChange={e => updateSearch({ sortBy: e.target.value as any }, true)}
                    className="appearance-none bg-[#241612] border border-[#3D251C] hover:border-[#D28A4C] text-[#F5F1EB] text-xs font-mono py-2 pl-3.5 pr-8 rounded-xl cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D28A4C] transition-all shadow-sm"
                    aria-label="Critério de ordenação"
                  >
                    <option value="recent" className="bg-[#1C1410] text-[#F5F1EB] py-1">Listados recentemente</option>
                    <option value="popular" className="bg-[#1C1410] text-[#F5F1EB] py-1">Mais populares</option>
                    <option value="price_asc" className="bg-[#1C1410] text-[#F5F1EB] py-1">Menor preço</option>
                    <option value="price_desc" className="bg-[#1C1410] text-[#F5F1EB] py-1">Maior preço</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#CFB28C] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Error State */}
            {isError && (
              <div
                role="alert"
                className="p-8 rounded-2xl border border-[#F0805F] bg-[#2A1410] text-center space-y-3"
              >
                <AlertCircle className="w-8 h-8 text-[#F0805F] mx-auto" />
                <h3 className="text-base font-bold text-white">Falha ao carregar catálogo</h3>
                <p className="text-xs text-[#CFB28C] max-w-md mx-auto">
                  {(error as any)?.response?.data?.message ||
                    'Não foi possível obter a lista de NFTs. Verifique sua conexão e tente novamente.'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="mt-2 text-xs border-[#F0805F] text-[#F0805F]"
                >
                  Tentar novamente
                </Button>
              </div>
            )}

            {/* Loading Skeletons */}
            {isLoading && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
                {Array.from({ length: 9 }).map((_, i) => (
                  <NftCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && data?.items.length === 0 && (
              <div className="py-16 text-center space-y-4 rounded-2xl border border-[#3D251C] bg-[#1C1410]">
                <div className="w-12 h-12 rounded-full bg-[#241612] text-[#8C7760] flex items-center justify-center mx-auto text-xl font-bold">
                  Ø
                </div>
                <h3 className="text-lg font-bold text-white">Nenhum NFT encontrado</h3>
                <p className="text-xs text-[#CFB28C] max-w-sm mx-auto">
                  Tente ajustar ou limpar seus filtros de busca e faixa de preço.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    updateSearch(
                      { search: '', category: '', minPrice: '', maxPrice: '' },
                      true
                    )
                  }
                  className="bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase px-4 py-2"
                >
                  Limpar todos os filtros
                </button>
              </div>
            )}

            {/* Loaded 3-Columns Grid matching Figma */}
            {!isLoading && !isError && data && data.items.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
                {data.items.map(nft => (
                  <NftCard key={nft.id} nft={nft} />
                ))}
              </div>
            )}

            {/* Pagination matching Figma: [1] 2 3 4 > */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center sm:justify-end gap-2 pt-8">
                {page > 1 && (
                  <button
                    onClick={() => updateSearch({ page: page - 1 })}
                    className="w-8 h-8 rounded-lg sm:rounded-none bg-[#241612] border border-[#3D251C]/60 text-[#CFB28C] hover:text-white flex items-center justify-center text-xs transition-colors"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {Array.from({ length: data.totalPages }).map((_, i) => {
                  const pageNum = i + 1
                  const isActive = pageNum === page
                  return (
                    <button
                      key={pageNum}
                      onClick={() => updateSearch({ page: pageNum })}
                      className={`w-8 h-8 rounded-lg sm:rounded-none text-xs font-bold flex items-center justify-center transition-colors ${isActive
                          ? 'bg-[#D28A4C] text-[#140D0A]'
                          : 'bg-[#241612] border border-[#3D251C]/60 text-[#CFB28C] hover:text-white hover:border-[#D28A4C]'
                        }`}
                      aria-label={`Página ${pageNum}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                {page < data.totalPages && (
                  <button
                    onClick={() => updateSearch({ page: page + 1 })}
                    className="w-8 h-8 rounded-lg sm:rounded-none bg-[#241612] border border-[#3D251C]/60 text-[#CFB28C] hover:text-white flex items-center justify-center text-xs transition-colors"
                    aria-label="Próxima página"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Promotional Banners (Lançamentos gênesis & Arte digital selecionada) matching Figma */}
      <section className="container mx-auto px-4 sm:px-6 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Banner 1 */}
          <div className="rounded-2xl bg-[#241612] border border-[#3D251C]/40 p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-full sm:w-48 aspect-square rounded-2xl overflow-hidden flex-shrink-0 bg-[#1C120E]">
              <img
                src="/assets/nfts/nft-2.jpg"
                alt="Lançamentos gênesis de edição limitada"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-4 text-left">
              <h3 className="text-base sm:text-lg font-bold uppercase text-[#F5F1EB] leading-snug">
                Lançamentos gênesis<br />de edição limitada
              </h3>
              <p className="text-xs text-[#CFB28C] leading-relaxed">
                Colecione edições escassas diretamente dos criadores antes da revelação pública.
              </p>
              <a
                href="#catalogo"
                className="inline-flex items-center gap-2 bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase px-5 py-2.5 transition-colors"
              >
                Explorar &rarr;
              </a>
            </div>
          </div>

          {/* Banner 2 */}
          <div className="rounded-2xl bg-[#241612] border border-[#3D251C]/40 p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-full sm:w-48 aspect-square rounded-2xl overflow-hidden flex-shrink-0 bg-[#1C120E]">
              <img
                src="/assets/nfts/nft-4.jpg"
                alt="Arte digital selecionada e muito mais"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-4 text-left">
              <h3 className="text-base sm:text-lg font-bold uppercase text-[#F5F1EB] leading-snug">
                Arte digital selecionada<br />e muito mais
              </h3>
              <p className="text-xs text-[#CFB28C] leading-relaxed">
                Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.
              </p>
              <a
                href="#catalogo"
                className="inline-flex items-center gap-2 bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase px-5 py-2.5 transition-colors"
              >
                Explorar &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Editorial Stories Section: "Diário da Cunhagem" matching Figma */}
      <section className="container mx-auto px-4 sm:px-6 pt-12">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase text-[#F5F1EB]">
            Diário da Cunhagem
          </h2>
          <p className="text-xs sm:text-sm text-[#CFB28C] max-w-xl mx-auto">
            Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Article 1 */}
          <div className="rounded-2xl bg-[#241612] border border-[#3D251C]/40 p-4 space-y-3">
            <div className="aspect-square rounded-xl overflow-hidden bg-[#1C120E]">
              <img
                src="/assets/nfts/nft-4.jpg"
                alt="Como funciona a propriedade de NFTs"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-[11px] text-[#8C7760]">12 de setembro | Leitura de 6 min</div>
            <h3 className="text-sm font-bold text-[#F5F1EB] leading-snug">
              Como funciona a propriedade de NFTs
            </h3>
            <p className="text-xs text-[#CFB28C] leading-relaxed">
              Aprenda a colecionar, negociar e verificar ativos digitais.
            </p>
            <a href="#artigo-1" className="inline-block text-xs text-[#D28A4C] hover:underline pt-1">
              Ler mais &rarr;
            </a>
          </div>

          {/* Article 2 */}
          <div className="rounded-2xl bg-[#241612] border border-[#3D251C]/40 p-4 space-y-3">
            <div className="aspect-square rounded-xl overflow-hidden bg-[#1C120E]">
              <img
                src="/assets/nfts/nft-2.jpg"
                alt="10 artistas digitais para acompanhar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-[11px] text-[#8C7760]">13 de setembro | Leitura de 2 min</div>
            <h3 className="text-sm font-bold text-[#F5F1EB] leading-snug">
              10 artistas digitais para acompanhar
            </h3>
            <p className="text-xs text-[#CFB28C] leading-relaxed">
              Conheça criadores que moldam a cultura digital.
            </p>
            <a href="#artigo-2" className="inline-block text-xs text-[#D28A4C] hover:underline pt-1">
              Ler mais &rarr;
            </a>
          </div>

          {/* Article 3 */}
          <div className="rounded-2xl bg-[#241612] border border-[#3D251C]/40 p-4 space-y-3">
            <div className="aspect-square rounded-xl overflow-hidden bg-[#1C120E]">
              <img
                src="/assets/nfts/nft-1.jpg"
                alt="Raridade, atributos e procedência"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-[11px] text-[#8C7760]">15 de setembro | Leitura de 3 min</div>
            <h3 className="text-sm font-bold text-[#F5F1EB] leading-snug">
              Raridade, atributos e procedência
            </h3>
            <p className="text-xs text-[#CFB28C] leading-relaxed">
              Entenda raridade, procedência, direitos autorais e utilidade.
            </p>
            <a href="#artigo-3" className="inline-block text-xs text-[#D28A4C] hover:underline pt-1">
              Ler mais &rarr;
            </a>
          </div>

          {/* Article 4 */}
          <div className="rounded-2xl bg-[#241612] border border-[#3D251C]/40 p-4 space-y-3">
            <div className="aspect-square rounded-xl overflow-hidden bg-[#1C120E]">
              <img
                src="/assets/nfts/nft-3.jpg"
                alt="Como proteger sua carteira"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-[11px] text-[#8C7760]">15 de setembro | Leitura de 2 min</div>
            <h3 className="text-sm font-bold text-[#F5F1EB] leading-snug">
              Como proteger sua carteira
            </h3>
            <p className="text-xs text-[#CFB28C] leading-relaxed">
              Proteja sua carteira, seus ativos e sua identidade.
            </p>
            <a href="#artigo-4" className="inline-block text-xs text-[#D28A4C] hover:underline pt-1">
              Ler mais &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* 5. Value Props & Newsletter Section matching Figma */}
      <section className="container mx-auto px-4 sm:px-6 pt-12 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start border-t border-[#2F1D15] pt-12">
          {/* Benefit 1: W */}
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#D28A4C] text-[#140D0A] font-bold text-lg flex items-center justify-center">
              W
            </div>
            <h3 className="text-sm font-bold text-[#F5F1EB]">Segurança da carteira</h3>
            <p className="text-xs text-[#CFB28C] leading-relaxed">
              Proteja sua carteira e colecione arte digital verificada com confiança.
            </p>
          </div>

          {/* Benefit 2: C */}
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#D28A4C] text-[#140D0A] font-bold text-lg flex items-center justify-center">
              C
            </div>
            <h3 className="text-sm font-bold text-[#F5F1EB]">Criadores em destaque</h3>
            <p className="text-xs text-[#CFB28C] leading-relaxed">
              Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.
            </p>
          </div>

          {/* Benefit 3: D */}
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#D28A4C] text-[#140D0A] font-bold text-lg flex items-center justify-center">
              D
            </div>
            <h3 className="text-sm font-bold text-[#F5F1EB]">Alertas de lançamentos</h3>
            <p className="text-xs text-[#CFB28C] leading-relaxed">
              Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.
            </p>
          </div>

          {/* Newsletter Box */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#F5F1EB]">
              Antecipe-se ao próximo lançamento
            </h3>
            {newsletterSent ? (
              <p className="text-xs text-[#59C36A]">Inscrição confirmada com sucesso!</p>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  placeholder="digite seu e-mail..."
                  className="w-full h-10 px-3 bg-[#241612] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                />
                <button
                  type="submit"
                  className="bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase px-5 h-10 flex-shrink-0 transition-colors"
                >
                  Enviar
                </button>
              </form>
            )}
            <p className="text-[11px] text-[#8C7760] leading-relaxed">
              Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
