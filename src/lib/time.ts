import type { DayOfWeek } from '../types'

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
export const DAY_LABELS_LONG = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

/** JS Date.getDay() is 0=Sun..6=Sat. Convert to our 0=Mon..6=Sun. */
export function jsDayToDow(jsDay: number): DayOfWeek {
  return ((jsDay + 6) % 7) as DayOfWeek
}

export function todayDow(d = new Date()): DayOfWeek {
  return jsDayToDow(d.getDay())
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function fromMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function formatTime(time: string): string {
  return time
}

/** Format an ISO date string ("2026-06-28") to a local Date at midnight. */
export function isoToday(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
