import { useMemo, useState } from 'react'
import { buildInsights, buildSeries } from './lib/metrics'
import { useOverview } from './lib/useOverview'
import type { ApiError } from './lib/useOverview'
import { ActivityChart } from './components/charts/ActivityChart'
import { CostChart } from './components/charts/CostChart'
import { TokenChart } from './components/charts/TokenChart'
import { AgentsPanel } from './components/AgentsPanel'
import { InsightsPanel } from './components/InsightsPanel'
import { KpiGrid } from './components/KpiGrid'
import { ModelsPanel } from './components/ModelsPanel'
import { ServicePanel } from './components/ServicePanel'
import { SessionsPanel } from './components/SessionsPanel'
import { ToolsPanel } from './components/ToolsPanel'
import { TopBar } from './components/TopBar'
import { Notice, Panel, Skeleton, Spinner } from './components/ui'

export default function App() {
  const [days, setDays] = useState(30)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { data, error, loading, refreshing, refresh } = useOverview(days, autoRefresh)

  const series = useMemo(
    () => (data ? buildSeries(data.range, data.sessions.items, data.stats?.activity ?? []) : null),
    [data],
  )

  const insights = useMemo(
    () => (data && series ? buildInsights(data, series) : []),
    [data, series],
  )

  return (
    <div className="min-h-screen pb-10">
      <TopBar
        days={days}
        onDaysChange={setDays}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
        refreshing={refreshing}
        onRefresh={refresh}
        online={Boolean(data?.info) && !loading}
        version={data?.info?.version}
        fetchedAt={data?.fetchedAt}
      />

      <main className="mx-auto max-w-[1440px] space-y-4 px-4 py-5 lg:px-8">
        {loading && !data ? <LoadingState /> : null}

        {!loading && !data && error ? (
          <StartError error={error} onRetry={refresh} retrying={refreshing} />
        ) : null}

        {data ? (
          <>
            {error ? (
              <Notice tone="rose" title="Atualização falhou">
                <p>{error.message}</p>
                {error.hint ? <p className="mt-1 font-mono text-[11px]">{error.hint}</p> : null}
                <p className="mt-1">Os números abaixo são do último snapshot bem-sucedido.</p>
              </Notice>
            ) : null}

            {data.errors.length > 0 ? (
              <Notice tone="amber" title="Alguns indicadores não puderam ser lidos">
                <p>
                  {data.errors.map((item) => item.source).join(', ')} falhou nesta atualização. Os
                  demais painéis continuam válidos.
                </p>
              </Notice>
            ) : null}

            <KpiGrid overview={data} />

            <div className="grid gap-4 xl:grid-cols-3">
              <div className="xl:col-span-2">{series ? <ActivityChart series={series} /> : null}</div>
              <InsightsPanel insights={insights} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {series ? <TokenChart series={series} /> : null}
              {series ? <CostChart series={series} /> : null}
            </div>

            <ModelsPanel models={data.stats?.models ?? []} />

            <div className="grid gap-4 xl:grid-cols-2">
              <ToolsPanel usage={data.stats?.tools?.usage ?? []} />
              <AgentsPanel sessions={data.sessions.items} />
            </div>

            <SessionsPanel sessions={data.sessions.items} active={data.active} />

            <ServicePanel overview={data} />

            <footer className="flex flex-wrap items-center justify-between gap-2 px-1 pt-2 text-[11px] text-mist-500">
              <span>
                OpenCode Monitor · roda apenas em localhost · dados via{' '}
                <span className="font-mono">opencode api</span>
              </span>
              <span className="font-mono">
                snapshot {new Date(data.fetchedAt).toLocaleString('pt-BR')}
              </span>
            </footer>
          </>
        ) : null}
      </main>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-mist-400">
        <Spinner className="h-3.5 w-3.5" />
        Lendo o serviço do OpenCode…
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="card-surface space-y-2 px-4 py-3.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-2.5 w-28" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card-surface h-[340px] xl:col-span-2" />
        <div className="card-surface h-[340px]" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-surface h-[360px]" />
        <div className="card-surface h-[360px]" />
      </div>
    </div>
  )
}

function StartError({
  error,
  onRetry,
  retrying,
}: {
  error: ApiError
  onRetry: () => void
  retrying: boolean
}) {
  return (
    <div className="mx-auto mt-10 max-w-xl">
      <Panel title="Serviço indisponível" subtitle="O monitor não conseguiu ler o OpenCode local">
        <div className="space-y-4">
          <Notice tone="rose" title={error.message}>
            {error.hint ? <p className="font-mono text-[11px]">{error.hint}</p> : null}
          </Notice>

          <div className="text-xs leading-relaxed text-mist-400">
            <p className="font-medium text-mist-300">Verifique estes pontos:</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4">
              <li>
                o CLI está no PATH:{' '}
                <span className="font-mono text-mist-300">opencode --version</span>
              </li>
              <li>
                o serviço está saudável:{' '}
                <span className="font-mono text-mist-300">opencode service status</span>
              </li>
              <li>o monitor continua rodando com `npm run dev`</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="inline-flex items-center gap-2 rounded-lg border border-mint-500/40 bg-mint-500/10 px-3 py-1.5 text-xs font-medium text-mint-300 transition-colors hover:bg-mint-500/15 disabled:opacity-60"
          >
            {retrying ? <Spinner className="h-3.5 w-3.5" /> : null}
            Tentar de novo
          </button>
        </div>
      </Panel>
    </div>
  )
}
