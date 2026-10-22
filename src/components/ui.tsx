import type { ReactNode } from 'react'

type PanelProps = {
  title: string
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

export function Panel({ title, subtitle, action, children, className, bodyClassName }: PanelProps) {
  return (
    <section className={`card-surface flex min-w-0 flex-col ${className ?? ''}`}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-700/70 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-mist-200">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs leading-relaxed text-mist-500">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className={`min-w-0 flex-1 px-4 py-4 sm:px-5 ${bodyClassName ?? ''}`}>{children}</div>
    </section>
  )
}

type BadgeTone = 'neutral' | 'mint' | 'sky' | 'amber' | 'rose' | 'violet'

const badgeTones: Record<BadgeTone, string> = {
  neutral: 'border-ink-600 bg-ink-800 text-mist-300',
  mint: 'border-mint-500/30 bg-mint-500/10 text-mint-300',
  sky: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  rose: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  violet: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5 ${badgeTones[tone]} ${className ?? ''}`}
    >
      {children}
    </span>
  )
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink-700 px-6 py-8 text-center">
      <p className="text-sm font-medium text-mist-300">{title}</p>
      {description ? <p className="max-w-md text-xs text-mist-500">{description}</p> : null}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-ink-700/60 ${className ?? 'h-4 w-full'}`} />
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`animate-spin ${className ?? 'h-4 w-4'}`}
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Notice({
  tone = 'amber',
  title,
  children,
}: {
  tone?: 'amber' | 'rose' | 'neutral'
  title: string
  children?: ReactNode
}) {
  const tones = {
    amber: 'border-amber-500/25 bg-amber-500/[0.06] text-amber-200',
    rose: 'border-rose-500/30 bg-rose-500/[0.07] text-rose-200',
    neutral: 'border-ink-600 bg-ink-850 text-mist-300',
  }
  return (
    <div className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${tones[tone]}`}>
      <p className="text-[13px] font-semibold">{title}</p>
      {children ? <div className="mt-1 text-mist-400">{children}</div> : null}
    </div>
  )
}

export function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-ink-700 px-6 text-center text-xs text-mist-500">
      {message}
    </div>
  )
}
