import React, { createContext, useContext, useState, useCallback } from 'react'
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export interface ToastMessage {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'destructive' | 'info'
  duration?: number
}

interface ToastContextType {
  toast: (options: Omit<ToastMessage, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback(({ title, description, variant = 'default', duration = 4000 }: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const newToast: ToastMessage = { id, title, description, variant, duration }

    setToasts(prev => [...prev, newToast])

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none p-4"
      >
        {toasts.map(t => {
          const isError = t.variant === 'destructive'
          const isSuccess = t.variant === 'success'

          return (
            <div
              key={t.id}
              role="alert"
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-xl transition-all duration-300 font-mono text-sm animate-in slide-in-from-bottom-5',
                isError && 'bg-[#2A1410] border-[#F0805F] text-[#F5F1EB]',
                isSuccess && 'bg-[#142618] border-[#59C36A] text-[#F5F1EB]',
                !isError && !isSuccess && 'bg-[#241612] border-[#3D251C] text-[#F5F1EB]'
              )}
            >
              {isError && <AlertCircle className="w-5 h-5 text-[#F0805F] shrink-0 mt-0.5" />}
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#59C36A] shrink-0 mt-0.5" />}
              {!isError && !isSuccess && <Info className="w-5 h-5 text-[#E89B55] shrink-0 mt-0.5" />}

              <div className="flex-1">
                <div className="font-semibold text-white">{t.title}</div>
                {t.description && <div className="text-xs text-[#CFB28C] mt-1">{t.description}</div>}
              </div>

              <button
                onClick={() => dismiss(t.id)}
                className="text-[#CFB28C] hover:text-white p-1 rounded transition-colors"
                aria-label="Fechar notificação"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
