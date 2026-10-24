import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User, SessionInfo } from '@/shared/types'
import { api } from '@/shared/lib/api'
import { queryClient } from '@/shared/lib/queryClient'
import { clearObservedVersions } from '@/shared/lib/socket'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, username?: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'KURIO_AUTH_TOKEN'
const USER_KEY = 'KURIO_AUTH_USER'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Verify session on mount
  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const response = await api.get<SessionInfo>('/auth/session')
        setUser(response.data.user)
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.user))
      } catch {
        // Token invalid or expired
        setUser(null)
        setToken(null)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      } finally {
        setIsLoading(false)
      }
    }

    verifySession()
  }, [token])

  // Handle session expiry from API interceptor
  useEffect(() => {
    const handleExpiry = () => {
      setUser(null)
      setToken(null)
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      queryClient.clear()
      clearObservedVersions()
    }

    window.addEventListener('kurio:session-expired', handleExpiry)
    return () => window.removeEventListener('kurio:session-expired', handleExpiry)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<SessionInfo>('/auth/login', { email, password })
    const { token: newToken, user: newUser } = response.data

    setToken(newToken)
    setUser(newUser)
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))

    // Invalidate user queries to load fresh data for the new user
    queryClient.invalidateQueries()
  }, [])

  const register = useCallback(async (name: string, email: string, password: string, username?: string) => {
    const response = await api.post<SessionInfo>('/auth/register', { name, email, password, username })
    const { token: newToken, user: newUser } = response.data

    setToken(newToken)
    setUser(newUser)
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))

    queryClient.invalidateQueries()
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Ignore
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)

      // CRITICAL: Clean all private queries and socket version state to isolate users!
      queryClient.clear()
      clearObservedVersions()
    }
  }, [])

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    const response = await api.put<User>('/auth/profile', updates)
    setUser(response.data)
    localStorage.setItem(USER_KEY, JSON.stringify(response.data))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
