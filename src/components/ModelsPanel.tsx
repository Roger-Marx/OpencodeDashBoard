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
import type { StatsModelUsage } from '../../shared/types'
import { buildModelRows } from '../lib/metrics'
import { formatCompact, formatInteger, formatPercent, formatUsd } from '../lib/format'
import { EmptyState, Panel } from './ui'
import { axisProps, CHART, ChartLegend, tooltipProps } from './charts/chartTheme'

const INITIAL_ROWS = 8

export function ModelsPanel({ models }: { models: StatsModelUsage[] }) {
  const [expanded, setExpanded] = useState(false)
  const rows = buildModelRows(models)
  const visible = expanded ? rows : rows.slice(0, INITIAL_ROWS)
  const chartRows = rows
    .slice(0, 8)
    .map((row) => ({
      name: row.name,
      input: row.input,
      output: row.output,
      reasoning: row.reasoning,
    }))
    .reverse()

  return (
    <Panel
      title="Modelos"
      subtitle="Ranking por passos, com distribuição de tokens"
      action={<ChartLegend items={[{ color: CHART.input, label: 'Entrada' }, { color: CHART.output, label: 'Saída' }, { color: CHART.reasoning, label: 'Raciocínio' }]} />}
      bodyClassName="space-y-5"
    >
      {rows.length === 0 ? (
        <EmptyState
          title="Nenhum modelo registrado no período"
          description="Assim que houver execuções, o ranking aparece aqui."
        />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={Math.max(160, chartRows.length * 34)}>
            <BarChart
              data={chartRows}
              layout="vertical"
              margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
              barCategoryGap={10}
            >
              <CartesianGrid stroke={CHART.grid} strokeDasharray="3 6" horizontal={false} />
              <XAxis
                type="number"
                {...axisProps}
                tickFormatter={(value: number) => formatCompact(value)}
              />
              <YAxis
                type="category"
                dataKey="name"
                {...axisProps}
                width={170}
                tick={{ fill: CHART.axis, fontSize: 11 }}
              />
              <Tooltip
                {...tooltipProps}
                formatter={(value, name) => [formatInteger(Number(value)), String(name)]}
                cursor={{ fill: 'rgb(255 255 255 / 0.04)' }}
              />
              <Bar
                dataKey="input"
                name="Entrada"
                stackId="tokens"
                fill={CHART.input}
                fillOpacity={0.85}
                maxBarSize={18}
                isAnimationActive={false}
              />
              <Bar
                dataKey="output"
                name="Saída"
                stackId="tokens"
                fill={CHART.output}
                fillOpacity={0.85}
                maxBarSize={18}
                isAnimationActive={false}
              />
              <Bar
                dataKey="reasoning"
                name="Raciocínio"
                stackId="tokens"
                fill={CHART.reasoning}
                fillOpacity={0.85}
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>

          <div className="-mx-4 overflow-x-auto sm:-mx-5">
            <table className="w-full min-w-[760px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-ink-700 text-[10px] uppercase tracking-[0.12em] text-mist-500">
                  <th className="px-4 py-2 font-medium sm:px-5">Modelo</th>
                  <th className="px-2 py-2 text-right font-medium">Passos</th>
                  <th className="px-2 py-2 text-right font-medium">Entrada</th>
                  <th className="px-2 py-2 text-right font-medium">Saída</th>
                  <th className="px-2 py-2 text-right font-medium">Raciocínio</th>
                  <th className="px-2 py-2 text-right font-medium">Cache</th>
                  <th className="px-4 py-2 text-right font-medium sm:px-5">Custo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/60">
                {visible.map((row) => (
                  <tr key={row.key} className="text-mist-300 transition-colors hover:bg-ink-850/70">
                    <td className="px-4 py-2.5 sm:px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-mist-200">{row.name}</span>
                        {row.variant !== 'default' ? (
                          <span className="rounded border border-ink-600 px-1 text-[10px] leading-4 text-mist-500">
                            {row.variant}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[11px] text-mist-500">{row.provider}</span>
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono tabular-nums text-mist-200">
                      {formatInteger(row.steps)}
                      <span className="ml-1 text-[10px] text-mist-500">
                        {formatPercent(row.share, 0)}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono tabular-nums">
                      {formatCompact(row.input)}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono tabular-nums">
                      {formatCompact(row.output)}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono tabular-nums">
                      {formatCompact(row.reasoning)}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono tabular-nums text-mist-500">
                      {formatCompact(row.cacheRead)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-mist-200 sm:px-5">
                      {formatUsd(row.cost)}
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
              {expanded
                ? 'Mostrar menos'
                : `Mostrar todos os ${formatInteger(rows.length)} modelos`}
            </button>
          ) : null}
        </>
      )}
    </Panel>
  )
}
