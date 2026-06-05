import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthUser {
  id: string
  email: string | undefined
  phone: string | undefined
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
  phone: string
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
  sendOtp: (phone: string) => Promise<void>
  verifyOtp: (phone: string, token: string) => Promise<void>
  completeRegistration: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapUser(user: User): AuthUser {
  const meta = user.user_metadata ?? {}
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  const sendOtp = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone, options: { channel: 'sms' } })
    if (error) throw new Error(error.message)
  }

  const verifyOtp = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
    if (error) throw new Error(error.message)
  }

  const completeRegistration = async (payload: RegisterPayload) => {
    const { error } = await supabase.auth.updateUser({
      email: payload.email,
      password: payload.password,
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone,
        businessName: payload.businessName,
        businessType: payload.businessType,
        city: payload.city,
        province: payload.province,
        plan: payload.plan,
      },
    })
    if (error) throw new Error(error.message)
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, login, sendOtp, verifyOtp, completeRegistration, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
