import { useState, useEffect } from 'react'

export type Mode = 'dark' | 'light'

export function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

export function palette(mode: Mode) {
  if (mode === 'dark') return {
    bg: '#09090B',
    surface: '#141417',
    surface2: '#1C1C21',
    border: '#27272A',
    accent: '#6B63E8',
    text: '#FAFAFA',
    muted: '#71717A',
    subtle: '#3F3F46',
    error: '#F87171',
    inputBg: '#141417',
    socialBg: 'transparent',
    socialHover: '#1C1C21',
    submitBg: '#FAFAFA',
    submitText: '#09090B',
    cardActiveBg: 'rgba(255,255,255,0.95)',
    cardActiveText: '#09090B',
    cardActiveNumBg: '#09090B',
    cardActiveNum: '#fff',
    cardBg: 'rgba(255,255,255,0.08)',
    cardBorder: 'rgba(255,255,255,0.12)',
  }
  return {
    bg: '#F8F8F8',
    surface: '#FFFFFF',
    surface2: '#F1F1F3',
    border: '#E4E4E7',
    accent: '#6B63E8',
    text: '#09090B',
    muted: '#71717A',
    subtle: '#A1A1AA',
    error: '#DC2626',
    inputBg: '#FFFFFF',
    socialBg: 'transparent',
    socialHover: '#F4F4F5',
    submitBg: '#09090B',
    submitText: '#FAFAFA',
    cardActiveBg: '#09090B',
    cardActiveText: '#FFFFFF',
    cardActiveNumBg: '#FFFFFF',
    cardActiveNum: '#09090B',
    cardBg: 'rgba(0,0,0,0.05)',
    cardBorder: 'rgba(0,0,0,0.08)',
  }
}
