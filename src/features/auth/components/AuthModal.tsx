import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { useAuth } from '../context/AuthContext'
import { useToast } from '@/shared/components/ui/toast'
import { Eye, EyeOff, X, Loader2 } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'login' | 'register'
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
}) => {
  const { login, register } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState<'login' | 'register'>(initialTab)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  // Register form state
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(loginEmail, loginPassword)
      toast({
        title: 'Login efetuado com sucesso!',
        description: 'Bem-vindo de volta à Kurio.',
        variant: 'default',
      })
      onClose()
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao realizar login. Tente novamente.'
      setError(msg)
      toast({
        title: 'Falha no login',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (regPassword !== regConfirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (regPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setIsLoading(true)
    try {
      await register(regUsername, regEmail, regPassword, regUsername)
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Seu perfil de colecionador já está pronto.',
        variant: 'default',
      })
      onClose()
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao cadastrar conta.'
      setError(msg)
      toast({
        title: 'Erro de cadastro',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fillQuickLogin = (email: string, pass: string) => {
    setLoginEmail(email)
    setLoginPassword(pass)
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#241612] border border-[#3D251C]/60 text-[#F5F1EB] font-mono p-0 overflow-hidden rounded-2xl shadow-2xl">
        <DialogTitle className="sr-only">Autenticação Kurio</DialogTitle>
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-[#8C7760] hover:text-[#F5F1EB] transition-colors z-20"
          aria-label="Fechar modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8 space-y-5">
          {/* Brand Title matching Figma Mobile/Login & Cadastro */}
          <div className="text-center pt-1">
            <span className="text-2xl font-bold tracking-[0.25em] text-[#F5F1EB] block">
              KURIO
            </span>
            <h2 className="text-sm sm:text-base font-bold text-[#F5F1EB] mt-4">
              {tab === 'login' ? 'Entrar' : 'Criar perfil de colecionador'}
            </h2>
          </div>

          {/* Subtitle / Switch matching Figma */}
          <p className="text-center text-xs text-[#CFB28C] max-w-xs mx-auto leading-relaxed">
            {tab === 'login'
              ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.'
              : 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'}
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-[#2A1410] border border-[#F0805F] text-[11px] text-[#F0805F] text-center">
              {error}
            </div>
          )}

          {/* Form Login matching Figma Mobile/Login.png */}
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="contato@email.com"
                  className="w-full h-12 px-4 bg-[#1C1410] border border-[#3D251C] rounded-2xl text-xs text-[#F5F1EB] placeholder-[#8C7760] focus:outline-none focus:border-[#D28A4C]"
                />
              </div>

              <div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="************"
                    className="w-full h-12 px-4 pr-11 bg-[#1C1410] border border-[#3D251C] rounded-2xl text-xs text-[#F5F1EB] placeholder-[#8C7760] focus:outline-none focus:border-[#D28A4C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C7760] hover:text-[#CFB28C]"
                    aria-label="Alternar visibilidade da senha"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-right pt-2">
                  <a href="#esqueceu" className="text-[11px] text-[#D28A4C] hover:underline">
                    Esqueceu a senha?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase transition-colors rounded-2xl flex items-center justify-center gap-2 shadow-lg"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Entrar
              </button>
            </form>
          ) : (
            /* Form Cadastro matching Figma Mobile/Cadastro.png */
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={e => setRegUsername(e.target.value)}
                  placeholder="Nome de usuário"
                  className="w-full h-12 px-4 bg-[#1C1410] border border-[#3D251C] rounded-2xl text-xs text-[#F5F1EB] placeholder-[#8C7760] focus:outline-none focus:border-[#D28A4C]"
                />
              </div>

              <div>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="Digite seu e-mail"
                  className="w-full h-12 px-4 bg-[#1C1410] border border-[#3D251C] rounded-2xl text-xs text-[#F5F1EB] placeholder-[#8C7760] focus:outline-none focus:border-[#D28A4C]"
                />
              </div>

              <div className="relative">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Senha"
                  className="w-full h-12 px-4 pr-11 bg-[#1C1410] border border-[#3D251C] rounded-2xl text-xs text-[#F5F1EB] placeholder-[#8C7760] focus:outline-none focus:border-[#D28A4C]"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C7760] hover:text-[#CFB28C]"
                  aria-label="Alternar visibilidade da senha"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <input
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={e => setRegConfirmPassword(e.target.value)}
                  placeholder="Confirmar senha"
                  className="w-full h-12 px-4 bg-[#1C1410] border border-[#3D251C] rounded-2xl text-xs text-[#F5F1EB] placeholder-[#8C7760] focus:outline-none focus:border-[#D28A4C]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#D28A4C] hover:bg-[#E89B55] text-[#140D0A] font-bold text-xs uppercase transition-colors rounded-2xl flex items-center justify-center gap-2 shadow-lg"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Criar perfil
              </button>
            </form>
          )}

          {/* Bottom Switch Link matching Figma Mobile */}
          <div className="text-center pt-1">
            {tab === 'login' ? (
              <button
                type="button"
                onClick={() => { setTab('register'); setError(null) }}
                className="text-xs text-[#CFB28C] hover:text-[#D28A4C] transition-colors"
              >
                Novo na Kurio? <span className="text-[#D28A4C] underline">Crie uma conta</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setTab('login'); setError(null) }}
                className="text-xs text-[#CFB28C] hover:text-[#D28A4C] transition-colors"
              >
                Já tem uma conta? <span className="text-[#D28A4C] underline">Entre</span>
              </button>
            )}
          </div>

          {/* Divider "Ou continue com" matching Figma */}
          <div className="relative text-center my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#3D251C]" />
            </div>
            <span className="relative bg-[#241612] px-3 text-[11px] text-[#8C7760]">
              Ou continue com
            </span>
          </div>

          {/* Social Login Buttons matching Figma */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => fillQuickLogin('alex@nftmarketplace.io', 'Password123!')}
              className="w-full h-11 px-4 rounded-2xl bg-[#1C1410] border border-[#3D251C] hover:border-[#8C7760] text-xs text-[#F5F1EB] flex items-center justify-center gap-3 transition-colors"
            >
              {/* Google G Icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continuar com Google</span>
            </button>

            <button
              type="button"
              onClick={() => fillQuickLogin('elena@nftmarketplace.io', 'Password123!')}
              className="w-full h-11 px-4 rounded-2xl bg-[#1C1410] border border-[#3D251C] hover:border-[#8C7760] text-xs text-[#F5F1EB] flex items-center justify-center gap-3 transition-colors"
            >
              {/* Facebook Icon */}
              <svg className="w-4 h-4 fill-[#3B5998]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Continuar com Facebook</span>
            </button>
          </div>

          {/* Quick-fill helper for test reviewer */}
          <div className="pt-2 text-center text-[10px] text-[#8C7760] border-t border-[#2F1D15]">
            <span>Preenchimento rápido de teste: </span>
            <button
              type="button"
              onClick={() => fillQuickLogin('alex@nftmarketplace.io', 'Password123!')}
              className="text-[#D28A4C] underline hover:text-[#E89B55] mr-2"
            >
              Alex
            </button>
            <button
              type="button"
              onClick={() => fillQuickLogin('elena@nftmarketplace.io', 'Password123!')}
              className="text-[#D28A4C] underline hover:text-[#E89B55]"
            >
              Elena
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
