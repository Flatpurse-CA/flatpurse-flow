import { useNavigate } from 'react-router-dom'

const C = {
  bg: '#0F0E1A',
  surface: '#1A1927',
  border: '#2C2A3F',
  accent: '#6B63E8',
  accentLight: '#A8A3F5',
  text: '#F0EEF8',
  muted: '#7A7890',
}

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div
      className="flex flex-col h-dvh max-w-[480px] mx-auto"
      style={{ background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Main content */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
        {/* Logo */}
        <div
          className="flex items-center justify-center rounded-2xl mb-6"
          style={{ width: 72, height: 72, background: C.accent }}
        >
          <span style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>f</span>
        </div>

        <h1 style={{ color: C.text, fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 10, lineHeight: 1.2 }}>
          flatpurse
        </h1>
        <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6, maxWidth: 280 }}>
          Bookings, clients, and autopilot — all in one place.
        </p>
      </div>

      {/* Bottom CTAs */}
      <div
        className="px-6 flex flex-col gap-3"
        style={{ paddingBottom: 'calc(var(--safe-area-bottom) + 40px)' }}
      >
        <button
          onClick={() => navigate('/login')}
          style={{
            width: '100%',
            background: C.accent,
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            padding: '16px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '-0.01em',
          }}
        >
          Sign in
        </button>
      </div>
    </div>
  )
}
