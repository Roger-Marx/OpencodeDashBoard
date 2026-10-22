import type { Overview } from '../../shared/types'
import { cacheHitRate, toolSuccessRate, totalTokens } from '../lib/metrics'
import { formatCompact, formatInteger, formatPercent, formatUsd } from '../lib/format'

type KpiProps = {
  label: string
  value: string
  title?: string
  hint?: string
  accent: string
}

function Kpi({ label, value, title, hint, accent }: KpiProps) {
  return (
    <div className="card-surface relative overflow-hidden px-4 py-3.5">
      <span
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
        aria-hidden="true"
      />
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-500">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: accent }}
          aria-hidden="true"
        />
        {label}
      </p>
      <p
        className="mt-1.5 font-mono text-[26px] font-semibold leading-none tabular-nums text-mist-200"
        title={title}
      >
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-[11px] leading-snug text-mist-500">{hint}</p> : null}
    </div>
  )
}

export function KpiGrid({ overview }: { overview: Overview }) {
  const stats = overview.stats
  const tokens = stats?.tokens
  const tools = stats?.tools?.totals
  const sessionCost = overview.sessions.items.reduce((sum, item) => sum + (item.cost ?? 0), 0)
  const cost = stats?.cost && stats.cost > 0 ? stats.cost : sessionCost

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <Kpi
        label="Sessões"
        value={formatInteger(stats?.sessions ?? overview.sessions.items.length)}
        hint={
          stats?.subagents
            ? `${formatInteger(stats.subagents)} subagentes no período`
            : 'Sessões iniciadas no período'
        }
        accent="#5eead4"
      />
      <Kpi
        label="Passos"
        value={formatInteger(stats?.steps ?? 0)}
        hint={`${formatInteger(stats?.prompts ?? 0)} prompts · ${formatInteger(stats?.activeDays ?? 0)} dias ativos`}
        accent="#60a5fa"
      />
      <Kpi
        label="Tokens"
        value={formatCompact(tokens ? totalTokens(tokens) : 0)}
        title={formatInteger(tokens ? totalTokens(tokens) : 0)}
        hint={
          tokens
            ? `${formatCompact(tokens.input)} entrada · ${formatCompact(tokens.output)} saída · ${formatCompact(tokens.reasoning)} raciocínio`
            : 'Sem dados de tokens'
        }
        accent="#a78bfa"
      />
      <Kpi
        label="Cache lido"
        value={formatCompact(tokens?.cache.read ?? 0)}
        title={formatInteger(tokens?.cache.read ?? 0)}
        hint={tokens ? `${formatPercent(cacheHitRate(tokens))} do contexto veio do cache` : '—'}
        accent="#22d3ee"
      />
      <Kpi
        label="Custo"
        value={formatUsd(cost)}
        hint={cost > 0 ? 'Custo estimado no período' : 'Sem cobrança no período'}
        accent="#34d399"
      />
      <Kpi
        label="Ferramentas"
        value={formatInteger(tools?.calls ?? 0)}
        hint={
          tools
            ? `${formatPercent(toolSuccessRate(tools))} de sucesso · ${formatInteger(tools.failed)} falhas`
            : 'Sem chamadas registradas'
        }
        accent="#fbbf24"
      />
    </div>
  )
}
