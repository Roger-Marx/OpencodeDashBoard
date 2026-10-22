export const CHART = {
  grid: '#1b2333',
  axis: '#7c8799',
  steps: '#5eead4',
  sessions: '#60a5fa',
  input: '#38bdf8',
  output: '#a78bfa',
  reasoning: '#fbbf24',
  cache: '#22d3ee',
  cost: '#34d399',
  succeeded: '#2dd4bf',
  failed: '#fb7185',
  unfinished: '#fbbf24',
}

export const axisProps = {
  tick: { fill: CHART.axis, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: CHART.grid },
}

export const tooltipProps = {
  contentStyle: {
    background: '#0e131d',
    border: '1px solid #263145',
    borderRadius: 12,
    padding: '8px 10px',
    fontSize: 12,
    boxShadow: '0 16px 40px rgb(0 0 0 / 0.5)',
  },
  labelStyle: { color: '#aab4c4', fontSize: 11, marginBottom: 4 },
  itemStyle: { color: '#ccd4e0', fontSize: 12, padding: 0 },
  cursor: { fill: 'rgb(255 255 255 / 0.04)' },
}

export function ChartLegend({ items }: { items: Array<{ color: string; label: string }> }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-mist-400">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-sm"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </span>
      ))}
    </div>
  )
}
