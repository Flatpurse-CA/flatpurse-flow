import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { palette, useIsMobile, type Mode } from '../lib/auth-ui'

const SLIDES = [
  { img: '/sd1.jpg', heading: 'Run Your Salon, Stress-Free', sub: 'Bookings, payments, and staff — all in one place.' },
  { img: '/sd2.jpg', heading: 'Get Paid, Every Time', sub: 'Accept Tap to Pay and instant bank transfers.' },
  { img: '/sd3.jpg', heading: 'Your Clients, Your Brand', sub: 'Beautiful booking pages that represent your business.' },
  { img: '/sd4.jpg', heading: 'Never Miss a Beat', sub: 'Automated reminders so your chair stays full.' },
  { img: '/sd5.jpg', heading: 'Grow With Confidence', sub: 'Real-time reports on every appointment and dollar.' },
  { img: '/sd6.jpg', heading: 'AutoPilot Your Business', sub: 'Let AI handle the routine so you can focus on craft.' },
  { img: '/sd7.jpg', heading: 'Trusted by Pros', sub: 'Thousands of stylists and barbers already love Flatpurse.' },
  { img: '/sd8.jpg', heading: 'Your Shop, Everywhere', sub: 'Manage everything from any device, anytime.' },
]

const ANIM_CSS = `
  @keyframes fp-panel-in {
    from { opacity:0; transform:translateX(-48px) scale(0.95); filter:blur(6px); }
    to   { opacity:1; transform:translateX(0) scale(1); filter:blur(0px); }
  }
  @keyframes fp-fade-up {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
`

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [mode, setMode] = useState<Mode>('dark')
  const C = palette(mode)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [carouselIdx, setCarouselIdx] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) navigate('/app', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  useEffect(() => {
    const id = setInterval(() => setCarouselIdx(i => (i + 1) % SLIDES.length), 4000)
    return () => clearInterval(id)
  }, [])

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

  /* ── Mobile ─────────────────────────────────────────────────── */
  if (isMobile) {
    const inputStyle: React.CSSProperties = {
      width: '100%', background: C.inputBg, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: '13px 16px', color: C.text, fontSize: 15,
      outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
    }
    return (
      <div ref={containerRef} tabIndex={-1} style={{
        height: '100dvh',
        background: mode === 'dark'
          ? 'radial-gradient(ellipse 140% 55% at 50% 0%, #6D28D9 0%, #4C1D95 30%, #1E0A3C 60%, #09090B 85%)'
          : C.bg,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        colorScheme: mode,
        display: 'flex', flexDirection: 'column', outline: 'none',
      }}>
        <div style={{ flexShrink: 0, paddingTop: 'max(40px, calc(env(safe-area-inset-top, 0px) + 20px))', paddingLeft: 24, paddingRight: 24, paddingBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <img src="/Flatpurse flow .svg" alt="Flatpurse" style={{ height: 28, filter: mode === 'dark' ? 'brightness(0) invert(1)' : 'none' }} />
            <button onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')} style={{ width: 36, height: 36, borderRadius: 10, background: mode === 'dark' ? 'rgba(255,255,255,0.12)' : C.surface2, border: mode === 'dark' ? '1px solid rgba(255,255,255,0.2)' : `1px solid ${C.border}`, color: mode === 'dark' ? '#fff' : C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', paddingBottom: 20 }}>
          <h1 style={{ color: C.text, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>Welcome back</h1>
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.5, margin: '0 0 22px' }}>Sign in to continue to your dashboard.</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: C.muted, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Your email</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted, display: 'flex', pointerEvents: 'none' }}><MailIcon /></span>
                <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" style={{ ...inputStyle, paddingLeft: 44 }} onFocus={e => (e.target.style.borderColor = C.accent)} onBlur={e => (e.target.style.borderColor = C.border)} />
              </div>
            </div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ color: C.muted, fontSize: 13, fontWeight: 500 }}>Password</label>
                <span style={{ color: C.accent, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Forgot password?</span>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted, display: 'flex', pointerEvents: 'none' }}><LockIcon /></span>
                <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ ...inputStyle, paddingLeft: 44, paddingRight: 48 }} onFocus={e => (e.target.style.borderColor = C.accent)} onBlur={e => (e.target.style.borderColor = C.border)} />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: 4 }}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>
            {error && <div style={{ background: mode === 'dark' ? 'rgba(248,113,113,0.08)' : 'rgba(220,38,38,0.06)', border: `1px solid ${mode === 'dark' ? 'rgba(248,113,113,0.25)' : 'rgba(220,38,38,0.2)'}`, borderRadius: 10, padding: '10px 14px', color: C.error, fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? C.surface2 : C.accent, color: loading ? C.muted : '#fff', border: 'none', borderRadius: 14, padding: '15px', fontSize: 16, fontWeight: 700, cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              {loading ? <><Spinner />Signing in…</> : <>Sign In <ArrowRightIcon /></>}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ color: C.muted, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px', color: C.text, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
              <GoogleIcon />Google
            </button>
          </div>
        </div>

        <p style={{ flexShrink: 0, color: C.subtle, fontSize: 11, textAlign: 'center', lineHeight: 1.6, padding: '0 24px', paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))', margin: 0 }}>
          By continuing you agree to FlatPurse Flow's{' '}
          <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms</span>{' '}and{' '}
          <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
        </p>
      </div>
    )
  }

  /* ── Desktop ─────────────────────────────────────────────────── */
  const di: React.CSSProperties = {
    width: '100%', background: C.inputBg, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: '13px 14px', color: C.text, fontSize: 15,
    outline: 'none', transition: 'border-color 0.15s',
  }
  const lbl: React.CSSProperties = { display: 'block', color: C.muted, fontSize: 13, fontWeight: 500, marginBottom: 8 }
  const fadeUp = (delay: number): React.CSSProperties => ({
    animation: `fp-fade-up 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms both`,
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif", colorScheme: mode, transition: 'background 0.2s' }}>
      <style>{ANIM_CSS}</style>

      {/* Left panel — photo carousel */}
      <div style={{ width: '45%', minWidth: 420, flexShrink: 0, position: 'relative', margin: 12, borderRadius: 20, overflow: 'hidden', animation: 'fp-panel-in 0.42s cubic-bezier(0.16,1,0.3,1) both' }}>
        {SLIDES.map((slide, i) => (
          <img key={slide.img} src={slide.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: i === carouselIdx ? 1 : 0, transition: 'opacity 1.2s ease' }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 28%, rgba(30,8,56,0.55) 58%, rgba(15,3,32,0.93) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 32, left: 32, zIndex: 2 }}>
          <img src="/Flatpurse flow .svg" alt="Flatpurse" style={{ height: 28, filter: 'brightness(0) invert(1)' }} />
        </div>
        <div style={{ position: 'absolute', bottom: 40, left: 36, right: 36, zIndex: 2 }}>
          <div key={carouselIdx} style={{ animation: 'fp-fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
            <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.3, margin: '0 0 10px' }}>{SLIDES[carouselIdx].heading}</h2>
            <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 13, lineHeight: 1.6, margin: '0 0 22px' }}>{SLIDES[carouselIdx].sub}</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setCarouselIdx(i)} style={{ width: i === carouselIdx ? 22 : 6, height: 6, borderRadius: 100, background: i === carouselIdx ? '#A78BFA' : 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '20px 32px', gap: 10, flexShrink: 0 }}>
          <button onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, background: C.surface2, border: `1px solid ${C.border}`, color: C.muted, cursor: 'pointer' }}>
            {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 7, background: C.accent, borderRadius: 10, padding: '9px 16px', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            <DownloadIcon />Download app
          </a>
        </div>

        {/* Form */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 40px', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
            <h1 style={{ color: C.text, fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 8px', ...fadeUp(30) }}>Welcome back</h1>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 32, lineHeight: 1.6, ...fadeUp(60) }}>Sign in to continue to your dashboard.</p>

            {/* Social */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, ...fadeUp(80) }}>
              <button type="button" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: C.socialBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 16px', color: C.text, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                <GoogleIcon />Google
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, ...fadeUp(120) }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span style={{ color: C.muted, fontSize: 13 }}>Or</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 18, ...fadeUp(160) }}>
                <label style={lbl}>Email</label>
                <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" style={di} onFocus={e => (e.target.style.borderColor = C.accent)} onBlur={e => (e.target.style.borderColor = C.border)} />
              </div>

              <div style={{ marginBottom: 18, ...fadeUp(200) }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ ...lbl, marginBottom: 0 }}>Password</label>
                  <span style={{ color: C.accent, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Forgot password?</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ ...di, paddingRight: 44 }} onFocus={e => (e.target.style.borderColor = C.accent)} onBlur={e => (e.target.style.borderColor = C.border)} />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', padding: 4 }}>
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              {error && <div style={{ background: mode === 'dark' ? 'rgba(248,113,113,0.08)' : 'rgba(220,38,38,0.06)', border: `1px solid ${mode === 'dark' ? 'rgba(248,113,113,0.25)' : 'rgba(220,38,38,0.2)'}`, borderRadius: 10, padding: '12px 14px', color: C.error, fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>{error}</div>}

              <div style={fadeUp(240)}>
                <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? C.surface2 : C.submitBg, color: loading ? C.muted : C.submitText, border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 600, cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading ? <><Spinner />Signing in…</> : <>Sign In <ArrowRightIcon /></>}
                </button>
              </div>
            </form>

            <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', marginTop: 20, ...fadeUp(280) }}>
              Don't have an account?{' '}
              <span onClick={() => navigate('/register')} style={{ color: C.accent, fontWeight: 600, cursor: 'pointer' }}>Sign up</span>
            </p>
          </div>
        </div>
      </div>
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
function DownloadIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function GoogleIcon() { return <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg> }
function Spinner() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.2" /><path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg> }
