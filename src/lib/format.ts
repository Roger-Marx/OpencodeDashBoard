const compact = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

const usd = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

const dateTime = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

const dayMonth = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })

export const formatInteger = (value: number) => integer.format(Number.isFinite(value) ? value : 0)

export const formatCompact = (value: number) => compact.format(Number.isFinite(value) ? value : 0)

export const formatUsd = (value: number) => usd.format(Number.isFinite(value) ? value : 0)

export function formatPercent(ratio: number, digits = 1) {
  if (!Number.isFinite(ratio)) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(ratio)
}

export const formatDateTime = (timestamp?: number) =>
  timestamp ? dateTime.format(new Date(timestamp)) : '—'

export const formatDay = (timestamp?: number) =>
  timestamp ? dayMonth.format(new Date(timestamp)) : '—'

export function formatDuration(ms?: number) {
  if (ms === undefined || !Number.isFinite(ms)) return '—'
  if (ms < 1_000) return `${integer.format(Math.round(ms))} ms`
  if (ms < 60_000) return `${(ms / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s`
  if (ms < 3_600_000) return `${(ms / 60_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} min`
  if (ms < 86_400_000) return `${(ms / 3_600_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h`
  return `${(ms / 86_400_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} d`
}

export function formatRelative(timestamp: number, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - timestamp) / 1_000))
  if (seconds < 5) return 'agora'
  if (seconds < 60) return `há ${seconds} s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `há ${hours} h`
  return `há ${Math.round(hours / 24)} d`
}

export function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}
