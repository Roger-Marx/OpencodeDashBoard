import { useMemo, useState } from 'react'
import type { SessionSummary } from '../../shared/types'
import { totalTokens } from '../lib/metrics'
import { formatCompact, formatDateTime, formatDuration, formatUsd, truncate } from '../lib/format'
import { EmptyState, Panel } from './ui'

const INITIAL_ROWS = 8
const EXPANDED_ROWS = 50

export function SessionsPanel({
  sessions,
  active,
}: {
  sessions: SessionSummary[]
  active: Record<string, { type: string }> | null
}) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    const sorted = [...sessions].sort((a, b) => b.time.created - a.time.created)
    if (!search) return sorted
    return sorted.filter((session) =>
      [session.title, session.agent, session.model?.id, session.id, session.location?.directory]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search)),
    )
  }, [sessions, query])

  const visible = expanded ? filtered.slice(0, EXPANDED_ROWS) : filtered.slice(0, INITIAL_ROWS)
  const activeCount = active ? Object.keys(active).length : 0

  return (
    <Panel
      title="Sessões recentes"
      subtitle={
        activeCount > 0
          ? `${activeCount} em execução agora · ${filtered.length} iniciadas no período`
          : `${filtered.length} sessões iniciadas no período`
      }
      action={
        <label className="relative block">
          <span className="sr-only">Buscar sessões</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar título, agente, modelo…"
            className="w-56 rounded-lg border border-ink-600 bg-ink-950/70 px-2.5 py-1.5 text-xs text-mist-200 placeholder:text-mist-500 focus:border-mint-500/60 focus:outline-none"
          />
        </label>
      }
    >
      {filtered.length === 0 ? (
        <EmptyState
          title={query ? 'Nenhuma sessão corresponde à busca' : 'Nenhuma sessão no período'}
          description={query ? 'Tente outro termo.' : 'Use o OpenCode neste período para popular a tabela.'}
        />
      ) : (
        <>
          <div className="-mx-4 overflow-x-auto sm:-mx-5">
            <table className="w-full min-w-[820px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-ink-700 text-[10px] uppercase tracking-[0.12em] text-mist-500">
                  <th className="px-4 py-2 font-medium sm:px-5">Sessão</th>
                  <th className="px-2 py-2 font-medium">Agente</th>
                  <th className="px-2 py-2 font-medium">Modelo</th>
                  <th className="px-2 py-2 text-right font-medium">Tokens</th>
                  <th className="px-2 py-2 text-right font-medium">Custo</th>
                  <th className="px-2 py-2 text-right font-medium">Duração</th>
                  <th className="px-4 py-2 text-right font-medium sm:px-5">Início</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/60">
                {visible.map((session) => {
                  const running = Boolean(active?.[session.id])
                  const duration = (session.time.updated ?? session.time.created) - session.time.created
                  return (
                    <tr key={session.id} className="transition-colors hover:bg-ink-850/70">
                      <td className="max-w-[340px] px-4 py-2.5 sm:px-5">
                        <div className="flex items-center gap-2">
                          {running ? (
                            <span
                              className="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-mint-400"
                              title="Em execução"
                            />
                          ) : null}
                          <span
                            className="truncate font-medium text-mist-200"
                            title={session.title ?? session.id}
                          >
                            {session.title ?? 'Sem título'}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-mist-500" title={session.id}>
                          {truncate(session.id, 30)}
                          {session.location?.directory ? ` · ${truncate(session.location.directory, 34)}` : ''}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 font-mono text-[11px] text-mist-300">
                        {session.agent ?? '—'}
                      </td>
                      <td className="px-2 py-2.5">
                        <span className="font-mono text-[11px] text-mist-300">
                          {session.model?.id ?? '—'}
                        </span>
                        {session.model?.providerID ? (
                          <span className="block text-[10px] text-mist-500">
                            {session.model.providerID}
                          </span>
                        ) : null}
                      </td>
                      <td
                        className="px-2 py-2.5 text-right font-mono tabular-nums text-mist-300"
                        title={
                          session.tokens
                            ? `${session.tokens.input} entrada · ${session.tokens.output} saída · ${session.tokens.reasoning} raciocínio`
                            : undefined
                        }
                      >
                        {session.tokens ? formatCompact(totalTokens(session.tokens)) : '—'}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono tabular-nums text-mist-300">
                        {formatUsd(session.cost ?? 0)}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono tabular-nums text-mist-500">
                        {formatDuration(duration)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-mist-500 sm:px-5">
                        {formatDateTime(session.time.created)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filtered.length > INITIAL_ROWS ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-3 text-xs font-medium text-mint-400 transition-colors hover:text-mint-300"
            >
              {expanded ? 'Mostrar menos' : `Mostrar até ${EXPANDED_ROWS} sessões`}
            </button>
          ) : null}
        </>
      )}
    </Panel>
  )
}
