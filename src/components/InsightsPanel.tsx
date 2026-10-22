import { Panel } from './ui'

export function InsightsPanel({ insights }: { insights: string[] }) {
  return (
    <Panel
      title="Leitura do período"
      subtitle="Observações geradas a partir dos números do dashboard"
      bodyClassName="pt-4"
    >
      {insights.length === 0 ? (
        <p className="text-xs text-mist-500">Sem dados suficientes para gerar observações.</p>
      ) : (
        <ul className="space-y-3">
          {insights.map((insight) => (
            <li key={insight} className="flex gap-2.5 text-[12.5px] leading-relaxed text-mist-300">
              <span
                className="mt-[7px] inline-block h-1 w-1 shrink-0 rounded-full bg-mint-400"
                aria-hidden="true"
              />
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
