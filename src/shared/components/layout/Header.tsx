import React, { useState, useRef, useEffect } from 'react'
import { Link, useRouterState, useNavigate } from '@tanstack/react-router'
import { ShoppingBag, Search, LogIn, User as UserIcon, LogOut, Wallet, Menu, X } from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useCart } from '@/features/cart/context/CartContext'
import { AuthModal } from '@/features/auth/components/AuthModal'

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const { totalItemsCount } = useCart()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  // Close user menu on outside click / Escape
  useEffect(() => {
    if (!userMenuOpen) return
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [userMenuOpen])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = searchTerm.trim()
    navigate({
      to: '/',
      search: (prev: Record<string, unknown>) => ({ ...prev, search: term || undefined, page: 1 }),
      hash: 'catalogo',
    } as any)
    setSearchOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#140D0A]  font-mono">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6">
          {/* Logo matching Figma */}
          <Link
            to="/"
            className="text-xl font-bold tracking-widest text-[#F5F1EB] hover:text-[#D28A4C] transition-colors"
          >
            KURIO
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium">
            <Link
              to="/"
              className={`transition-colors py-2 relative ${pathname === '/'
                  ? 'text-[#D28A4C] font-bold'
                  : 'text-[#CFB28C] hover:text-[#F5F1EB]'
                }`}
            >
              Início
              {pathname === '/' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D28A4C]" />
              )}
            </Link>

            <a
              href="/#catalogo"
              className={`transition-colors py-2 relative ${pathname.startsWith('/nft')
                  ? 'text-[#D28A4C] font-bold'
                  : 'text-[#CFB28C] hover:text-[#F5F1EB]'
                }`}
            >
              Mercado
              {pathname.startsWith('/nft') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D28A4C]" />
              )}
            </a>

            <a
              href="#criadores"
              className="text-[#CFB28C] hover:text-[#F5F1EB] transition-colors py-2"
            >
              Criadores
            </a>

            <a
              href="#aprenda"
              className="text-[#CFB28C] hover:text-[#F5F1EB] transition-colors py-2"
            >
              Aprenda
            </a>
          </nav>

          {/* Right Action Icons matching Figma */}
          <div className="flex items-center gap-4">
            {/* Search: icon toggles an inline field that drives ?search= on the catalog */}
            {searchOpen ? (
              <form role="search" onSubmit={handleSearchSubmit} className="flex items-center">
                <label htmlFor="header-search" className="sr-only">
                  Buscar NFTs
                </label>
                <input
                  id="header-search"
                  ref={searchInputRef}
                  type="search"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
                  placeholder="Buscar NFTs..."
                  className="w-36 sm:w-56 h-9 px-3 bg-[#241612] border border-[#3D251C] text-xs text-[#F5F1EB] placeholder:text-[#8C7760] focus:outline-none focus:border-[#D28A4C]"
                />
                <button
                  type="submit"
                  className="h-9 px-2 text-[#F5F1EB] hover:text-[#D28A4C]"
                  aria-label="Executar busca"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="p-2 text-[#F5F1EB] hover:text-[#D28A4C] transition-colors"
                aria-label="Abrir busca"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Cart Icon with badge */}
            <Link
              to="/cart"
              className="relative p-2 text-[#F5F1EB] hover:text-[#D28A4C] transition-colors"
              aria-label={`Carrinho com ${totalItemsCount} itens`}
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItemsCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#D28A4C] text-[10px] font-bold text-[#140D0A]">
                  {totalItemsCount}
                </span>
              )}
            </Link>

            {/* Auth Button matching Figma */}
            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(o => !o)}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  aria-label="Menu do usuário"
                  className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#241612] border border-[#3D251C] hover:border-[#D28A4C] text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D28A4C]"
                >
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="text-[#F5F1EB] max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                </button>

                {userMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-48 rounded bg-[#1C1410] border border-[#3D251C] py-2 shadow-2xl z-50"
                  >
                    <div className="px-4 py-2 ">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-[#8C7760] truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-[#CFB28C] hover:text-[#D28A4C] hover:bg-[#241612] focus:outline-none focus-visible:bg-[#241612]"
                    >
                      <UserIcon className="w-3.5 h-3.5" /> Meu perfil
                    </Link>
                    <Link
                      to="/wallets"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-[#CFB28C] hover:text-[#D28A4C] hover:bg-[#241612] focus:outline-none focus-visible:bg-[#241612]"
                    >
                      <Wallet className="w-3.5 h-3.5" /> Carteiras
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false)
                        logout()
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#F0805F] hover:bg-[#241612] focus:outline-none focus-visible:bg-[#241612]"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase px-4 py-2 rounded-md transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar</span>
              </button>
            )}

            {/* Mobile Menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#F5F1EB]"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1C1410] border-b border-[#3D251C] px-6 py-4 space-y-3 font-mono text-xs">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[#F5F1EB] "
            >
              Início
            </Link>
            <a
              href="/#catalogo"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[#CFB28C] "
            >
              Mercado
            </a>
            <a
              href="#criadores"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[#CFB28C] "
            >
              Criadores
            </a>
            <a
              href="#aprenda"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[#CFB28C] "
            >
              Aprenda
            </a>
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-[#CFB28C]"
                >
                  Meu perfil
                </Link>
                <Link
                  to="/wallets"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-[#CFB28C]"
                >
                  Carteiras
                </Link>
                <button
                  onClick={() => {
                    logout()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left py-2 text-[#F0805F]"
                >
                  Sair
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setAuthModalOpen(true)
                }}
                className="w-full py-2 bg-[#D28A4C] text-[#140D0A] font-bold uppercase rounded mt-2"
              >
                Entrar
              </button>
            )}
          </div>
        )}
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab="login"
      />
    </>
  )
}
