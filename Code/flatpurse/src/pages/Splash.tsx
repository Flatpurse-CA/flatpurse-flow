import { useEffect, useRef } from 'react'

const STYLES = `
  @keyframes fp-reveal {
    from { clip-path: inset(0 0 0 100%); }
    to   { clip-path: inset(0 0 0 0%);   }
  }
  @keyframes fp-zoom {
    from { transform: scale(1);  opacity: 1; }
    75%  { transform: scale(20); opacity: 1; }
    to   { transform: scale(35); opacity: 0; }
  }
  @keyframes fp-out {
    to { opacity: 0; pointer-events: none; }
  }
`

export default function Splash({ onDone }: { onDone: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Must remove overflow:hidden from wrapper before zoom fires,
    // otherwise the scale is clipped to the original logo bounds.
    const t1 = setTimeout(() => {
      if (wrapRef.current) wrapRef.current.style.overflow = 'visible'
    }, 1950)
    const t2 = setTimeout(onDone, 3500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
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
          animation: 'fp-out 0.5s ease 2.9s forwards',
        }}
      >
        {/* wrapper: overflow hidden during reveal, switched to visible before zoom */}
        <div ref={wrapRef} style={{ overflow: 'hidden', display: 'inline-block' }}>
          <img
            src="/Flatpurse flow .svg"
            alt="Flatpurse"
            style={{
              height: 40,
              filter: 'brightness(0) invert(1)',
              display: 'block',
              clipPath: 'inset(0 0 0 100%)',
              animation: [
                'fp-reveal 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.25s forwards',
                'fp-zoom   0.9s cubic-bezier(0.55, 0, 1, 0.45)  2.0s forwards',
              ].join(', '),
            }}
          />
        </div>
      </div>
    </>
  )
}
