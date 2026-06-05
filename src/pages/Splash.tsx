import { useEffect } from 'react'

const STYLES = `
  @keyframes fp-slide-in {
    from { transform: translateX(110vw); }
    to   { transform: translateX(0); }
  }
  @keyframes fp-logo-zoom {
    from { transform: scale(1); opacity: 1; }
    75%  { transform: scale(6); opacity: 1; }
    to   { transform: scale(7); opacity: 0; }
  }
  @keyframes fp-splash-out {
    from { opacity: 1; }
    to   { opacity: 0; }
  }
`

export default function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1950)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <>
      <style>{STYLES}</style>
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'radial-gradient(ellipse 140% 55% at 50% 0%, #6D28D9 0%, #4C1D95 30%, #1E0A3C 60%, #09090B 85%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          animation: 'fp-splash-out 0.35s ease 1.6s forwards',
        }}
      >
        {/* outer div: slides the logo from right to center */}
        <div style={{ animation: 'fp-slide-in 0.65s cubic-bezier(0.22, 0.61, 0.36, 1) forwards' }}>
          {/* inner img: zooms once settled */}
          <img
            src="/Flatpurse flow .svg"
            alt="Flatpurse"
            style={{
              height: 36,
              filter: 'brightness(0) invert(1)',
              display: 'block',
              animation: 'fp-logo-zoom 0.75s cubic-bezier(0.4, 0, 0.8, 1) 0.8s forwards',
            }}
          />
        </div>
      </div>
    </>
  )
}
