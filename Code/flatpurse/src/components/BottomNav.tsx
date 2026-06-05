import type React from 'react'
import type { Tab } from '../App'

interface NavItem { id: Tab; label: string; icon: (active: boolean) => React.ReactElement }

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
      stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinejoin="round"
      fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
    <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" />
  </svg>
)
const BookingsIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor"
      strokeWidth={active ? 2 : 1.6} fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
    <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" />
    <circle cx="8" cy="15" r="1" fill="currentColor" />
    <circle cx="12" cy="15" r="1" fill="currentColor" />
    <circle cx="16" cy="15" r="1" fill="currentColor" />
  </svg>
)
const ClientsIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={active ? 2 : 1.6}
      fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
    <path d="M2 21c0-4 3.134-7 7-7s7 3 7 7" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" />
    <path d="M19 8v6M22 11h-6" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" />
  </svg>
)
const TeamIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="6" r="3.5" stroke="currentColor" strokeWidth={active ? 2 : 1.6}
      fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
    <circle cx="5" cy="9" r="2.5" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
    <circle cx="19" cy="9" r="2.5" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
    <path d="M2 21c0-3 1.8-5 3-5M22 21c0-3-1.8-5-3-5M6 21c0-3.5 2.7-6 6-6s6 2.5 6 6"
      stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" />
  </svg>
)
const AutoPilotIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth={active ? 2 : 1.6}
      strokeLinecap="round" strokeLinejoin="round"
      fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
  </svg>
)
const OperationsIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth={active ? 2 : 1.6}
      fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth={active ? 2 : 1.6}
      fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
  </svg>
)

const NAV: NavItem[] = [
  { id: 'home',       label: 'Home',       icon: a => <HomeIcon active={a} /> },
  { id: 'bookings',   label: 'Bookings',   icon: a => <BookingsIcon active={a} /> },
  { id: 'clients',    label: 'Clients',    icon: a => <ClientsIcon active={a} /> },
  { id: 'team',       label: 'Team',       icon: a => <TeamIcon active={a} /> },
  { id: 'autopilot',  label: 'AutoPilot',  icon: a => <AutoPilotIcon active={a} /> },
  { id: 'operations', label: 'Ops',        icon: a => <OperationsIcon active={a} /> },
]

export default function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch max-w-[480px] mx-auto"
      style={{
        background: '#1A1927',
        borderTop: '1px solid #2C2A3F',
        paddingBottom: 'var(--safe-area-bottom)',
      }}
    >
      {NAV.map(item => {
        const isActive = active === item.id
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-3 border-none cursor-pointer select-none transition-all"
            style={{ background: 'none', color: isActive ? '#A8A3F5' : '#54526A', minWidth: 0 }}
          >
            <span
              className="flex items-center justify-center w-9 h-7 rounded-xl transition-all"
              style={{ background: isActive ? 'rgba(107,99,232,0.15)' : 'transparent' }}
            >
              {item.icon(isActive)}
            </span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.01em' }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
