import React, { useState, useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/features/auth/context/AuthContext'
import { api } from '@/shared/lib/api'
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
  Eye,
  EyeOff,
  Image as ImageIcon,
} from 'lucide-react'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { user, isAuthenticated, updateProfile, logout } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [ensName, setEnsName] = useState('')
  const [walletNickname, setWalletNickname] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setDisplayName(user.name)
      setUsername((user as any).username || 'alex_collector')
      setEmail(user.email)
      setEnsName((user as any).ensName ? (user as any).ensName.replace('.eth', '') : 'alex')
      setWalletNickname('Principal')
      setAvatarUrl(user.avatarUrl || '/assets/nfts/nft-2.jpg')
    }
  }, [user])

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 font-mono text-center space-y-4">
        <h1 className="text-xl font-bold text-white">Acesso Restrito</h1>
        <p className="text-xs text-[#CFB28C]">Faça login para gerenciar seu perfil de colecionador.</p>
        <button
          onClick={() => navigate({ to: '/' })}
          className="bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase px-6 py-2.5 transition-colors"
        >
          Voltar ao Início
        </button>
      </div>
    )
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    try {
      await updateProfile({
        name: displayName,
        avatarUrl,
        ...({ username, ensName: `${ensName}.eth` } as any),
      })
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
        variant: 'default',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar perfil',
        description: err.response?.data?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)

    if (newPassword !== confirmPassword) {
      setPasswordError('A nova senha e a confirmação não coincidem.')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }

    setIsSavingPassword(true)
    try {
      await api.put('/auth/password', {
        currentPassword,
        newPassword,
      })
      toast({
        title: 'Senha alterada!',
        description: 'Sua senha foi redefinida com sucesso.',
        variant: 'default',
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao alterar senha. Verifique sua senha atual.'
      setPasswordError(msg)
      toast({
        title: 'Erro na alteração de senha',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 font-mono text-xs pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar Menu matching Figma Perfil do Colecionador.png */}
        <aside className="lg:col-span-3 bg-[#241612] border border-[#3D251C]/40 rounded-xl p-4 space-y-6">
          <h2 className="text-sm font-bold text-[#F5F1EB] px-3 pt-2">
            Meu perfil
          </h2>

          <nav className="space-y-1">
            <Link
              to="/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-xs font-bold text-[#D28A4C] bg-[#1C1410] border-l-2 border-[#D28A4C]"
            >
              <User className="w-4 h-4 text-[#D28A4C]" />
              <span>Dados do perfil</span>
            </Link>

            <Link
              to="/wallets"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-xs text-[#CFB28C] hover:text-[#F5F1EB] hover:bg-[#1C1410] transition-colors"
            >
              <MapPin className="w-4 h-4 text-[#8C7760]" />
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

        {/* Right Content Form matching Figma */}
        <main className="lg:col-span-9 space-y-10">
          {/* Section 1: Dados do Perfil */}
          <div className="space-y-6">
            <h1 className="text-base font-bold text-[#F5F1EB]">
              Perfil do colecionador
            </h1>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                    Nome de usuário<span className="text-[#F0805F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full h-10 px-3 bg-[#1C1410] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                  />
                </div>

                {/* Row 2 */}
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

                {/* Row 3 */}
                <div>
                  <label className="text-[11px] text-[#CFB28C] block mb-1">
                    Apelido da carteira<span className="text-[#F0805F]">*</span>
                  </label>
                  <input
                    type="text"
                    value={walletNickname}
                    onChange={e => setWalletNickname(e.target.value)}
                    className="w-full h-10 px-3 bg-[#1C1410] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                  />
                </div>

                {/* Avatar Section matching Figma: circle + Alterar + Remover */}
                <div>
                  <label className="text-[11px] text-[#CFB28C] block mb-1">
                    Avatar
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1C1410] border border-[#3D251C] overflow-hidden flex items-center justify-center shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-[#8C7760]" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('/assets/nfts/nft-2.jpg')}
                      className="bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase px-4 py-2 transition-colors"
                    >
                      Alterar
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="text-xs text-[#CFB28C] hover:text-[#F0805F] transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase px-8 py-2.5 transition-colors rounded-none disabled:opacity-50"
                >
                  {isSavingProfile ? 'Salvando...' : 'Salvar perfil'}
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Alterar senha matching Figma */}
          <div className="space-y-6 pt-6 border-t border-[#2F1D15]">
            <h2 className="text-base font-bold text-[#F5F1EB]">
              Alterar senha
            </h2>

            {passwordError && (
              <div className="p-3 rounded bg-[#2A1410] border border-[#F0805F] text-[11px] text-[#F0805F]">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
              <div>
                <label className="text-[11px] text-[#CFB28C] block mb-1">
                  Senha atual
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full h-10 px-3 pr-10 bg-[#1C1410] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7760]"
                    aria-label="Ver senha"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#CFB28C] block mb-1">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full h-10 px-3 pr-10 bg-[#1C1410] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7760]"
                    aria-label="Ver senha"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#CFB28C] block mb-1">
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full h-10 px-3 pr-10 bg-[#1C1410] border border-[#3D251C] text-xs text-[#F5F1EB] focus:outline-none focus:border-[#D28A4C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7760]"
                    aria-label="Ver senha"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase px-8 py-2.5 transition-colors rounded-none disabled:opacity-50"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
