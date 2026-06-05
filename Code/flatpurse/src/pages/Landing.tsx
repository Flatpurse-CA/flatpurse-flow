import { useNavigate } from 'react-router-dom'

const C = {
  bg: '#09090B',
  surface: '#141417',
  border: '#27272A',
  accent: '#6B63E8',
  text: '#FAFAFA',
  muted: '#71717A',
  subtle: '#3F3F46',
}

function FlatpurseLogo({ size = 32 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size * (46 / 48)} viewBox="0 0 48 46" fill="none">
      <path
        fill="#863bff"
        d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
      />
      <path
        fill="url(#lgrad)"
        fillOpacity="0.4"
        d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
      />
      <defs>
        <linearGradient id="lgrad" x1="0" y1="0" x2="48" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ede6ff" />
          <stop offset="1" stopColor="#7e14ff" />
        </linearGradient>
      </defs>
    </svg>
  )
}

const features = [
  { icon: '📅', label: 'Smart Bookings', desc: 'Calendar, slots, and reminders — all automated.' },
  { icon: '👥', label: 'Client CRM', desc: 'Full history, tags, churn risk, and AI insights.' },
  { icon: '⚡', label: 'AutoPilot', desc: 'Rebook, winback, and upsell while you sleep.' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      fontFamily: "'DM Sans', system-ui, sans-serif",
      colorScheme: 'dark',
    }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px',
        borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(9,9,11,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FlatpurseLogo size={28} />
          <span style={{ color: C.text, fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>
            flatpurse
          </span>
        </div>

        {/* Nav actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none', border: 'none',
              color: C.muted, fontSize: 14, fontWeight: 500,
              cursor: 'pointer', padding: '8px 12px', borderRadius: 8,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = C.text)}
            onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
          >
            Sign in
          </button>

          <a
            href="https://flatpurse.vercel.app"
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: '9px 16px',
              color: C.text, fontSize: 14, fontWeight: 500,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.subtle }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border }}
          >
            <DownloadIcon />
            Download
          </a>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '120px 40px 80px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 320,
          background: 'radial-gradient(ellipse, rgba(107,99,232,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(107,99,232,0.12)',
          border: '1px solid rgba(107,99,232,0.3)',
          borderRadius: 100, padding: '6px 14px', marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent, display: 'inline-block' }} />
          <span style={{ color: '#A8A3F5', fontSize: 13, fontWeight: 500 }}>Now available for iOS & Android</span>
        </div>

        <h1 style={{
          color: C.text,
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1,
          maxWidth: 720, marginBottom: 20,
        }}>
          Run your beauty business<br />on autopilot
        </h1>

        <p style={{
          color: C.muted, fontSize: 18, lineHeight: 1.7,
          maxWidth: 500, marginBottom: 44,
        }}>
          Bookings, clients, payments, and retention — all in one place. Built for salons, studios, and wellness pros.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: C.text, color: C.bg,
              border: 'none', borderRadius: 12,
              padding: '14px 28px', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', letterSpacing: '-0.01em',
            }}
          >
            Get started free
          </button>
          <a
            href="https://flatpurse.vercel.app"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent',
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '14px 24px', fontSize: 15, fontWeight: 500,
              color: C.text, textDecoration: 'none', cursor: 'pointer',
            }}
          >
            <DownloadIcon />
            Download the app
          </a>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section style={{
        display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center',
        padding: '0 40px 100px',
        maxWidth: 960, margin: '0 auto',
      }}>
        {features.map(f => (
          <div key={f.label} style={{
            flex: '1 1 260px', maxWidth: 300,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16, padding: '28px 24px',
          }}>
            <div style={{ fontSize: 26, marginBottom: 14 }}>{f.icon}</div>
            <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, marginBottom: 8, letterSpacing: '-0.01em' }}>
              {f.label}
            </h3>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${C.border}`,
        padding: '24px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FlatpurseLogo size={18} />
          <span style={{ color: C.muted, fontSize: 13 }}>flatpurse © 2026</span>
        </div>
        <span style={{ color: C.subtle, fontSize: 13 }}>Built for beauty & wellness pros</span>
      </footer>
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
