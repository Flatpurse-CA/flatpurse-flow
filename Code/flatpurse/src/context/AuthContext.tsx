import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthUser {
  id: string
  email: string | undefined
  firstName: string
  lastName: string
  businessName: string
  businessType: string
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  businessName: string
  businessType: string
  city: string
  province: string
  plan: string
}

interface AuthContextValue {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signUp: (payload: RegisterPayload) => Promise<void>
  verifyEmailOtp: (email: string, code: string) => Promise<void>
  resendEmailOtp: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapUser(user: User): AuthUser {
  const meta = user.user_metadata ?? {}
  return {
    id: user.id,
    email: user.email,
    firstName: meta.firstName ?? '',
    lastName: meta.lastName ?? '',
    businessName: meta.businessName ?? '',
    businessType: meta.businessType ?? '',
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const user = session?.user ? mapUser(session.user) : null

  const login = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    if (data.session) setSession(data.session)
  }

  const signUp = async (payload: RegisterPayload) => {
    const { error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          businessName: payload.businessName,
          businessType: payload.businessType,
          city: payload.city,
          province: payload.province,
          plan: payload.plan,
        },
      },
    })
    if (error) throw new Error(error.message)
  }

  const verifyEmailOtp = async (email: string, code: string) => {
    const { error, data } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' })
    if (error) throw new Error(error.message)
    if (data.session) setSession(data.session)
  }

  const resendEmailOtp = async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) throw new Error(error.message)
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, login, signUp, verifyEmailOtp, resendEmailOtp, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
