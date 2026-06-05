import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, setToken, clearToken, type Me } from '../lib/api'

interface AuthUser extends Me {
  token: string
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('fp_token')
    if (!token) { setLoading(false); return }
    api.get<Me>('/auth/me')
      .then(me => setUser({ ...me, token }))
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{
      accessToken: string; success: boolean; errorMessage: string | null;
      email: string; firstName: string; lastName: string;
      organizationId: string; businessName: string; businessType: string; accountId: string;
    }>('/auth/login', { email, password })

    if (!res.success) throw new Error(res.errorMessage || 'Login failed')

    setToken(res.accessToken)
    setUser({
      token: res.accessToken,
      accountId: res.accountId,
      email: res.email,
      firstName: res.firstName,
      lastName: res.lastName,
      organizationId: res.organizationId,
      businessName: res.businessName,
      businessType: res.businessType,
    })
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
