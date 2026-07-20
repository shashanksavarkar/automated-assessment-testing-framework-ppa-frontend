import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '@/lib/api'

interface AuthState {
  email: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .me()
      .then((me) => setEmail(me.email))
      .catch(() => setEmail(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const me = await api.login(email, password)
    setEmail(me.email)
  }

  async function logout() {
    try {
      await api.logout()
    } finally {
      setEmail(null)
    }
  }

  return <AuthContext.Provider value={{ email, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
