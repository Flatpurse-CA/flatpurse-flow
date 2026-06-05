const BASE = 'https://flowapi.flatpurse.com/api'

function getToken(): string | null {
  return localStorage.getItem('fp_token')
}

export function setToken(token: string) {
  localStorage.setItem('fp_token', token)
}

export function clearToken() {
  localStorage.removeItem('fp_token')
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (res.status === 204) return undefined as T

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.title || err?.errorMessage || `HTTP ${res.status}`)
  }

  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresAtUtc: string
  accountId: string
  email: string
  firstName: string
  lastName: string
  organizationId: string
  businessName: string
  businessType: string
  success: boolean
  errorMessage: string | null
}

export interface Me {
  accountId: string
  email: string
  firstName: string
  lastName: string
  organizationId: string
  businessName: string
  businessType: string
}

export interface DailyBrief {
  date: string
  appointmentsToday: number
  revenueTodayProjected: number
  upcomingBookings: BookingDto[]
  autoPilotHighlights: string[]
  alerts: string[]
}

export interface BookingDto {
  id: string
  clientId: string
  clientName: string
  serviceId: string
  serviceName: string
  staffMemberId: string
  staffName: string
  startsAt: string
  endsAt: string
  status: BookingStatus
  price: number
  notes: string | null
  createdAt: string
}

export type BookingStatus = 'Pending' | 'Confirmed' | 'InProgress' | 'Completed' | 'Cancelled' | 'NoShow'

export interface ClientDto {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  avatarUrl: string | null
  tags: ClientTag[]
  churnRisk: ChurnRisk
  lifetimeValue: number
  visitCount: number
  lastVisitAt: string | null
  createdAt: string
}

export type ClientTag = 'VIP' | 'NewClient' | 'Inactive' | 'HighSpender' | 'FrequentCanceller'
export type ChurnRisk = 'Low' | 'Medium' | 'High'

export interface StaffDto {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  avatarUrl: string | null
  colour: string
  role: StaffRole
  isActive: boolean
  serviceIds: string[]
}

export type StaffRole = 'Owner' | 'Manager' | 'Stylist' | 'Receptionist'

export interface ServiceDto {
  id: string
  name: string
  price: number
  durationMins: number
  category: string | null
  active: boolean
  depositPct: number
  bookingCount: number
  createdAt: string
}

export interface AutoPilotStatus {
  globallyEnabled: boolean
  flows: FlowStatusDto[]
}

export interface FlowStatusDto {
  flowId: string
  name: string
  description: string
  isEnabled: boolean
  trigger: string
  action: string
}

export interface AutoPilotStats {
  slotsFilled: number
  messagesSent: number
  winbacksTriggered: number
  reviewsRequested: number
  noShowsRecovered: number
  totalRevenueRecovered: number
}

export interface AutoPilotEvent {
  id: string
  flowId: string
  flowName: string
  clientId: string
  clientName: string
  description: string
  wasSuccessful: boolean
  revenueRecovered: number | null
  createdAt: string
}

export interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface StaffPerformance {
  staffId: string
  completedBookings: number
  totalRevenue: number
  noShowCount: number
  cancelledCount: number
  totalBookings: number
  topServices: string[]
}

export interface SlotDto {
  startsAt: string
  endsAt: string
  staffId: string
  staffName: string
}
