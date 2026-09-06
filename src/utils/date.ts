import type { Timestamp } from 'firebase/firestore'

export function getEndOfDay(date = new Date()): Date {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

export function formatDateTime(value?: Date | Timestamp | null): string {
  if (!value) return '—'
  const date = value instanceof Date ? value : value.toDate()
  return new Intl.DateTimeFormat('uk-UA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatDate(value: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('uk-UA', { dateStyle: 'long' }).format(new Date(`${value}T12:00:00`))
}
