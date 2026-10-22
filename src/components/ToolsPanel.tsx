import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { StatsToolUsage } from '../../shared/types'
import { buildToolRows } from '../lib/metrics'
import { formatDuration, formatInteger, formatPercent } from '../lib/format'
import { EmptyState, Panel } from './ui'
import { axisProps, CHART, ChartLegend, tooltipProps } from './charts/chartTheme'

const INITIAL_ROWS = 10

export function ToolsPanel({ usage }: { usage: StatsToolUsage[] }) {
  const [expanded, setExpanded] = useState(false)
  const rows = buildToolRows(usage)
  const visible = expanded ? rows : rows.slice(0, INITIAL_ROWS)
  const chartRows = rows.slice(0, 8).map((row) => ({
    name: row.name,
    succeeded: row.succeeded,
    failed: row.failed,
    unfinished: row.unfinished,
  }))

  return (
    <Panel
      title="Ferramentas"
      subtitle="Chamadas por ferramenta, com resultado e mediana de duração"
      action={
        <ChartLegend
          items={[
            { color: CHART.succeeded, label: 'Sucesso' },
            { color: CHART.failed, label: 'Falha' },
            { color: CHART.unfinished, label: 'Incompleta' },
          ]}
        />
      }
      bodyClassName="space-y-5"
    >
      {rows.length === 0 ? (
        <EmptyState
          title="Nenhuma chamada de ferramenta no período"
          description="Ferramentas aparecem quando o agente executa ações."
        />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={chartRows}
              layout="vertical"
              margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
              barCategoryGap={8}
            >
              <CartesianGrid stroke={CHART.grid} strokeDasharray="3 6" horizontal={false} />
              <XAxis
                type="number"
                {...axisProps}
                allowDecimals={false}
                tickFormatter={(value: number) => formatInteger(value)}
              />
              <YAxis type="category" dataKey="name" {...axisProps} width={90} />
              <Tooltip
                {...tooltipProps}
                formatter={(value, name) => [formatInteger(Number(value)), String(name)]}
                cursor={{ fill: 'rgb(255 255 255 / 0.04)' }}
              />
              <Bar
                dataKey="succeeded"
                name="Sucesso"
                stackId="calls"
                fill={CHART.succeeded}
                fillOpacity={0.8}
                maxBarSize={18}
                isAnimationActive={false}
              />
              <Bar
                dataKey="failed"
                name="Falha"
                stackId="calls"
                fill={CHART.failed}
                fillOpacity={0.9}
                maxBarSize={18}
                isAnimationActive={false}
              />
              <Bar
                dataKey="unfinished"
                name="Incompleta"
                stackId="calls"
                fill={CHART.unfinished}
                fillOpacity={0.9}
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>

          <div className="-mx-4 overflow-x-auto sm:-mx-5">
            <table className="w-full min-w-[560px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-ink-700 text-[10px] uppercase tracking-[0.12em] text-mist-500">
                  <th className="px-4 py-2 font-medium sm:px-5">Ferramenta</th>
                  <th className="px-2 py-2 text-right font-medium">Chamadas</th>
                  <th className="px-2 py-2 text-right font-medium">Sucesso</th>
                  <th className="px-2 py-2 text-right font-medium">Falhas</th>
                  <th className="px-4 py-2 text-right font-medium sm:px-5">p50</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/60">
                {visible.map((row) => (
                  <tr key={row.name} className="transition-colors hover:bg-ink-850/70">
                    <td className="px-4 py-2 font-mono text-[12px] text-mist-200 sm:px-5">
                      {row.name}
                    </td>
                    <td className="px-2 py-2 text-right font-mono tabular-nums text-mist-300">
                      {formatInteger(row.calls)}
                    </td>
                    <td className="px-2 py-2 text-right font-mono tabular-nums text-mist-300">
                      {formatPercent(row.successRate)}
                    </td>
                    <td
                      className={`px-2 py-2 text-right font-mono tabular-nums ${
                        row.failed > 0 ? 'text-rose-300' : 'text-mist-500'
                      }`}
                    >
                      {formatInteger(row.failed)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums text-mist-500 sm:px-5">
                      {formatDuration(row.durationP50)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length > INITIAL_ROWS ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="text-xs font-medium text-mint-400 transition-colors hover:text-mint-300"
            >
              {expanded ? 'Mostrar menos' : `Mostrar todas as ${formatInteger(rows.length)} ferramentas`}
            </button>
          ) : null}
        </>
      )}
    </Panel>
  )
}
