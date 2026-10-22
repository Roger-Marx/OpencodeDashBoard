import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Series } from '../../lib/metrics'
import { formatInteger } from '../../lib/format'
import { EmptyChart, Panel } from '../ui'
import { axisProps, CHART, ChartLegend, tooltipProps } from './chartTheme'

export function ActivityChart({ series }: { series: Series }) {
  const empty = !series.points.some((point) => point.steps > 0 || point.sessions > 0)
  const bucketLabel = series.bucket === 'week' ? 'semana' : 'dia'

  return (
    <Panel
      title="Atividade"
      subtitle={`Passos e sessões iniciadas por ${bucketLabel}`}
      action={
        <ChartLegend
          items={[
            { color: CHART.steps, label: 'Passos' },
            { color: CHART.sessions, label: 'Sessões' },
          ]}
        />
      }
      bodyClassName="pt-5"
    >
      {empty ? (
        <EmptyChart message="Nenhuma atividade registrada no período." />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={series.points} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
            <CartesianGrid stroke={CHART.grid} strokeDasharray="3 6" vertical={false} />
            <XAxis dataKey="label" {...axisProps} minTickGap={24} interval="preserveStartEnd" />
            <YAxis
              {...axisProps}
              allowDecimals={false}
              tickFormatter={(value: number) => formatInteger(value)}
            />
            <YAxis
              yAxisId="sessions"
              orientation="right"
              {...axisProps}
              allowDecimals={false}
              width={36}
              tickFormatter={(value: number) => formatInteger(value)}
            />
            <Tooltip
              {...tooltipProps}
              formatter={(value, name) => [formatInteger(Number(value)), String(name)]}
              cursor={{ fill: 'rgb(255 255 255 / 0.04)' }}
            />
            <Bar
              dataKey="steps"
              name="Passos"
              fill={CHART.steps}
              fillOpacity={0.75}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
              isAnimationActive={false}
            />
            <Line
              yAxisId="sessions"
              type="monotone"
              dataKey="sessions"
              name="Sessões"
              stroke={CHART.sessions}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Panel>
  )
}
