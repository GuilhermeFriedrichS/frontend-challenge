import React, { useState, useEffect, useRef } from 'react'

interface Slide {
  id: number
  tag: string
  titleLine1: string
  titleLine2: string
  description: string
  buttonText: string
  imageUrl: string
  imageAlt: string
  secondaryImageUrl?: string
}

const HERO_SLIDES: Slide[] = [
  {
    id: 0,
    tag: 'Bem-vindo à Kurio',
    titleLine1: 'SEJA DONO DO FUTURO',
    titleLine2: 'DA ARTE DIGITAL',
    description:
      'Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.',
    buttonText: 'EXPLORAR',
    imageUrl: '/assets/nfts/nft-2.jpg',
    imageAlt: 'Emerald Ape #042 - Arte em destaque',
    secondaryImageUrl: '/assets/nfts/nft-1.jpg',
  },
  {
    id: 1,
    tag: 'Bem-vindo à Kurio',
    titleLine1: 'SEJA DONO DA',
    titleLine2: 'CULTURA DIGITAL',
    description:
      'Descubra NFTs selecionados de criadores do mundo todo. Coleções verificadas com procedência registrada e contratos inteligentes seguros.',
    buttonText: 'EXPLORAR',
    imageUrl: '/assets/nfts/nft-1.jpg',
    imageAlt: 'Sage Nomad #009 - Coleção Kurio Editions',
    secondaryImageUrl: '/assets/nfts/nft-4.jpg',
  },
  {
    id: 2,
    tag: 'Lançamentos Gênesis',
    titleLine1: 'ARTE SELECIONADA',
    titleLine2: 'E MUITO MAIS',
    description:
      'Explore novos artistas, comunidades e obras digitais que definem a estética contemporânea em edições limitadas e escassas.',
    buttonText: 'EXPLORAR',
    imageUrl: '/assets/nfts/nft-4.jpg',
    imageAlt: 'Ivory Baron #088 - Retrato neo-digital',
    secondaryImageUrl: '/assets/nfts/nft-3.jpg',
  },
]

export const HeroBanner: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartXRef = useRef<number | null>(null)

  const scrollToCatalog = () => {
    const el = document.getElementById('catalogo')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length)
  }

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
  }

  // Auto-play every 5s, pause on hover/interaction
  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(nextSlide, 5000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused])

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
    setIsPaused(true)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartXRef.current - touchEndX

    if (diff > 50) {
      // Swiped left -> next
      nextSlide()
    } else if (diff < -50) {
      // Swiped right -> prev
      prevSlide()
    }

    touchStartXRef.current = null
    setIsPaused(false)
  }

  const slide = HERO_SLIDES[currentSlide]

  return (
    <section
      className="font-mono pt-6 pb-12 md:pt-10 md:pb-16  select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Destaques do marketplace"
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* Mobile Banner Card (Matches Mobile/Início.png) */}
        <div className="block lg:hidden relative rounded-2xl bg-[#241612] p-5 sm:p-6 border border-[#3D251C] overflow-hidden shadow-xl">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#241612] via-[#2F1D15]/80 to-transparent pointer-events-none" />

          <div className="relative z-10 grid grid-cols-12 gap-4 items-center">
            {/* Left text */}
            <div className="col-span-7 space-y-3">
              <p className="text-[11px] text-[#CFB28C] tracking-wide transition-opacity duration-300">
                {slide.tag}
              </p>
              <h1 className="text-xl sm:text-2xl font-bold uppercase text-[#F5F1EB] leading-tight">
                {slide.titleLine1} <br />
                {slide.titleLine2}
              </h1>
              <p className="text-[11px] text-[#CFB28C] line-clamp-3 leading-relaxed">
                {slide.description}
              </p>
              <button
                type="button"
                onClick={scrollToCatalog}
                className="inline-flex items-center gap-1 text-[#D28A4C] hover:text-[#E89B55] text-xs font-bold uppercase tracking-wider pt-1 transition-colors"
              >
                {slide.buttonText} &rarr;
              </button>
            </div>

            {/* Right Artwork with inset badge */}
            <div className="col-span-5 relative flex justify-center">
              <div className="relative w-full aspect-square max-w-[140px] rounded-xl overflow-hidden shadow-lg border border-[#3D251C]/60 bg-[#140D0A]">
                <img
                  src={slide.imageUrl}
                  alt={slide.imageAlt}
                  className="w-full h-full object-cover transition-opacity duration-500"
                />
              </div>
              {slide.secondaryImageUrl && (
                <div className="absolute -bottom-2 -left-2 w-10 h-10 rounded-full border-2 border-[#241612] overflow-hidden shadow-md">
                  <img
                    src={slide.secondaryImageUrl}
                    alt="Coleção Kurio"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3 Dots Indicator centered at bottom of Mobile card matching Figma */}
          <div
            className="relative z-10 flex items-center justify-center gap-2 pt-5"
            role="tablist"
            aria-label="Navegação dos slides"
          >
            {HERO_SLIDES.map((s, index) => {
              const isActive = index === currentSlide
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Ir para o slide ${index + 1}`}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${isActive
                    ? 'bg-[#D28A4C] scale-110'
                    : 'bg-[#3D251C] hover:bg-[#8C7760]'
                    }`}
                />
              )
            })}
          </div>
        </div>

        {/* Desktop Banner Grid (Matches Desktop/Início.png) */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-12 gap-12 items-center">
            {/* Left Column: Text & CTA */}
            <div className="col-span-7 space-y-6">
              <p className="text-xs sm:text-sm text-[#CFB28C] tracking-wide transition-opacity duration-300">
                {slide.tag}
              </p>

              <h1 className="text-4xl xl:text-5xl font-bold uppercase tracking-tight text-[#F5F1EB] leading-[1.15] min-h-[110px] transition-all duration-300">
                {slide.titleLine1} <br />
                {slide.titleLine2}
              </h1>

              <p className="text-sm text-[#CFB28C] leading-relaxed max-w-lg min-h-[64px] transition-opacity duration-300">
                {slide.description}
              </p>

              <div>
                <button
                  type="button"
                  onClick={scrollToCatalog}
                  className="inline-block bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-extrabold text-base uppercase tracking-wider px-8 py-3.5 transition-colors shadow-md rounded-md"
                >
                  {slide.buttonText}
                </button>
              </div>
            </div>

            {/* Right Column: Featured Hero Artwork */}
            <div className="col-span-5 flex justify-end">
              <div className="relative w-full max-w-[420px] aspect-square rounded-4xl overflow-hidden">
                {HERO_SLIDES.map((s, index) => (
                  <div
                    key={s.id}
                    className={`absolute inset-2 transition-opacity duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                      }`}
                  >
                    <img
                      src={s.imageUrl}
                      alt={s.imageAlt}
                      className="w-full h-full object-cover rounded-3xl"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3 Dots Indicator Centered at the bottom matching Figma Desktop */}
          <div
            className="flex items-center justify-center gap-2.5 pt-10"
            role="tablist"
            aria-label="Navegação dos slides"
          >
            {HERO_SLIDES.map((s, index) => {
              const isActive = index === currentSlide
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Ir para o slide ${index + 1}`}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${isActive
                    ? 'bg-[#D28A4C] scale-110'
                    : 'bg-[#3D251C] hover:bg-[#8C7760]'
                    }`}
                />
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

