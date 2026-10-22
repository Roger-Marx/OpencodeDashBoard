import type { SessionSummary } from '../../shared/types'
import { buildAgentRows } from '../lib/metrics'
import { formatCompact, formatDateTime, formatInteger, formatUsd, truncate } from '../lib/format'
import { EmptyState, Panel } from './ui'

export function AgentsPanel({ sessions }: { sessions: SessionSummary[] }) {
  const rows = buildAgentRows(sessions)
  const total = rows.reduce((sum, row) => sum + row.sessions, 0)

  return (
    <Panel
      title="Agentes"
      subtitle="Sessões por agente, agrupadas pela criação da sessão"    >
      {rows.length === 0 ? (
        <EmptyState title="Nenhuma sessão no período" />
      ) : (
        <div className="-mx-4 overflow-x-auto sm:-mx-5">
          <table className="w-full min-w-[520px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-ink-700 text-[10px] uppercase tracking-[0.12em] text-mist-500">
                <th className="px-4 py-2.5 font-medium sm:px-5">Agente</th>
                <th className="px-2 py-2.5 text-right font-medium">Sessões</th>
                <th className="px-2 py-2.5 text-right font-medium">Tokens</th>
                <th className="px-2 py-2.5 text-right font-medium">Custo</th>
                <th className="px-4 py-2.5 text-right font-medium sm:px-5">Última atividade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-700/60">
              {rows.map((row) => {
                const share = total > 0 ? row.sessions / total : 0
                return (
                  <tr key={row.agent} className="transition-colors hover:bg-ink-850/70">
                    <td className="px-4 py-2.5 sm:px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] font-medium text-mist-200">
                          {row.agent}
                        </span>
                        <span className="text-[10px] text-mist-500">
                          {formatInteger(Math.round(share * 100))}%
                        </span>
                      </div>
                      {row.lastTitle ? (
                        <span className="text-[11px] text-mist-500">
                          {truncate(row.lastTitle, 46)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono tabular-nums text-mist-200">
                      {formatInteger(row.sessions)}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono tabular-nums text-mist-300">
                      {formatCompact(row.tokens)}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono tabular-nums text-mist-300">
                      {formatUsd(row.cost)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-mist-500 sm:px-5">
                      {formatDateTime(row.lastUsed)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
