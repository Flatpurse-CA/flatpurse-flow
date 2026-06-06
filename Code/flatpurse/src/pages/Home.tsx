import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface Booking {
  id: string
  client_id: string | null
  service_id: string | null
  staff_id: string | null
  starts_at: string
  ends_at: string
  status: string
  price: number | null
  clients: { first_name: string; last_name: string } | null
  services: { name: string } | null
  staff: { first_name: string; last_name: string } | null
}

interface DashboardData {
  appointmentsToday: number
  revenueToday: number
  upcomingBookings: Booking[]
  autopilotHighlights: string[]
}

function useDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function load() {
      if (!user) return
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      const [bookingsRes, paymentsRes, autopilotRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*, clients(first_name, last_name), services(name), staff(first_name, last_name)')
          .eq('profile_id', user.id)
          .gte('starts_at', todayStart.toISOString())
          .lte('starts_at', todayEnd.toISOString())
          .order('starts_at', { ascending: true }),
        supabase
          .from('payments')
          .select('amount')
          .eq('profile_id', user.id)
          .gte('created_at', todayStart.toISOString())
          .lte('created_at', todayEnd.toISOString()),
        supabase
          .from('autopilot_events')
          .select('description, revenue_recovered')
          .eq('profile_id', user.id)
          .gte('created_at', todayStart.toISOString())
          .order('created_at', { ascending: false })
          .limit(3),
      ])

      const bookings: Booking[] = (bookingsRes.data ?? []) as Booking[]
      const payments = paymentsRes.data ?? []
      const events = autopilotRes.data ?? []

      const revenueToday = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0)
      const highlights = events
        .map(e => e.description)
        .filter(Boolean) as string[]

      setData({
        appointmentsToday: bookings.length,
        revenueToday,
        upcomingBookings: bookings,
        autopilotHighlights: highlights,
      })
      setLoading(false)
    }

    load()
  }, [user])

  return { data, loading }
}

const C = {
  bg: '#12111E',
  surface: '#1A1927',
  surface2: '#211F30',
  border: '#2C2A3F',
  accent: '#7C6EF5',
  accentSoft: 'rgba(124,110,245,0.15)',
  text: '#E8E6F4',
  muted: '#8C8AA8',
  subtle: '#54526A',
  green: '#34D399',
  greenSoft: 'rgba(52,211,153,0.12)',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(amount)
}

function statusColor(status: string) {
  switch (status) {
    case 'Confirmed': return '#7C6EF5'
    case 'Completed': return '#34D399'
    case 'Cancelled':
    case 'NoShow': return '#F87171'
    case 'InProgress': return '#FBBF24'
    default: return C.muted
  }
}

function BookingCard({ booking }: { booking: Booking }) {
  const clientName = booking.clients
    ? `${booking.clients.first_name} ${booking.clients.last_name}`
    : 'Walk-in'
  const service = booking.services?.name ?? '—'
  const staffName = booking.staff
    ? `${booking.staff.first_name} ${booking.staff.last_name}`
    : ''

  return (
    <div style={{
      background: C.surface2,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: C.accentSoft,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 16 }}>💇</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{clientName}</div>
        <div style={{ color: C.muted, fontSize: 12 }}>{service}{staffName ? ` · ${staffName}` : ''}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{formatTime(booking.starts_at)}</div>
        <div style={{
          marginTop: 3,
          fontSize: 10, fontWeight: 600,
          color: statusColor(booking.status),
          background: `${statusColor(booking.status)}18`,
          borderRadius: 6, padding: '2px 7px',
          display: 'inline-block',
        }}>{booking.status}</div>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '28px 16px',
      color: C.subtle, fontSize: 13,
    }}>
      {message}
    </div>
  )
}

export default function Home() {
  const { data, loading } = useDashboard()

  return (
    <div style={{
      padding: '24px 28px 0',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: C.text,
    }}>
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <StatCard
          label="Appointments"
          value={loading ? '—' : String(data?.appointmentsToday ?? 0)}
          sub="today"
          icon="📅"
          soft={C.accentSoft}
        />
        <StatCard
          label="Revenue"
          value={loading ? '—' : formatCurrency(data?.revenueToday ?? 0)}
          sub="today"
          icon="💰"
          soft={C.greenSoft}
        />
      </div>

      {/* Today's Schedule */}
      <Section label="Today's Schedule">
        {loading ? (
          <SkeletonList />
        ) : data?.upcomingBookings.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.upcomingBookings.map(b => <BookingCard key={b.id} booking={b} />)}
          </div>
        ) : (
          <EmptyState message="No appointments scheduled for today." />
        )}
      </Section>

      {/* AutoPilot Highlights */}
      {!!data?.autopilotHighlights.length && (
        <Section label="AutoPilot">
          <div style={{
            background: C.surface2,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            overflow: 'hidden',
          }}>
            {data.autopilotHighlights.map((h, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px',
                borderBottom: i < data.autopilotHighlights.length - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                <span style={{ fontSize: 14 }}>⚡</span>
                <span style={{ color: C.muted, fontSize: 13 }}>{h}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div style={{ height: 16 }} />
    </div>
  )
}

function StatCard({ label, value, sub, icon, soft }: {
  label: string; value: string; sub: string; icon: string; soft: string
}) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: '16px 14px',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: soft,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 12, fontSize: 18,
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{label} <span style={{ color: C.subtle }}>{sub}</span></div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
        {label}
      </h2>
      {children}
    </div>
  )
}

function SkeletonList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          background: C.surface2, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', gap: 14, alignItems: 'center',
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: C.border }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 12, width: '55%', background: C.border, borderRadius: 6, marginBottom: 8 }} />
            <div style={{ height: 10, width: '35%', background: C.border, borderRadius: 6 }} />
          </div>
          <div style={{ width: 48, height: 32, background: C.border, borderRadius: 8 }} />
        </div>
      ))}
    </div>
  )
}
