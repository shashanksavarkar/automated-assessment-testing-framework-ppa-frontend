import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '@/lib/api'

interface AuthState {
  name: string | null
  loading: boolean
  login: (name: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .me()
      .then((me) => setName(me.name))
      .catch(() => setName(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(name: string, password: string) {
    const me = await api.login(name, password)
    setName(me.name)
  }

  async function logout() {
    try {
      await api.logout()
    } finally {
      setName(null)
    }
  }

  return <AuthContext.Provider value={{ name, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
