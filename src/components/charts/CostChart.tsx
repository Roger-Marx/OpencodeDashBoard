import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Series } from '../../lib/metrics'
import { formatUsd } from '../../lib/format'
import { EmptyChart, Panel } from '../ui'
import { axisProps, CHART, tooltipProps } from './chartTheme'

export function CostChart({ series }: { series: Series }) {
  const total = series.points.at(-1)?.cumulativeCost ?? 0
  const hasCost = series.points.some((point) => point.cost > 0)

  return (
    <Panel
      title="Custo acumulado"
      subtitle="Somatório das sessões iniciadas no período"
      action={
        <span className="font-mono text-sm tabular-nums text-mist-300">{formatUsd(total)}</span>
      }
      bodyClassName="pt-5"
    >
      {hasCost ? (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={series.points} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART.cost} stopOpacity={0.35} />
                <stop offset="100%" stopColor={CHART.cost} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART.grid} strokeDasharray="3 6" vertical={false} />
            <XAxis dataKey="label" {...axisProps} minTickGap={24} interval="preserveStartEnd" />
            <YAxis
              {...axisProps}
              tickFormatter={(value: number) => formatUsd(value)}
              width={66}
            />
            <Tooltip
              {...tooltipProps}
              formatter={(value) => [formatUsd(Number(value)), 'Acumulado']}
              cursor={{ stroke: CHART.grid }}
            />
            <Area
              type="monotone"
              dataKey="cumulativeCost"
              name="Acumulado"
              stroke={CHART.cost}
              strokeWidth={2}
              fill="url(#costFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChart message="Nenhum custo registrado no período: os modelos usados não cobram por token." />
      )}
    </Panel>
  )
}
