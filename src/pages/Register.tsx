import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { palette, useIsMobile, type Mode } from '../lib/auth-ui'

// ── Desktop onboarding data ────────────────────────────────────────────────────
const BUSINESS_TYPES = [
  { emoji: '✂️', label: 'Barbershop' },
  { emoji: '👱‍♀️', label: 'Hair Salon' },
  { emoji: '💅', label: 'Nail Studio' },
  { emoji: '👁️', label: 'Lash Studio' },
  { emoji: '✨', label: 'Brow Bar' },
  { emoji: '🌿', label: 'Spa/Wellness' },
  { emoji: '🎨', label: 'Beauty Studio' },
  { emoji: '🔀', label: 'Multi-service' },
]

const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT']

const PLANS = [
  {
    id: 'starter', tier: 'STARTER', price: 'Free', priceSub: '', sub: 'Forever, no card', badge: '',
    features: ['50 appts/mo', '1 staff', 'Booking page', 'AutoPilot basic', 'Tap to Pay'],
  },
  {
    id: 'pro', tier: 'PRO', price: 'C$49', priceSub: '/mo', sub: '/month · up to 10 staff', badge: '',
    features: ['Unlimited appts', 'Full AutoPilot', 'Client Intelligence', 'SMS + Email', 'Daily Brief'],
  },
  {
    id: 'founders', tier: 'FOUNDERS', price: 'C$29', priceSub: '/mo', sub: '/month forever', badge: '⭐ Limited',
    features: ['Everything in Pro', 'Locked for life', '50 spots only', 'Founder access', 'Early features'],
  },
  {
    id: 'unlimited', tier: 'UNLIMITED', price: 'C$274', priceSub: '/mo', sub: '/month · 25+ staff', badge: '',
    features: ['Everything in Pro+', 'Multi-location', 'Custom integrations', 'White-glove onboard', 'SLA guarantee'],
  },
]

const STEP_TITLES = ['Create your account', 'Tell us about your shop', 'Choose your plan']
const STEP_SUBS = [
  'Free forever on Starter. No credit card. 60 seconds.',
  'We personalise AutoPilot and features around your business type.',
  'Start free and upgrade anytime. Founders pricing is locked forever.',
]

// ── Component ──────────────────────────────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [mode, setMode] = useState<Mode>('dark')
  const C = palette(mode)

  // Shared form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Desktop step state
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [shopName, setShopName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [businessType, setBusinessType] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState('starter')

  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => { containerRef.current?.focus() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError(null); setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 800))
      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally { setLoading(false) }
  }

  async function handleDesktopSubmit() {
    setError(null); setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 800))
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally { setLoading(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: C.inputBg, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: '13px 16px', color: C.text, fontSize: 15,
    outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
  }

  /* ── Mobile layout ────────────────────────────────────────────────────────── */
  if (isMobile) {
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
        {/* Banner */}
        <div style={{ flexShrink: 0, paddingTop: 'max(40px, calc(env(safe-area-inset-top, 0px) + 20px))', paddingLeft: 24, paddingRight: 24, paddingBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <img src="/Flatpurse flow .svg" alt="Flatpurse" style={{ height: 28, width: 'auto', filter: mode === 'dark' ? 'brightness(0) invert(1)' : 'none' }} />
            <button onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')} style={{
              width: 36, height: 36, borderRadius: 10,
              background: mode === 'dark' ? 'rgba(255,255,255,0.12)' : C.surface2,
              border: mode === 'dark' ? '1px solid rgba(255,255,255,0.2)' : `1px solid ${C.border}`,
              color: mode === 'dark' ? '#fff' : C.muted, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>

        {/* Form */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', paddingBottom: 16 }}>
          <h1 style={{ color: C.text, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>Create account</h1>
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.5, margin: '0 0 22px' }}>Enter your details to get started.</p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: C.muted, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>First Name</label>
                <input type="text" autoComplete="given-name" required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = C.accent)} onBlur={e => (e.target.style.borderColor = C.border)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: C.muted, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Last Name</label>
                <input type="text" autoComplete="family-name" required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = C.accent)} onBlur={e => (e.target.style.borderColor = C.border)} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', color: C.muted, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted, display: 'flex', pointerEvents: 'none' }}><MailIcon /></span>
                <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com"
                  style={{ ...inputStyle, paddingLeft: 44 }}
                  onFocus={e => (e.target.style.borderColor = C.accent)} onBlur={e => (e.target.style.borderColor = C.border)} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', color: C.muted, fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted, display: 'flex', pointerEvents: 'none' }}><LockIcon /></span>
                <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  style={{ ...inputStyle, paddingLeft: 44, paddingRight: 48 }}
                  onFocus={e => (e.target.style.borderColor = C.accent)} onBlur={e => (e.target.style.borderColor = C.border)} />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: 4 }}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: mode === 'dark' ? 'rgba(248,113,113,0.08)' : 'rgba(220,38,38,0.06)', border: `1px solid ${mode === 'dark' ? 'rgba(248,113,113,0.25)' : 'rgba(220,38,38,0.2)'}`, borderRadius: 10, padding: '10px 14px', color: C.error, fontSize: 13, marginBottom: 14 }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', background: loading ? C.surface2 : C.accent, color: loading ? C.muted : '#fff',
              border: 'none', borderRadius: 14, padding: '15px', fontSize: 16, fontWeight: 700,
              cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20,
            }}>
              {loading ? <><Spinner />Creating account…</> : <>Sign Up <ArrowRightIcon /></>}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ color: C.muted, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            {[{ icon: <GoogleIcon />, label: 'Google' }, { icon: <AppleIcon />, label: 'Apple' }].map(({ icon, label }) => (
              <button key={label} type="button" style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px',
                color: C.text, fontSize: 14, fontWeight: 500, cursor: 'pointer',
              }}>
                {icon}{label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ flexShrink: 0, textAlign: 'center', padding: '0 24px', paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))' }}>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 8 }}>
            Already have an account?{' '}
            <span onClick={() => navigate('/login')} style={{ color: C.accent, fontWeight: 600, cursor: 'pointer' }}>Log in</span>
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

  /* ── Desktop layout — 3-step onboarding ──────────────────────────────────── */
  const di: React.CSSProperties = {
    width: '100%', background: '#fff', border: '1.5px solid #E0DBD5',
    borderRadius: 14, padding: '15px 18px', fontSize: 15, color: '#1A1A1A',
    outline: 'none', fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  }

  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 14, fontWeight: 500, color: '#1A1A1A', marginBottom: 8,
  }

  const socialBtn: React.CSSProperties = {
    width: '100%', background: '#fff', border: '1.5px solid #E0DBD5',
    borderRadius: 100, padding: '15px', fontSize: 15, fontWeight: 500,
    color: '#1A1A1A', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: 12,
    fontFamily: "'DM Sans', sans-serif",
  }

  const continueBtn: React.CSSProperties = {
    background: '#1A1A1A', color: '#fff', border: 'none',
    borderRadius: 100, padding: '14px 32px', fontSize: 15,
    fontWeight: 600, cursor: loading ? 'default' : 'pointer',
    fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.6 : 1,
  }

  const backBtn: React.CSSProperties = {
    background: 'transparent', color: '#888', border: 'none',
    fontSize: 15, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: 0,
  }

  const focusDark = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = '#1A1A1A')
  const blurLight = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = '#E0DBD5')

  return (
    <div style={{
      minHeight: '100vh', background: '#EDE8DF',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '80px 24px 80px', boxSizing: 'border-box',
    }}>
      {/* Mode toggle */}
      <button onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')} style={{
        position: 'fixed', top: 24, right: 32, width: 36, height: 36, borderRadius: 8,
        background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)',
        color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* Step label */}
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#999', margin: '0 0 14px' }}>
          Step {step} of 3
        </p>

        {/* Heading */}
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: 46, fontWeight: 400, color: '#1A1A1A', lineHeight: 1.1, margin: '0 0 10px' }}>
          {STEP_TITLES[step - 1]}
        </h1>

        {/* Subtitle */}
        <p style={{ color: '#999', fontSize: 15, lineHeight: 1.7, margin: '0 0 40px' }}>
          {STEP_SUBS[step - 1]}
        </p>

        {/* ── Step 1: Create account ── */}
        {step === 1 && (
          <div>
            <button type="button" style={socialBtn}>
              <GoogleIcon /> Continue with Google
            </button>
            <button type="button" style={{ ...socialBtn, marginTop: 12 }}>
              <AppleIcon /> Continue with Apple
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '28px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#E0DBD5' }} />
              <span style={{ color: '#999', fontSize: 13, whiteSpace: 'nowrap' }}>or sign up with email</span>
              <div style={{ flex: 1, height: 1, background: '#E0DBD5' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={lbl}>First name</label>
                <input type="text" autoComplete="given-name" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="George" style={di} onFocus={focusDark} onBlur={blurLight} />
              </div>
              <div>
                <label style={lbl}>Last name</label>
                <input type="text" autoComplete="family-name" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Ogunbande" style={di} onFocus={focusDark} onBlur={blurLight} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Work email</label>
              <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="george@compoundcut.ca" style={di} onFocus={focusDark} onBlur={blurLight} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={lbl}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a strong password"
                  style={{ ...di, paddingRight: 72 }} onFocus={focusDark} onBlur={blurLight} />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <p style={{ color: '#999', fontSize: 13, lineHeight: 1.6, margin: '0 0 32px' }}>
              By continuing you agree to FlatPurse Flow's{' '}
              <span style={{ color: '#1A1A1A', fontWeight: 600, cursor: 'pointer' }}>Terms</span>{' '}and{' '}
              <span style={{ color: '#1A1A1A', fontWeight: 600, cursor: 'pointer' }}>Privacy Policy</span>.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setStep(2)} style={continueBtn}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── Step 2: Shop details ── */}
        {step === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={lbl}>Shop name</label>
                <input type="text" value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Compound Cut Club" style={di} onFocus={focusDark} onBlur={blurLight} />
              </div>
              <div>
                <label style={lbl}>Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 780-555-0123" style={di} onFocus={focusDark} onBlur={blurLight} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
              <div>
                <label style={lbl}>City</label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Edmonton" style={di} onFocus={focusDark} onBlur={blurLight} />
              </div>
              <div>
                <label style={lbl}>Province</label>
                <select value={province} onChange={e => setProvince(e.target.value)} onFocus={focusDark} onBlur={blurLight}
                  style={{
                    ...di, cursor: 'pointer',
                    appearance: 'none' as React.CSSProperties['appearance'],
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%23999' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                    paddingRight: 44,
                  }}>
                  <option value="">Select province</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 40 }}>
              <label style={lbl}>Business type</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                {BUSINESS_TYPES.map(({ emoji, label }) => (
                  <button key={label} type="button"
                    onClick={() => setBusinessType(label === businessType ? null : label)}
                    style={{
                      background: businessType === label ? '#1A1A1A' : '#fff',
                      color: businessType === label ? '#fff' : '#1A1A1A',
                      border: `1.5px solid ${businessType === label ? '#1A1A1A' : '#E0DBD5'}`,
                      borderRadius: 100, padding: '9px 18px', fontSize: 14,
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      transition: 'all 0.15s',
                    }}>
                    {emoji} {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: '#E0DBD5', marginBottom: 32 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" onClick={() => setStep(1)} style={backBtn}>← Back</button>
              <button type="button" onClick={() => setStep(3)} style={continueBtn}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Choose plan ── */}
        {step === 3 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              {PLANS.map(plan => (
                <div key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                  style={{
                    background: '#fff',
                    border: `${selectedPlan === plan.id ? '2px' : '1.5px'} solid ${selectedPlan === plan.id ? '#1A1A1A' : '#E0DBD5'}`,
                    borderRadius: 20, padding: 22, cursor: 'pointer', transition: 'border-color 0.15s',
                  }}>
                  {plan.badge && <p style={{ fontSize: 11, color: '#999', margin: '0 0 4px' }}>{plan.badge}</p>}
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', margin: '0 0 10px' }}>
                    {plan.tier}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 2 }}>
                    <span style={{ fontSize: 34, fontWeight: 800, color: '#1A1A1A', lineHeight: 1 }}>{plan.price}</span>
                    {plan.priceSub && <span style={{ fontSize: 14, color: '#999', marginLeft: 2 }}>{plan.priceSub}</span>}
                  </div>
                  <p style={{ fontSize: 13, color: '#999', margin: '0 0 16px' }}>{plan.sub}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#333' }}>
                        <span style={{ color: '#888', flexShrink: 0 }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div style={{
              background: '#fff', border: '1.5px solid #E0DBD5', borderRadius: 14,
              padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 32,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>ⓘ</span>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, margin: 0 }}>
                <strong style={{ color: '#1A1A1A' }}>No payment needed now.</strong>{' '}
                If you pick Starter it's free forever. Paid plans ask for payment after you finish setting up your shop.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" onClick={() => setStep(2)} style={backBtn}>← Back</button>
              <button type="button" onClick={handleDesktopSubmit} disabled={loading} style={continueBtn}>
                {loading ? 'Setting up…' : 'Get Started →'}
              </button>
            </div>
          </div>
        )}
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
function GoogleIcon() { return <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg> }
function AppleIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg> }
function Spinner() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.2" /><path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg> }
