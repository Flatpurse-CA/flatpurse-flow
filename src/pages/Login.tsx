import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const C = {
  bg: '#0F0E1A',
  surface: '#1A1927',
  surface2: '#22203A',
  border: '#2C2A3F',
  accent: '#6B63E8',
  accentLight: '#A8A3F5',
  text: '#F0EEF8',
  muted: '#7A7890',
  error: '#F87171',
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex flex-col h-dvh max-w-[480px] mx-auto"
      style={{ background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Top area */}
      <div className="flex flex-col items-center justify-center flex-1 px-6" style={{ paddingTop: 'calc(var(--safe-area-top) + 48px)', paddingBottom: 24 }}>

        {/* Logo mark */}
        <div
          className="flex items-center justify-center rounded-2xl mb-4"
          style={{ width: 56, height: 56, background: C.accent }}
        >
          <span style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>f</span>
        </div>

        <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6, textAlign: 'center' }}>
          Welcome back
        </h1>
        <p style={{ color: C.muted, fontSize: 14, textAlign: 'center', lineHeight: 1.5 }}>
          Sign in to manage your business
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%', marginTop: 36 }}>
          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', color: C.muted, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@business.com"
              required
              style={{
                width: '100%',
                background: C.surface,
                border: `1.5px solid ${error ? C.error : C.border}`,
                borderRadius: 12,
                padding: '14px 16px',
                color: C.text,
                fontSize: 15,
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = C.accent }}
              onBlur={e => { e.target.style.borderColor = error ? C.error : C.border }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: C.muted, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  background: C.surface,
                  border: `1.5px solid ${error ? C.error : C.border}`,
                  borderRadius: 12,
                  padding: '14px 48px 14px 16px',
                  color: C.text,
                  fontSize: 15,
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = C.accent }}
                onBlur={e => { e.target.style.borderColor = error ? C.error : C.border }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: C.muted,
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: 'rgba(248,113,113,0.1)',
                border: `1px solid rgba(248,113,113,0.3)`,
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 20,
                color: C.error,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? C.surface2 : C.accent,
              color: loading ? C.muted : '#fff',
              border: 'none',
              borderRadius: 14,
              padding: '16px',
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              letterSpacing: '-0.01em',
              transition: 'background 0.15s, transform 0.1s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseDown={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)' }}
            onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
          >
            {loading ? (
              <>
                <Spinner />
                Signing in…
              </>
            ) : 'Sign in'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: 'center',
          color: C.muted,
          fontSize: 12,
          paddingBottom: 'calc(var(--safe-area-bottom) + 24px)',
          paddingTop: 12,
        }}
      >
        flatpurse © 2026
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}
