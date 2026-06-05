import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { palette, useIsMobile, type Mode } from '../lib/auth-ui'
import { useAuth } from '../context/AuthContext'

const steps = [
  { n: 1, label: 'Create your account' },
  { n: 2, label: 'Set up your shop' },
  { n: 3, label: 'Choose your plan' },
]

const BUSINESS_TYPES = ['Barbershop','Hair Salon','Nail Studio','Lash Studio','Brow Bar','Spa/Wellness','Beauty Studio','Multi-service']
const PROVINCES = ['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT']
const PRICING = [
  {
    id: 'starter', name: 'Starter', price: '$0', period: '/month',
    desc: 'Ideal for solo operators and small salons',
    cta: 'Start for Free', popular: false, founders: false,
    features: ['50 appts/mo', '1 staff', 'Booking page', 'AutoPilot basic', 'Tap to Pay'],
  },
  {
    id: 'pro', name: 'Pro', price: 'C$49', period: '/month',
    desc: 'Best for growing salons and studios',
    cta: 'Sign Up with Pro', popular: true, founders: false,
    features: ['Unlimited appts', 'Full AutoPilot', 'Client Intelligence', 'SMS + Email', 'Daily Brief'],
  },
  {
    id: 'unlimited', name: 'Unlimited', price: 'C$274', period: '/month',
    desc: 'For large studios and multi-location shops',
    cta: 'Sign Up with Unlimited', popular: false, founders: false,
    features: ['Everything in Pro+', 'Multi-location', 'Custom integrations', 'White-glove onboard', 'SLA guarantee'],
  },
  {
    id: 'founders', name: 'Founders', price: 'C$29', period: '/month',
    desc: 'Pro at half price — locked in forever. 50 spots only.',
    cta: 'Claim Founders Rate', popular: false, founders: true,
    features: ['Everything in Pro', 'Price locked forever', 'Founding member badge', 'Early access features', '50 spots remaining'],
  },
]

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
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

  // Desktop step state
  const [step, setStep] = useState<1|2|3>(1)
  const [phone, setPhone] = useState('')
  const [shopName, setShopName] = useState('')
  const [businessType, setBusinessType] = useState<string|null>(null)
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('starter')
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)
  const [showDownloadModal, setShowDownloadModal] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError(null)
    setLoading(true)
    try {
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
    borderRadius: 12,
    padding: '13px 16px',
    color: C.text,
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  }

  /* ── Mobile layout ─────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div
        ref={containerRef}
        tabIndex={-1}
        style={{
          height: '100dvh',
          background: mode === 'dark'
            ? 'radial-gradient(ellipse 140% 55% at 50% 0%, #6D28D9 0%, #4C1D95 30%, #1E0A3C 60%, #09090B 85%)'
            : C.bg,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          colorScheme: mode,
          display: 'flex',
          flexDirection: 'column',
          outline: 'none',
        }}>

        {/* Banner (logo + toggle only) */}
        <div style={{
          flexShrink: 0,
          paddingTop: 'max(40px, calc(env(safe-area-inset-top, 0px) + 20px))',
          paddingLeft: 24, paddingRight: 24, paddingBottom: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <img src="/Flatpurse flow .svg" alt="Flatpurse"
              style={{ height: 28, width: 'auto', filter: mode === 'dark' ? 'brightness(0) invert(1)' : 'none' }} />
            <button onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')} style={{
              width: 36, height: 36, borderRadius: 10,
              background: mode === 'dark' ? 'rgba(255,255,255,0.12)' : C.surface2,
              border: mode === 'dark' ? '1px solid rgba(255,255,255,0.2)' : `1px solid ${C.border}`,
              color: mode === 'dark' ? '#fff' : C.muted,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>

        {/* Main content — fills remaining, centred */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', paddingBottom: 16 }}>
          <h1 style={{ color: C.text, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
            Create account
          </h1>
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.5, margin: '0 0 22px' }}>
            Enter your details to get started.
          </p>

          <form onSubmit={handleSubmit}>

            {/* First + Last name */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: C.muted, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>First Name</label>
                <input type="text" autoComplete="given-name" required
                  value={firstName} onChange={e => setFirstName(e.target.value)}
                  placeholder="John"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = C.accent)}
                  onBlur={e => (e.target.style.borderColor = C.border)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: C.muted, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Last Name</label>
                <input type="text" autoComplete="family-name" required
                  value={lastName} onChange={e => setLastName(e.target.value)}
                  placeholder="Doe"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = C.accent)}
                  onBlur={e => (e.target.style.borderColor = C.border)} />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', color: C.muted, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted, display: 'flex', pointerEvents: 'none' }}>
                  <MailIcon />
                </span>
                <input type="email" autoComplete="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{ ...inputStyle, paddingLeft: 44 }}
                  onFocus={e => (e.target.style.borderColor = C.accent)}
                  onBlur={e => (e.target.style.borderColor = C.border)} />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', color: C.muted, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted, display: 'flex', pointerEvents: 'none' }}>
                  <LockIcon />
                </span>
                <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingLeft: 44, paddingRight: 48 }}
                  onFocus={e => (e.target.style.borderColor = C.accent)}
                  onBlur={e => (e.target.style.borderColor = C.border)} />
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

            {/* Sign Up — accent + arrow */}
            <button type="submit" disabled={loading} style={{
              width: '100%',
              background: loading ? C.surface2 : C.accent,
              color: loading ? C.muted : '#fff',
              border: 'none', borderRadius: 14, padding: '15px',
              fontSize: 16, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginBottom: 20,
            }}>
              {loading ? <><Spinner />Creating account…</> : <>Sign Up <ArrowRightIcon /></>}
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

        {/* Already have account + terms — pinned to bottom */}
        <div style={{ flexShrink: 0, textAlign: 'center', padding: '0 24px', paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))' }}>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 8 }}>
            Already have an account?{' '}
            <span onClick={() => navigate('/login')} style={{ color: C.accent, fontWeight: 600, cursor: 'pointer' }}>
              Log in
            </span>
          </p>
          <p style={{ color: C.subtle, fontSize: 11, lineHeight: 1.6, margin: 0 }}>
            By continuing you agree to FlatPurse Flow's{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms</span>{' '}and{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
          </p>
        </div>
      </div>
    )
  }

  /* ── Desktop layout ─────────────────────────────────────────── */
  const di: React.CSSProperties = {
    width: '100%', background: C.inputBg, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: '13px 14px', color: C.text, fontSize: 15,
    outline: 'none', transition: 'border-color 0.15s',
  }
  const lbl: React.CSSProperties = { display: 'block', color: C.muted, fontSize: 13, fontWeight: 500, marginBottom: 8 }
  const onF = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = C.accent)
  const onB = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = C.border)

  const STEP_HEADING = ['Create an Account', 'Set Up Your Shop', 'Choose Your Plan']
  const STEP_SUB = [
    'Enter your personal data to create your account.',
    'Tell us a bit about your business.',
    'Start free and upgrade anytime.',
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif", colorScheme: mode, transition: 'background 0.2s' }}>

      {/* ── Download modal ── */}
      {showDownloadModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 420, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: '44px 40px 40px', textAlign: 'center', overflow: 'hidden' }}>
            {/* Gradient bloom behind content */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'radial-gradient(ellipse 120% 80% at 50% 100%, rgba(109,40,217,0.35) 0%, rgba(76,29,149,0.15) 50%, transparent 80%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <img src="/Flatpurse flow .svg" alt="Flatpurse" style={{ height: 28, marginBottom: 28, filter: mode === 'dark' ? 'brightness(0) invert(1)' : 'none' }} />
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 12px 32px rgba(109,40,217,0.45)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <h2 style={{ color: C.text, fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 10px' }}>You're all set!</h2>
              <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, margin: '0 0 32px' }}>
                Your account is ready. Download the Flatpurse Flow app to manage your shop, take bookings, and get paid.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="#" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: C.text, color: C.bg, borderRadius: 14, padding: '14px 20px', textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
                  <AppleIcon />Download on the App Store
                </a>
                <a href="#" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: C.surface2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 20px', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>
                  <PlayIcon />Get it on Google Play
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Left panel — step 1 only */}
      {step === 1 && (
        <div style={{ width: '45%', minWidth: 420, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '48px 44px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 60% 10%, #7C3AED 0%, #4C1D95 35%, #1A0A2E 65%, #09090B 100%)', borderRadius: 20, margin: 12 }} />
          <div style={{ position: 'absolute', inset: 0, margin: 12, borderRadius: 20, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }} />
          <div style={{ position: 'absolute', top: 44, left: 44, zIndex: 1 }}>
            <img src="/Flatpurse flow .svg" alt="Flatpurse" style={{ height: 36, width: 'auto', filter: mode === 'dark' ? 'brightness(0) invert(1)' : 'none' }} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Get Started</p>
            <h2 style={{ color: '#fff', fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 32 }}>Get Started<br />with Us</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {steps.map((s, i) => (
                <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 14, background: i === step - 1 ? C.cardActiveBg : C.cardBg, border: i === step - 1 ? 'none' : `1px solid ${C.cardBorder}`, backdropFilter: 'blur(12px)', borderRadius: 14, padding: '13px 18px' }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: i === step - 1 ? C.cardActiveNumBg : 'rgba(255,255,255,0.15)', color: i === step - 1 ? C.cardActiveNum : 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{s.n}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: i === step - 1 ? C.cardActiveText : 'rgba(255,255,255,0.7)' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', gap: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {step > 1 && (
              <img src="/Flatpurse flow .svg" alt="Flatpurse" style={{ height: 26, filter: mode === 'dark' ? 'brightness(0) invert(1)' : 'none' }} />
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, background: C.surface2, border: `1px solid ${C.border}`, color: C.muted, cursor: 'pointer' }}>
              {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 7, background: C.accent, borderRadius: 10, padding: '9px 16px', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              <DownloadIcon />Download app
            </a>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 40px', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: step === 3 ? 960 : 400 }}>
            {/* Step progress dots — steps 2 and 3 */}
            {step > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
                {steps.map((s, i) => (
                  <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: i < step - 1 ? 22 : i === step - 1 ? 22 : 8, height: 8, borderRadius: 100, background: i < step ? C.accent : 'rgba(255,255,255,0.1)', transition: 'all 0.3s ease', boxShadow: i === step - 1 ? `0 0 10px ${C.accent}` : 'none' }} />
                    </div>
                    {i < steps.length - 1 && <div style={{ width: 20, height: 1, background: i < step - 1 ? C.accent : 'rgba(255,255,255,0.1)' }} />}
                  </div>
                ))}
                <span style={{ fontSize: 12, color: C.muted, marginLeft: 4 }}>Step {step} of {steps.length}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h1 style={{ color: C.text, fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>{STEP_HEADING[step - 1]}</h1>
              {step > 1 && (
                <button onClick={() => setStep(s => (s - 1) as 1|2|3)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 14px', color: C.muted, fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Back
                </button>
              )}
            </div>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>{STEP_SUB[step - 1]}</p>

            {/* ── Step 1 ── */}
            {step === 1 && (
              <>
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                  {[{ icon: <GoogleIcon />, label: 'Google' }, { icon: <AppleIcon />, label: 'Apple' }].map(({ icon, label }) => (
                    <button key={label} type="button" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: C.socialBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 16px', color: C.text, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                      {icon}{label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                  <span style={{ color: C.muted, fontSize: 13 }}>Or</span>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>First Name</label>
                    <input type="text" autoComplete="given-name" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="eg. John" style={di} onFocus={onF} onBlur={onB} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>Last Name</label>
                    <input type="text" autoComplete="family-name" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="eg. Francisco" style={di} onFocus={onF} onBlur={onB} />
                  </div>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={lbl}>Email</label>
                  <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="eg. johnfrans@gmail.com" style={di} onFocus={onF} onBlur={onB} />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={lbl}>Phone Number</label>
                  <input type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="eg. +1 780-555-0123" style={di} onFocus={onF} onBlur={onB} />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={lbl}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" style={{ ...di, paddingRight: 44 }} onFocus={onF} onBlur={onB} />
                    <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', padding: 4 }}>
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                  <p style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Must be at least 8 characters.</p>
                </div>
                {error && <div style={{ background: mode === 'dark' ? 'rgba(248,113,113,0.08)' : 'rgba(220,38,38,0.06)', border: `1px solid ${mode === 'dark' ? 'rgba(248,113,113,0.25)' : 'rgba(220,38,38,0.2)'}`, borderRadius: 10, padding: '12px 14px', color: C.error, fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>{error}</div>}
                <button type="button" onClick={() => setStep(2)} style={{ width: '100%', background: C.submitBg, color: C.submitText, border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  Next Step <ArrowRightIcon />
                </button>
                <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', marginTop: 20 }}>
                  Already have an account?{' '}
                  <span onClick={() => navigate('/login')} style={{ color: C.accent, fontWeight: 600, cursor: 'pointer' }}>Log in</span>
                </p>
              </>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <>
                <div style={{ marginBottom: 18 }}>
                  <label style={lbl}>Shop Name</label>
                  <input type="text" value={shopName} onChange={e => setShopName(e.target.value)} placeholder="eg. Compound Cut Club" style={di} onFocus={onF} onBlur={onB} />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={lbl}>Business Type</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {BUSINESS_TYPES.map(t => (
                      <button key={t} type="button" onClick={() => setBusinessType(t === businessType ? null : t)}
                        style={{ background: businessType === t ? C.accent : C.surface2, color: businessType === t ? '#fff' : C.text, border: `1px solid ${businessType === t ? C.accent : C.border}`, borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>City</label>
                    <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="eg. Edmonton" style={di} onFocus={onF} onBlur={onB} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>Province</label>
                    <select value={province} onChange={e => setProvince(e.target.value)} onFocus={onF} onBlur={onB}
                      style={{ ...di, cursor: 'pointer', appearance: 'none' as React.CSSProperties['appearance'], backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%23888' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 36 }}>
                      <option value="">Select…</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: 26 }}>
                  <button type="button" onClick={() => setStep(3)} style={{ width: '100%', background: C.submitBg, color: C.submitText, border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    Next Step <ArrowRightIcon />
                  </button>
                </div>
              </>
            )}

            {/* ── Step 3: Pricing ── */}
            {step === 3 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 14, alignItems: 'stretch' }}>
                  {PRICING.map(plan => {
                    const sel = selectedPlan === plan.id
                    const hot = hoveredPlan === plan.id
                    const lit = sel || hot
                    const badge = plan.popular ? 'Popular' : plan.founders ? 'Limited' : null
                    const badgeColor = plan.founders ? { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.35)', text: '#FCD34D' } : { bg: 'rgba(139,92,246,0.25)', border: 'rgba(167,139,250,0.45)', text: '#C4B5FD' }
                    return (
                      <div key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        onMouseEnter={() => setHoveredPlan(plan.id)}
                        onMouseLeave={() => setHoveredPlan(null)}
                        style={{ position: 'relative', background: 'rgba(255,255,255,0.03)', border: `1px solid ${sel ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 18, padding: '22px 18px 20px', cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'border-color 0.25s', boxShadow: sel ? '0 0 0 1px rgba(124,58,237,0.3), 0 16px 48px rgba(109,40,217,0.25)' : 'none' }}>

                        {/* Bottom-bloom gradient overlay */}
                        <div style={{ position: 'absolute', inset: 0, background: plan.founders
                          ? 'radial-gradient(ellipse 140% 60% at 50% 100%, rgba(161,98,7,0.6) 0%, rgba(120,53,15,0.35) 40%, rgba(9,9,11,0) 75%)'
                          : 'radial-gradient(ellipse 140% 60% at 50% 100%, #6D28D9 0%, #4C1D95 28%, #1E0A3C 58%, rgba(9,9,11,0) 85%)', opacity: lit ? 1 : 0, transition: 'opacity 0.35s ease', pointerEvents: 'none' }} />

                        {/* Content */}
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>

                          {/* Badge */}
                          {badge ? (
                            <div style={{ alignSelf: 'flex-start', background: lit ? badgeColor.bg : 'rgba(255,255,255,0.07)', border: `1px solid ${lit ? badgeColor.border : 'rgba(255,255,255,0.12)'}`, borderRadius: 100, padding: '3px 9px', fontSize: 9, fontWeight: 700, color: lit ? badgeColor.text : C.muted, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 12, transition: 'all 0.25s' }}>
                              {badge}
                            </div>
                          ) : (
                            <div style={{ height: 21, marginBottom: 12 }} />
                          )}

                          {/* Plan name */}
                          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: lit ? 'rgba(196,181,253,0.65)' : C.muted, margin: '0 0 10px', transition: 'color 0.25s' }}>
                            {plan.name}
                          </p>

                          {/* Price */}
                          <div style={{ marginBottom: 8 }}>
                            <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: lit ? '#EDE9FE' : C.text, transition: 'color 0.25s' }}>
                              {plan.price}
                            </span>
                            <span style={{ fontSize: 11, color: lit ? 'rgba(196,181,253,0.55)' : C.muted, marginLeft: 3, transition: 'color 0.25s' }}>
                              {plan.period}
                            </span>
                          </div>

                          {/* Description */}
                          <p style={{ fontSize: 11.5, color: lit ? 'rgba(196,181,253,0.65)' : C.muted, lineHeight: 1.55, margin: '0 0 16px', minHeight: 36, transition: 'color 0.25s' }}>
                            {plan.desc}
                          </p>

                          {/* CTA — selects plan and submits */}
                          <button type="button" disabled={loading} onClick={async e => {
                            e.stopPropagation()
                            setSelectedPlan(plan.id)
                            setError(null); setLoading(true)
                            try {
                              await register({ firstName, lastName, email, password, phone, businessName: shopName, businessType: businessType ?? '', city, province, plan: plan.id })
                              setShowDownloadModal(true)
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Registration failed')
                            } finally { setLoading(false) }
                          }}
                            style={{
                              width: '100%',
                              background: loading && selectedPlan === plan.id
                                ? C.surface2
                                : lit
                                  ? plan.founders ? 'rgba(161,98,7,0.45)' : 'rgba(109,40,217,0.35)'
                                  : 'rgba(255,255,255,0.05)',
                              border: `1px solid ${lit
                                ? plan.founders ? 'rgba(217,160,30,0.65)' : 'rgba(139,92,246,0.55)'
                                : 'rgba(255,255,255,0.1)'}`,
                              color: lit ? plan.founders ? '#FDE68A' : '#E9D5FF' : C.muted,
                              borderRadius: 10, padding: '10px 0', fontSize: 12, fontWeight: 600,
                              cursor: loading ? 'default' : 'pointer', marginBottom: 16,
                              letterSpacing: '0.01em', transition: 'all 0.25s',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}>
                            {loading && selectedPlan === plan.id ? <><Spinner />Creating…</> : plan.cta}
                          </button>

                          {/* Divider */}
                          <div style={{ height: 1, background: lit ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.06)', marginBottom: 13, transition: 'background 0.25s' }} />

                          {/* Features */}
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                            {plan.features.map(f => (
                              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: lit ? 'rgba(224,213,255,0.82)' : C.muted, lineHeight: 1.3, transition: 'color 0.25s' }}>
                                <PlanCheck accent={lit} founders={plan.founders} />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {error && <div style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '11px 14px', color: C.error, fontSize: 13, marginTop: 4 }}>{error}</div>}
              </>
            )}
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
function MailIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function LockIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ArrowRightIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function SunIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg> }
function MoonIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function DownloadIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function PlayIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l14 8.5c.6.36.6 1.24 0 1.6l-14 8.5c-.66.5-1.6.03-1.6-.8z" /></svg> }
function GoogleIcon() { return <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg> }
function AppleIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg> }
function Spinner() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.2" /><path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg> }
function PlanCheck({ accent, founders }: { accent?: boolean; founders?: boolean }) {
  const fill = founders && accent ? 'rgba(161,98,7,0.3)' : accent ? 'rgba(124,58,237,0.28)' : 'rgba(255,255,255,0.06)'
  const stroke = founders && accent ? '#FCD34D' : accent ? '#A78BFA' : 'rgba(255,255,255,0.35)'
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" fill={fill} />
      <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
