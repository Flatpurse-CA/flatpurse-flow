import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { palette, useIsMobile, type Mode } from '../lib/auth-ui'

const steps = [
  { n: 1, label: 'Sign up your account' },
  { n: 2, label: 'Set up your workspace' },
  { n: 3, label: 'Set up your profile' },
]

export default function Register() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [mode, setMode] = useState<Mode>('dark')
  const C = palette(mode)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError(null)
    setLoading(true)
    try {
      // Registration endpoint TBD — navigate to login on success
      await new Promise(r => setTimeout(r, 800))
      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: C.inputBg,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: '13px 14px',
    color: C.text,
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  const form = (
    <form onSubmit={handleSubmit}>
      {/* First + Last name row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', color: C.muted, fontSize: 13, fontWeight: 500, marginBottom: 8 }}>First Name</label>
          <input
            type="text" autoComplete="given-name" required
            value={firstName} onChange={e => setFirstName(e.target.value)}
            placeholder="eg. John"
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = C.accent)}
            onBlur={e => (e.target.style.borderColor = C.border)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', color: C.muted, fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Last Name</label>
          <input
            type="text" autoComplete="family-name" required
            value={lastName} onChange={e => setLastName(e.target.value)}
            placeholder="eg. Francisco"
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = C.accent)}
            onBlur={e => (e.target.style.borderColor = C.border)}
          />
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: 'block', color: C.muted, fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Email</label>
        <input
          type="email" autoComplete="email" required
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder="eg. johnfrans@gmail.com"
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = C.accent)}
          onBlur={e => (e.target.style.borderColor = C.border)}
        />
      </div>

      <div>
        <label style={{ display: 'block', color: C.muted, fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Password</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'} autoComplete="new-password" required
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            style={{ ...inputStyle, paddingRight: 44 }}
            onFocus={e => (e.target.style.borderColor = C.accent)}
            onBlur={e => (e.target.style.borderColor = C.border)}
          />
          <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)}
            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', padding: 4 }}>
            <EyeIcon open={showPassword} />
          </button>
        </div>
        <p style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Must be at least 8 characters.</p>
      </div>

      {error && (
        <div style={{
          background: mode === 'dark' ? 'rgba(248,113,113,0.08)' : 'rgba(220,38,38,0.06)',
          border: `1px solid ${mode === 'dark' ? 'rgba(248,113,113,0.25)' : 'rgba(220,38,38,0.2)'}`,
          borderRadius: 10, padding: '12px 14px', color: C.error,
          fontSize: 13, lineHeight: 1.5, marginTop: 16,
        }}>{error}</div>
      )}

      <button type="submit" disabled={loading} style={{
        width: '100%', marginTop: 26,
        background: loading ? C.surface2 : C.submitBg,
        color: loading ? C.muted : C.submitText,
        border: 'none', borderRadius: 12, padding: '14px',
        fontSize: 15, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'background 0.15s',
      }}>
        {loading ? <><Spinner />Creating account…</> : 'Sign Up'}
      </button>

      <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', marginTop: 24 }}>
        Already have an account?{' '}
        <span onClick={() => navigate('/login')} style={{ color: C.accent, fontWeight: 600, cursor: 'pointer' }}>
          Log in
        </span>
      </p>

      <p style={{ color: C.subtle, fontSize: 11, textAlign: 'center', marginTop: 28, lineHeight: 1.6 }}>
        By continuing you agree to FlatPurse Flow's{' '}
        <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms</span>{' '}and{' '}
        <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
      </p>
    </form>
  )

  const topBar = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '20px 32px', gap: 10 }}>
      <button onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, background: C.surface2, border: `1px solid ${C.border}`, color: C.muted, cursor: 'pointer' }}>
        {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>
      <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 7, background: C.accent, borderRadius: 10, padding: '9px 16px', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
        <DownloadIcon />Download app
      </a>
    </div>
  )

  const socials = (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[{ icon: <GoogleIcon />, label: 'Google' }, { icon: <AppleIcon />, label: 'Apple' }].map(({ icon, label }) => (
          <button key={label} type="button" style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: C.socialBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 16px',
            color: C.text, fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'background 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = C.socialHover)}
            onMouseLeave={e => (e.currentTarget.style.background = C.socialBg)}>
            {icon}{label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <span style={{ color: C.muted, fontSize: 13 }}>Or</span>
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>
    </>
  )

  /* ── Mobile layout ─────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif", colorScheme: mode }}>
        <div style={{
          background: `linear-gradient(180deg, #6D28D9 0%, #4C1D95 40%, #1E0A3C 70%, ${C.bg} 100%)`,
          padding: '20px 24px 80px',
        }}>
          {/* Logo + toggle on same row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
            <img
              src="/Flatpurse flow .svg"
              alt="Flatpurse"
              style={{ height: 32, width: 'auto', filter: 'brightness(0) invert(1)' }}
            />
            <button onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')}
              style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>

          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>Sign Up Account</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 1.5 }}>Enter your personal data to create your account.</p>
        </div>

        <div style={{ padding: '8px 24px 56px' }}>
          {socials}
          {form}
        </div>
      </div>
    )
  }

  /* ── Desktop layout ─────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif", colorScheme: mode, transition: 'background 0.2s' }}>

      {/* Left panel */}
      <div style={{ width: '45%', minWidth: 420, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '48px 44px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 60% 10%, #7C3AED 0%, #4C1D95 35%, #1A0A2E 65%, #09090B 100%)', borderRadius: 20, margin: 12 }} />
        <div style={{ position: 'absolute', inset: 0, margin: 12, borderRadius: 20, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }} />

        <div style={{ position: 'absolute', top: 44, left: 44, zIndex: 1 }}>
          <img src="/Flatpurse flow .svg" alt="Flatpurse" style={{ height: 36, width: 'auto', filter: mode === 'dark' ? 'brightness(0) invert(1)' : 'none' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Get Started</p>
          <h2 style={{ color: '#fff', fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 32 }}>
            Get Started<br />with Us
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {steps.map((s, i) => (
              <div key={s.n} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: i === 0 ? C.cardActiveBg : C.cardBg,
                border: i === 0 ? 'none' : `1px solid ${C.cardBorder}`,
                backdropFilter: 'blur(12px)', borderRadius: 14, padding: '13px 18px',
              }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: i === 0 ? C.cardActiveNumBg : 'rgba(255,255,255,0.15)', color: i === 0 ? C.cardActiveNum : 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                  {s.n}
                </span>
                <span style={{ fontSize: 14, fontWeight: 500, color: i === 0 ? C.cardActiveText : 'rgba(255,255,255,0.7)' }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {topBar}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 40px' }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
            <h1 style={{ color: C.text, fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 8 }}>Sign Up Account</h1>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>Enter your personal data to create your account.</p>
            {socials}
            {form}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg>
  )
}
function SunIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg> }
function MoonIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function DownloadIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function GoogleIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: 2 }}><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg> }
function AppleIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 2 }}><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg> }
function Spinner() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.2" /><path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg> }
