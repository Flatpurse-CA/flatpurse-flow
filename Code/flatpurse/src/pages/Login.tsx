import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { palette, useIsMobile, type Mode } from '../lib/auth-ui'

// Desktop users go to Create Account — sign in is mobile only
export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [mode, setMode] = useState<Mode>('dark')
  const C = palette(mode)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isMobile) navigate('/register', { replace: true })
  }, [isMobile, navigate])

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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: C.inputBg,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: '13px 16px',
    color: C.text,
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  }

  if (!isMobile) return null

  return (
    <div style={{
      height: '100dvh',
      background: mode === 'dark'
        ? 'radial-gradient(ellipse 140% 55% at 50% 0%, #6D28D9 0%, #4C1D95 30%, #1E0A3C 60%, #09090B 85%)'
        : C.bg,
      fontFamily: "'DM Sans', system-ui, sans-serif",
      colorScheme: mode,
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── Banner (logo + toggle only) ───────────────────────── */}
      <div style={{
        flexShrink: 0,
        padding: '16px 24px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img
            src="/Flatpurse flow .svg"
            alt="Flatpurse"
            style={{ height: 28, width: 'auto', filter: mode === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
          />
          <button
            onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: mode === 'dark' ? 'rgba(255,255,255,0.12)' : C.surface2,
              border: mode === 'dark' ? '1px solid rgba(255,255,255,0.2)' : `1px solid ${C.border}`,
              color: mode === 'dark' ? '#fff' : C.muted,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>

      {/* ── Form ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', paddingBottom: 20 }}>
        <h1 style={{ color: C.text, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
          Welcome back
        </h1>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.5, margin: '0 0 22px' }}>
          Sign in to continue to your dashboard.
        </p>

        <form onSubmit={handleSubmit}>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', color: C.muted, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Your email
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted, display: 'flex', pointerEvents: 'none' }}>
                <MailIcon />
              </span>
              <input
                type="email" autoComplete="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{ ...inputStyle, paddingLeft: 44 }}
                onFocus={e => (e.target.style.borderColor = C.accent)}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ color: C.muted, fontSize: 13, fontWeight: 500 }}>Password</label>
              <span style={{ color: C.accent, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Forgot password?
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted, display: 'flex', pointerEvents: 'none' }}>
                <LockIcon />
              </span>
              <input
                type={showPassword ? 'text' : 'password'} autoComplete="current-password" required
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ ...inputStyle, paddingLeft: 44, paddingRight: 48 }}
                onFocus={e => (e.target.style.borderColor = C.accent)}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: 4 }}>
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: mode === 'dark' ? 'rgba(248,113,113,0.08)' : 'rgba(220,38,38,0.06)',
              border: `1px solid ${mode === 'dark' ? 'rgba(248,113,113,0.25)' : 'rgba(220,38,38,0.2)'}`,
              borderRadius: 10, padding: '10px 14px', color: C.error,
              fontSize: 13, marginBottom: 14,
            }}>{error}</div>
          )}

          {/* Sign In — accent colour + arrow */}
          <button type="submit" disabled={loading} style={{
            width: '100%',
            background: loading ? C.surface2 : C.accent,
            color: loading ? C.muted : '#fff',
            border: 'none', borderRadius: 14, padding: '15px',
            fontSize: 16, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginBottom: 20,
          }}>
            {loading ? <><Spinner />Signing in…</> : <>Sign In <ArrowRightIcon /></>}
          </button>
        </form>

        {/* OR CONTINUE WITH */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ color: C.muted, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            or continue with
          </span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        {/* Social */}
        <div style={{ display: 'flex', gap: 12 }}>
          {[{ icon: <GoogleIcon />, label: 'Google' }, { icon: <AppleIcon />, label: 'Apple' }].map(({ icon, label }) => (
            <button key={label} type="button" style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: '12px 16px',
              color: C.text, fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}>
              {icon}{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Terms pinned to bottom ────────────────────────────── */}
      <p style={{
        flexShrink: 0,
        color: C.subtle, fontSize: 11, textAlign: 'center', lineHeight: 1.6,
        padding: '0 24px',
        paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
        margin: 0,
      }}>
        By continuing you agree to FlatPurse Flow's{' '}
        <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms</span>{' '}and{' '}
        <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
      </p>
    </div>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg>
  )
}
function MailIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function LockIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ArrowRightIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function SunIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg> }
function MoonIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function GoogleIcon() { return <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg> }
function AppleIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg> }
function Spinner() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.2" /><path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg> }
