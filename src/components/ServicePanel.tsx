import type { Overview } from '../../shared/types'
import { formatDateTime, formatInteger, truncate } from '../lib/format'
import { Badge, Panel } from './ui'

const sourceLabels: Record<string, string> = {
  info: 'serviço',
  stats: 'estatísticas',
  sessions: 'sessões',
  agents: 'agentes',
  active: 'sessões ativas',
  location: 'localização',
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mist-500">
        {label}
      </dt>
      <dd
        className={`mt-0.5 truncate text-xs text-mist-300 ${mono ? 'font-mono' : ''}`}
        title={value}
      >
        {value}
      </dd>
    </div>
  )
}

export function ServicePanel({ overview }: { overview: Overview }) {
  const { info, agents, active, location, sessions, errors } = overview
  const activeCount = active ? Object.keys(active).length : 0
  const primary = agents?.filter((agent) => agent.mode === 'primary').length ?? 0
  const subagents = agents?.filter((agent) => agent.mode === 'subagent').length ?? 0
  const capabilities = Object.entries(info?.capabilities ?? {})
  const tmp = info?.paths?.tmp

  return (
    <Panel
      title="Serviço"
      subtitle="Estado atual do OpenCode nesta máquina"
      action={
        <Badge tone={info ? 'mint' : 'rose'}>
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${info ? 'bg-mint-400' : 'bg-rose-400'}`}
            aria-hidden="true"
          />
          {info ? 'Online' : 'Offline'}
        </Badge>
      }
      bodyClassName="space-y-4"
    >
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <Field label="Versão" value={info?.version ?? '—'} mono />
        <Field label="PID" value={info?.pid ? formatInteger(info.pid) : '—'} mono />
        <Field label="URL" value={info?.urls?.[0] ?? '—'} mono />
        <Field label="Sessões ativas" value={formatInteger(activeCount)} mono />
        <Field
          label="Agentes"
          value={agents ? `${primary} primários · ${subagents} subagentes` : '—'}
        />
        <Field
          label="Sessões carregadas"
          value={`${formatInteger(sessions.items.length)}${sessions.truncated ? ' (limitado)' : ''}`}
          mono
        />
        <Field label="Diretório" value={location?.directory ?? '—'} mono />
        <Field label="Temporários" value={tmp ? truncate(tmp, 46) : '—'} mono />
      </dl>

      {capabilities.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mist-500">
            Capacidades
          </span>
          {capabilities.map(([key, value]) => (
            <Badge key={key} tone={value ? 'sky' : 'neutral'}>
              {key}: {String(value)}
            </Badge>
          ))}
        </div>
      ) : null}

      {errors.length > 0 ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.05] px-3 py-2.5 text-xs">
          <p className="font-semibold text-amber-200">Leitura parcial</p>
          <ul className="mt-1 space-y-0.5 text-mist-400">
            {errors.map((error) => (
              <li key={`${error.source}-${error.message}`}>
                <span className="font-mono text-[11px] text-amber-300">
                  {sourceLabels[error.source] ?? error.source}
                </span>{' '}
                — {error.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-1 border-t border-ink-700/70 pt-3 text-[11px] leading-relaxed text-mist-500">
        <p>
          Dados lidos do serviço local via <span className="font-mono text-mist-400">opencode api</span>{' '}
          e cacheados por 10 s no servidor do monitor. Nada é gravado e nenhum dado sai desta máquina.
        </p>
        <p>
          Snapshot de {formatDateTime(overview.fetchedAt)} · fuso{' '}
          <span className="font-mono text-mist-400">{overview.range.timezone ?? 'padrão do servidor'}</span>
        </p>
      </div>
    </Panel>
  )
}
