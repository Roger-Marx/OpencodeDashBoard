import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Series } from '../../lib/metrics'
import { formatCompact, formatInteger } from '../../lib/format'
import { EmptyChart, Panel } from '../ui'
import { axisProps, CHART, ChartLegend, tooltipProps } from './chartTheme'

export function TokenChart({ series }: { series: Series }) {
  const empty = !series.points.some(
    (point) => point.input + point.output + point.reasoning > 0,
  )
  const bucketLabel = series.bucket === 'week' ? 'semana' : 'dia'

  return (
    <Panel
      title="Tokens por tipo"
      subtitle={`Sessões agrupadas pela data de criação, por ${bucketLabel}`}
      action={
        <ChartLegend
          items={[
            { color: CHART.input, label: 'Entrada' },
            { color: CHART.output, label: 'Saída' },
            { color: CHART.reasoning, label: 'Raciocínio' },
          ]}
        />
      }
      bodyClassName="pt-5"
    >
      {empty ? (
        <EmptyChart message="Nenhuma sessão iniciada no período registrou tokens." />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={series.points} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={CHART.grid} strokeDasharray="3 6" vertical={false} />
            <XAxis dataKey="label" {...axisProps} minTickGap={24} interval="preserveStartEnd" />
            <YAxis
              {...axisProps}
              tickFormatter={(value: number) => formatCompact(value)}
              width={52}
            />
            <Tooltip
              {...tooltipProps}
              formatter={(value, name) => [formatInteger(Number(value)), String(name)]}
            />
            <Bar
              dataKey="input"
              name="Entrada"
              stackId="tokens"
              fill={CHART.input}
              fillOpacity={0.85}
              maxBarSize={28}
              isAnimationActive={false}
            />
            <Bar
              dataKey="output"
              name="Saída"
              stackId="tokens"
              fill={CHART.output}
              fillOpacity={0.85}
              maxBarSize={28}
              isAnimationActive={false}
            />
            <Bar
              dataKey="reasoning"
              name="Raciocínio"
              stackId="tokens"
              fill={CHART.reasoning}
              fillOpacity={0.85}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Panel>
  )
}
