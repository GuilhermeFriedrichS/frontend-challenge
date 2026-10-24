import React, { useState, useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/features/auth/context/AuthContext'
import { api } from '@/shared/lib/api'
import { Wallet } from '@/shared/types'
import { useToast } from '@/shared/components/ui/toast'
import {
  User,
  MapPin,
  ShoppingBag,
  Heart,
  TrendingUp,
  Download,
  AlertCircle,
  LogOut,
  Loader2,
} from 'lucide-react'

export const Route = createFileRoute('/wallets')({
  component: WalletsPage,
})

function WalletsPage() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [, setWallets] = useState<Wallet[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Form Fields matching Figma Carteiras.png
  const [displayName, setDisplayName] = useState('')
  const [nickname, setNickname] = useState('')
  const [network, setNetwork] = useState('Ethereum')
  const [profileName, setProfileName] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [secondaryWallet, setSecondaryWallet] = useState('')
  const [walletType, setWalletType] = useState('metamask')
  const [referralCode, setReferralCode] = useState('')
  const [email, setEmail] = useState('')
  const [ensName, setEnsName] = useState('')

  const fetchWallets = () => {
    api.get<{ items: Wallet[] }>('/wallets')
      .then(res => {
        setWallets(res.data.items)
        const primary = res.data.items.find(w => w.isPrimary) || res.data.items[0]
        if (primary) {
          setNickname(primary.name)
          setWalletAddress(primary.address)
          setNetwork(primary.network)
        }
      })
      .catch(console.warn)
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchWallets()
      if (user) {
        setDisplayName(user.name)
        setProfileName(user.name)
        setEmail(user.email)
        setEnsName((user as any).ensName ? (user as any).ensName.replace('.eth', '') : 'alex')
      }
    }
  }, [isAuthenticated, user])

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 font-mono text-center space-y-4">
        <h1 className="text-xl font-bold text-white">Acesso Restrito</h1>
        <p className="text-xs text-[#CFB28C]">Faça login para gerenciar suas carteiras cadastradas.</p>
        <button
          onClick={() => navigate({ to: '/' })}
          className="bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase px-6 py-2.5 transition-colors"
        >
          Voltar ao Início
        </button>
      </div>
    )
  }

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim())) {
      toast({
        title: 'Endereço inválido',
        description: 'O endereço deve começar com 0x e conter 42 caracteres.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      await api.post('/wallets', {
        name: nickname || 'MetaMask Principal',
        address: walletAddress.trim(),
        network,
        isPrimary: true,
      })
      toast({
        title: 'Carteira salva!',
        description: 'Carteira principal atualizada com sucesso.',
        variant: 'default',
      })
      fetchWallets()
    } catch {
      toast({
        title: 'Erro ao salvar',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 font-mono text-xs pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar Menu matching Figma */}
        <aside className="lg:col-span-3 bg-[#241612] border border-[#3D251C]/40 rounded-xl p-4 space-y-6">
          <h2 className="text-sm font-bold text-[#F5F1EB] px-3 pt-2">
            Meu perfil
          </h2>

          <nav className="space-y-1">
            <Link
              to="/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-xs text-[#CFB28C] hover:text-[#F5F1EB] hover:bg-[#1C1410] transition-colors"
            >
              <User className="w-4 h-4 text-[#8C7760]" />
              <span>Dados do perfil</span>
            </Link>

            <Link
              to="/wallets"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-xs font-bold text-[#D28A4C] bg-[#1C1410] border-l-2 border-[#D28A4C]"
            >
              <MapPin className="w-4 h-4 text-[#D28A4C]" />
              <span>Carteiras</span>
            </Link>

            <a
              href="#atividade"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-xs text-[#CFB28C] hover:text-[#F5F1EB] hover:bg-[#1C1410] transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-[#8C7760]" />
              <span>Atividade</span>
            </a>

            <a
              href="#watchlist"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-xs text-[#CFB28C] hover:text-[#F5F1EB] hover:bg-[#1C1410] transition-colors"
            >
              <Heart className="w-4 h-4 text-[#8C7760]" />
              <span>Lista de interesse</span>
            </a>

            <a
              href="#ofertas"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-xs text-[#CFB28C] hover:text-[#F5F1EB] hover:bg-[#1C1410] transition-colors"
            >
              <TrendingUp className="w-4 h-4 text-[#8C7760]" />
              <span>Ofertas</span>
            </a>

            <a
              href="#downloads"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-xs text-[#CFB28C] hover:text-[#F5F1EB] hover:bg-[#1C1410] transition-colors"
            >
              <Download className="w-4 h-4 text-[#8C7760]" />
              <span>Arquivos baixados</span>
            </a>

            <a
              href="#suporte"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-xs text-[#CFB28C] hover:text-[#F5F1EB] hover:bg-[#1C1410] transition-colors"
            >
              <AlertCircle className="w-4 h-4 text-[#8C7760]" />
              <span>Suporte</span>
            </a>

            <button
              onClick={() => {
                logout()
                navigate({ to: '/' })
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs text-[#F0805F] hover:bg-[#1C1410] transition-colors text-left pt-3 border-t border-[#2F1D15]"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </nav>
        </aside>

        {/* Right Content matching Figma Carteiras.png */}
        <main className="lg:col-span-9 space-y-10">
          {/* Section 1: Carteira Principal */}
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h1 className="text-base font-bold text-[#F5F1EB]">
                  Carteira principal
                </h1>
                <p className="text-[11px] text-[#8C7760] pt-1">
                  Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWalletAddress('0x' + Math.random().toString(16).substring(2, 42).padEnd(40, '0'))
                  toast({ title: 'Novo endereço gerado para teste' })
                }}
                className="text-xs text-[#D28A4C] hover:underline"
              >
                Adicionar
              </button>
            </div>

            <form onSubmit={handleSaveWallet} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Row 1 */}
                <div>
                  <label className="text-[11px] text-[#CFB28C] block mb-1">
                    Nome de exibição<span className="text-[#F0805F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full h-10 px-3 bg-[#1C1410] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#CFB28C] block mb-1">
                    Apelido da carteira<span className="text-[#F0805F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder="MetaMask Principal"
                    className="w-full h-10 px-3 bg-[#1C1410] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                  />
                </div>

                {/* Row 2 */}
                <div>
                  <label className="text-[11px] text-[#CFB28C] block mb-1">
                    Rede <span className="text-[#F0805F]">*</span>
                  </label>
                  <select
                    value={network}
                    onChange={e => setNetwork(e.target.value as any)}
                    className="w-full h-10 px-3 bg-[#1C1410] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                  >
                    <option value="Ethereum">Ethereum</option>
                    <option value="Polygon">Polygon</option>
                    <option value="Solana">Solana</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#CFB28C] block mb-1">
                    Nome do perfil<span className="text-[#F0805F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    className="w-full h-10 px-3 bg-[#1C1410] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                  />
                </div>

                {/* Row 3 */}
                <div>
                  <label className="text-[11px] text-[#CFB28C] block mb-1">
                    Endereço da carteira<span className="text-[#F0805F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={walletAddress}
                    onChange={e => setWalletAddress(e.target.value)}
                    placeholder="Endereço 0x da carteira"
                    className="w-full h-10 px-3 bg-[#1C1410] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#CFB28C] block mb-1">
                    ENS ou carteira secundária (opcional)
                  </label>
                  <input
                    type="text"
                    value={secondaryWallet}
                    onChange={e => setSecondaryWallet(e.target.value)}
                    placeholder="ENS ou carteira secundária (opcional)"
                    className="w-full h-10 px-3 bg-[#1C1410] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                  />
                </div>

                {/* Row 4 */}
                <div>
                  <label className="text-[11px] text-[#CFB28C] block mb-1">
                    Tipo de carteira<span className="text-[#F0805F]">*</span>
                  </label>
                  <select
                    value={walletType}
                    onChange={e => setWalletType(e.target.value)}
                    className="w-full h-10 px-3 bg-[#1C1410] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                  >
                    <option value="metamask">MetaMask</option>
                    <option value="coinbase">Coinbase Wallet</option>
                    <option value="walletconnect">WalletConnect</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#CFB28C] block mb-1">
                    Código de indicação<span className="text-[#F0805F]">*</span>
                  </label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={e => setReferralCode(e.target.value)}
                    placeholder="KURIO-REF"
                    className="w-full h-10 px-3 bg-[#1C1410] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                  />
                </div>

                {/* Row 5 */}
                <div>
                  <label className="text-[11px] text-[#CFB28C] block mb-1">
                    E-mail<span className="text-[#F0805F]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full h-10 px-3 bg-[#1C1410] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#CFB28C] block mb-1">
                    Nome ENS <span className="text-[#F0805F]">*</span>
                  </label>
                  <div className="flex">
                    <select className="h-10 px-2 bg-[#140D0A] border border-[#3D251C] border-r-0 text-xs text-[#D28A4C] focus:outline-none">
                      <option value=".eth">.eth</option>
                    </select>
                    <input
                      type="text"
                      value={ensName}
                      onChange={e => setEnsName(e.target.value)}
                      className="flex-1 h-10 px-3 bg-[#1C1410] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase px-8 py-2.5 transition-colors rounded-none disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar carteira'}
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Carteira Secundária matching Figma */}
          <div className="space-y-4 pt-6 border-t border-[#2F1D15]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[#F5F1EB]">
                  Carteira secundária
                </h2>
                <p className="text-[11px] text-[#8C7760] pt-1">
                  Você ainda não adicionou uma carteira secundária.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2 text-[#CFB28C] cursor-pointer">
                  <input type="radio" name="secOption" className="accent-[#D28A4C]" />
                  <span>Igual à carteira principal</span>
                </label>
                <button
                  type="button"
                  onClick={() => toast({ title: 'Adicionar carteira secundária', description: 'Preencha os dados da nova carteira.' })}
                  className="text-[#D28A4C] hover:underline"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
