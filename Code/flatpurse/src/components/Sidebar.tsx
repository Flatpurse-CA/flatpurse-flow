import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { Tab } from '../App'

const C = {
  bg: '#16151F',
  surface: '#1E1D2B',
  surface2: '#26243A',
  border: '#2C2A3F',
  accent: '#7C6EF5',
  accentGlow: 'rgba(124,110,245,0.18)',
  text: '#E8E6F4',
  muted: '#8C8AA8',
  subtle: '#3E3C55',
  green: '#34D399',
}

interface NavItem {
  id: Tab
  label: string
  icon: () => React.ReactElement
}

const NAV: NavItem[] = [
  { id: 'home',       label: 'Home',       icon: HomeIcon },
  { id: 'bookings',   label: 'Bookings',   icon: CalendarIcon },
  { id: 'clients',    label: 'Clients',    icon: UsersIcon },
  { id: 'team',       label: 'Team',       icon: TeamIcon },
  { id: 'autopilot',  label: 'AutoPilot',  icon: ZapIcon },
  { id: 'operations', label: 'Operations', icon: WrenchIcon },
]

const SECONDARY = [
  { id: 'settings', label: 'Settings',  icon: SettingsIcon },
  { id: 'help',     label: 'Help',      icon: HelpIcon },
]

interface SidebarProps {
  active: Tab
  onChange: (tab: Tab) => void
}

export default function Sidebar({ active, onChange }: SidebarProps) {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState('')

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : '?'

  const W = collapsed ? 72 : 260

  return (
    <aside style={{
      width: W,
      minWidth: W,
      height: '100vh',
      background: C.bg,
      borderRight: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
      flexShrink: 0,
    }}>

      {/* ── Logo + collapse ─────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '20px 0' : '20px 16px',
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: `linear-gradient(135deg, ${C.accent}, #9B8CF8)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <img src="/Flatpurse flow .svg" alt="" style={{ width: 18, height: 18, filter: 'brightness(0) invert(1)' }} />
            </div>
            <span style={{ color: C.text, fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              flatpurse
            </span>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: `linear-gradient(135deg, ${C.accent}, #9B8CF8)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src="/Flatpurse flow .svg" alt="" style={{ width: 18, height: 18, filter: 'brightness(0) invert(1)' }} />
          </div>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.muted, display: 'flex', alignItems: 'center',
            padding: 6, borderRadius: 8,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = C.surface2)}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <CollapseIcon />
          </button>
        )}
      </div>

      {/* ── Search ──────────────────────────────────────────── */}
      {!collapsed && (
        <div style={{ padding: '0 12px 16px', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, display: 'flex', pointerEvents: 'none' }}>
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              style={{
                width: '100%', background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '8px 12px 8px 34px',
                color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = C.accent)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.subtle, fontSize: 10, fontWeight: 600, letterSpacing: '0.02em', background: C.surface2, padding: '2px 6px', borderRadius: 5, border: `1px solid ${C.border}` }}>⌘F</span>
          </div>
        </div>
      )}

      {/* ── Main nav ────────────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: collapsed ? '0 8px' : '0 8px' }}>
        {NAV.map(item => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: isActive
                  ? `linear-gradient(135deg, rgba(124,110,245,0.28) 0%, rgba(124,110,245,0.12) 100%)`
                  : 'none',
                border: isActive ? `1px solid rgba(124,110,245,0.25)` : '1px solid transparent',
                borderRadius: 10,
                cursor: 'pointer',
                color: isActive ? C.text : C.muted,
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                marginBottom: 2,
                transition: 'background 0.15s, color 0.15s',
                textAlign: 'left',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.surface }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'none' }}
            >
              <span style={{ color: isActive ? C.accent : C.muted, display: 'flex', flexShrink: 0 }}>
                <item.icon />
              </span>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && isActive && (
                <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: C.accent, flexShrink: 0 }} />
              )}
            </button>
          )
        })}

        {/* Divider + secondary */}
        <div style={{ height: 1, background: C.border, margin: '12px 4px' }} />

        {SECONDARY.map(item => (
          <button
            key={item.id}
            title={collapsed ? item.label : undefined}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center',
              gap: 10,
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: 'none', border: '1px solid transparent', borderRadius: 10,
              cursor: 'pointer', color: C.muted, fontSize: 14, marginBottom: 2,
              whiteSpace: 'nowrap', overflow: 'hidden',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <span style={{ color: C.muted, display: 'flex', flexShrink: 0 }}><item.icon /></span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* ── Upgrade card ────────────────────────────────────── */}
      {!collapsed && (
        <div style={{ margin: '0 10px 10px', flexShrink: 0 }}>
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>✦</span>
              <span style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>Boost with AutoPilot</span>
            </div>
            <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.5, margin: '0 0 12px' }}>
              Automated reminders, rebook flows, and AI insights.
            </p>
            <button style={{
              width: '100%', background: `linear-gradient(135deg, ${C.accent}, #9B8CF8)`,
              border: 'none', borderRadius: 8, padding: '9px', color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}

      {/* ── Expand button when collapsed ────────────────────── */}
      {collapsed && (
        <div style={{ padding: '0 8px 12px', flexShrink: 0 }}>
          <button
            onClick={() => setCollapsed(false)}
            title="Expand sidebar"
            style={{
              width: '100%', background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '10px 0', color: C.muted,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = C.surface2)}
            onMouseLeave={e => (e.currentTarget.style.background = C.surface)}
          >
            <ExpandIcon />
          </button>
        </div>
      )}

      {/* ── User profile ────────────────────────────────────── */}
      <div style={{
        borderTop: `1px solid ${C.border}`,
        padding: collapsed ? '12px 8px' : '12px 12px',
        flexShrink: 0,
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
        cursor: 'pointer',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: `linear-gradient(135deg, ${C.accent}55, ${C.accent}88)`,
          border: `1px solid ${C.accent}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 12,
        }}>
          {initials}
        </div>
        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: C.text, fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.firstName ? `${user.firstName} ${user.lastName}` : 'My Account'}
              </div>
              <div style={{ color: C.muted, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email ?? ''}
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); logout() }}
              title="Sign out"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: 4, borderRadius: 6, flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.background = C.surface2 }}
              onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'none' }}
            >
              <LogoutIcon />
            </button>
          </>
        )}
      </div>
    </aside>
  )
}

/* ── Icons ────────────────────────────────────────────────── */
function HomeIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function CalendarIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function UsersIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function TeamIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2a5 5 0 110 10A5 5 0 0112 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ZapIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function WrenchIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function SettingsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8"/></svg> }
function HelpIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg> }
function SearchIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function CollapseIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ExpandIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function LogoutIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
