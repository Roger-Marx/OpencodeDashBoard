import { useEffect, useState } from 'react'
import { formatRelative } from '../lib/format'
import { Spinner } from './ui'

const RANGES = [
  { days: 7, label: '7 d' },
  { days: 30, label: '30 d' },
  { days: 90, label: '90 d' },
  { days: 0, label: 'Tudo' },
]

type TopBarProps = {
  days: number
  onDaysChange: (days: number) => void
  autoRefresh: boolean
  onAutoRefreshChange: (value: boolean) => void
  refreshing: boolean
  onRefresh: () => void
  online: boolean
  version?: string
  fetchedAt?: number
}

export function TopBar({
  days,
  onDaysChange,
  autoRefresh,
  onAutoRefreshChange,
  refreshing,
  onRefresh,
  online,
  version,
  fetchedAt,
}: TopBarProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10_000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-ink-700/70 bg-ink-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-2.5 lg:px-8">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl border border-mint-500/30 bg-mint-500/10"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="M5 18V7.2c0-.4.5-.6.8-.3L12 13l6.2-6.1c.3-.3.8-.1.8.3V18"
                stroke="#5eead4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="18" r="1.6" fill="#5eead4" />
            </svg>
          </span>
          <div>
            <h1 className="text-[15px] font-semibold leading-tight tracking-tight text-white">
              OpenCode Monitor
            </h1>
            <p className="text-[11px] leading-tight text-mist-500">
              Atividade, tokens e ferramentas do serviço local
            </p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
              online
                ? 'border-mint-500/30 bg-mint-500/10 text-mint-300'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
            }`}
            title={fetchedAt ? `Atualizado ${formatRelative(fetchedAt, now)}` : undefined}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                online ? 'bg-mint-400' : 'bg-rose-400'
              }`}
              aria-hidden="true"
            />
            {online ? `Online${version ? ` · v${version}` : ''}` : 'Offline'}
          </span>

          {fetchedAt ? (
            <span className="hidden text-[11px] text-mist-500 sm:inline">
              {formatRelative(fetchedAt, now)}
            </span>
          ) : null}

          <div
            role="group"
            aria-label="Período do dashboard"
            className="flex rounded-lg border border-ink-700 bg-ink-900/80 p-0.5"
          >
            {RANGES.map((range) => {
              const active = range.days === days
              return (
                <button
                  key={range.days}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onDaysChange(range.days)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    active
                      ? 'bg-mint-500/15 text-mint-300'
                      : 'text-mist-400 hover:bg-ink-800 hover:text-mist-200'
                  }`}
                >
                  {range.label}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            aria-pressed={autoRefresh}
            onClick={() => onAutoRefreshChange(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
              autoRefresh
                ? 'border-mint-500/30 bg-mint-500/10 text-mint-300'
                : 'border-ink-700 bg-ink-900/80 text-mist-400 hover:text-mist-200'
            }`}
            title="Atualiza automaticamente a cada 30 segundos"
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                autoRefresh ? 'bg-mint-400' : 'bg-mist-500'
              }`}
              aria-hidden="true"
            />
            Auto 30 s
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-900/80 px-2.5 py-1.5 text-[11px] font-medium text-mist-300 transition-colors hover:border-ink-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? <Spinner className="h-3.5 w-3.5" /> : <RefreshIcon />}
            Atualizar
          </button>
        </div>
      </div>
    </header>
  )
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path
        d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
