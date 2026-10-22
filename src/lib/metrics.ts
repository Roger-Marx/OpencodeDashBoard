import type {
  Overview,
  SessionSummary,
  StatsModelUsage,
  StatsToolUsage,
  TokenCounts,
} from '../../shared/types'
import { formatCompact, formatDuration, formatInteger, formatPercent, formatUsd } from './format'

export const EMPTY_TOKENS: TokenCounts = {
  input: 0,
  output: 0,
  reasoning: 0,
  cache: { read: 0, write: 0 },
}

const DAY_MS = 86_400_000
const WEEK_MS = DAY_MS * 7
const DAILY_LIMIT_DAYS = 120

export type SeriesPoint = {
  date: string
  label: string
  steps: number
  sessions: number
  input: number
  output: number
  reasoning: number
  cacheRead: number
  cost: number
  cumulativeCost: number
}

export type Series = {
  bucket: 'day' | 'week'
  points: SeriesPoint[]
}

export function sumTokens(items: Array<TokenCounts | undefined>): TokenCounts {
  return items.reduce<TokenCounts>(
    (acc, item) => {
      if (!item) return acc
      return {
        input: acc.input + (item.input ?? 0),
        output: acc.output + (item.output ?? 0),
        reasoning: acc.reasoning + (item.reasoning ?? 0),
        cache: {
          read: acc.cache.read + (item.cache?.read ?? 0),
          write: acc.cache.write + (item.cache?.write ?? 0),
        },
      }
    },
    { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
  )
}

export function totalTokens(tokens: TokenCounts) {
  return (tokens.input ?? 0) + (tokens.output ?? 0) + (tokens.reasoning ?? 0)
}

export function cacheHitRate(tokens: TokenCounts) {
  const cached = tokens.cache?.read ?? 0
  const denominator = (tokens.input ?? 0) + cached
  return denominator > 0 ? cached / denominator : 0
}

export function toolSuccessRate(totals: { succeeded: number; calls: number }) {
  return totals.calls > 0 ? totals.succeeded / totals.calls : 0
}

function dayStart(timestamp: number) {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date
}

function dayKey(timestamp: number) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shortLabel(timestamp: number) {
  const date = new Date(timestamp)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}`
}

type BucketAccumulator = {
  steps: number
  sessions: number
  input: number
  output: number
  reasoning: number
  cacheRead: number
  cost: number
}

function emptyBucket(): BucketAccumulator {
  return { steps: 0, sessions: 0, input: 0, output: 0, reasoning: 0, cacheRead: 0, cost: 0 }
}

/**
 * Builds a per-day (or per-week for long ranges) series. Steps come from the server
 * aggregate; tokens and cost are grouped by the session creation day, which is the
 * finest granularity the session list exposes.
 */
export function buildSeries(
  range: { from: number; to: number },
  sessions: SessionSummary[],
  activity: Array<{ date: string; steps: number }>,
): Series {
  const start = dayStart(Math.min(range.from, range.to))
  const end = dayStart(Math.max(range.from, range.to))
  const spanDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1)
  const bucket: Series['bucket'] = spanDays > DAILY_LIMIT_DAYS ? 'week' : 'day'
  const size = bucket === 'week' ? WEEK_MS : DAY_MS

  const stepsByDay = new Map(activity.map((entry) => [entry.date, entry.steps]))
  const buckets = new Map<number, BucketAccumulator>()

  const bucketStart = (timestamp: number) => {
    const offset = Math.floor((dayStart(timestamp).getTime() - start.getTime()) / size)
    return start.getTime() + Math.max(0, offset) * size
  }

  const ensure = (timestamp: number) => {
    const key = bucketStart(timestamp)
    let entry = buckets.get(key)
    if (!entry) {
      entry = emptyBucket()
      buckets.set(key, entry)
    }
    return entry
  }

  for (const session of sessions) {
    const created = session.time?.created
    if (!created || created < start.getTime() || created > end.getTime() + DAY_MS) continue
    const entry = ensure(created)
    entry.sessions += 1
    entry.input += session.tokens?.input ?? 0
    entry.output += session.tokens?.output ?? 0
    entry.reasoning += session.tokens?.reasoning ?? 0
    entry.cacheRead += session.tokens?.cache?.read ?? 0
    entry.cost += session.cost ?? 0
  }

  for (const [date, steps] of stepsByDay) {
    const timestamp = new Date(`${date}T12:00:00`).getTime()
    if (Number.isNaN(timestamp)) continue
    if (timestamp < start.getTime() || timestamp > end.getTime() + DAY_MS) continue
    ensure(timestamp).steps += steps
  }

  const points: SeriesPoint[] = []
  let cumulativeCost = 0
  for (let cursor = start.getTime(); cursor <= end.getTime(); cursor += size) {
    const entry = buckets.get(cursor) ?? emptyBucket()
    cumulativeCost += entry.cost
    points.push({
      date: dayKey(cursor),
      label: shortLabel(cursor),
      steps: entry.steps,
      sessions: entry.sessions,
      input: entry.input,
      output: entry.output,
      reasoning: entry.reasoning,
      cacheRead: entry.cacheRead,
      cost: entry.cost,
      cumulativeCost,
    })
  }

  return { bucket, points }
}

export type ModelRow = {
  key: string
  name: string
  provider: string
  variant: string
  steps: number
  input: number
  output: number
  reasoning: number
  cacheRead: number
  tokens: number
  cost: number
  share: number
}

export function buildModelRows(models: StatsModelUsage[]): ModelRow[] {
  const totalSteps = models.reduce((sum, item) => sum + item.steps, 0)
  return models
    .map<ModelRow>((item) => ({
      key: `${item.model.providerID}/${item.model.id}/${item.model.variant ?? 'default'}`,
      name: item.model.id,
      provider: item.model.providerID,
      variant: item.model.variant ?? 'default',
      steps: item.steps,
      input: item.tokens?.input ?? 0,
      output: item.tokens?.output ?? 0,
      reasoning: item.tokens?.reasoning ?? 0,
      cacheRead: item.tokens?.cache?.read ?? 0,
      tokens: totalTokens(item.tokens ?? EMPTY_TOKENS),
      cost: item.cost ?? 0,
      share: totalSteps > 0 ? item.steps / totalSteps : 0,
    }))
    .sort((a, b) => b.steps - a.steps)
}

export type ToolRow = {
  name: string
  calls: number
  succeeded: number
  failed: number
  unfinished: number
  successRate: number
  durationP50?: number
}

export function buildToolRows(usage: StatsToolUsage[]): ToolRow[] {
  return usage
    .map<ToolRow>((tool) => ({
      name: tool.name,
      calls: tool.calls,
      succeeded: tool.succeeded,
      failed: tool.failed,
      unfinished: tool.unfinished,
      successRate: tool.calls > 0 ? tool.succeeded / tool.calls : 0,
      durationP50: tool.durationP50,
    }))
    .sort((a, b) => b.calls - a.calls)
}

export type AgentRow = {
  agent: string
  sessions: number
  tokens: number
  cost: number
  lastUsed: number
  lastTitle?: string
}

export function buildAgentRows(sessions: SessionSummary[]): AgentRow[] {
  const rows = new Map<string, AgentRow>()

  for (const session of sessions) {
    const agent = session.agent ?? 'desconhecido'
    const row = rows.get(agent) ?? {
      agent,
      sessions: 0,
      tokens: 0,
      cost: 0,
      lastUsed: 0,
    }
    row.sessions += 1
    row.tokens += totalTokens(session.tokens ?? EMPTY_TOKENS) + (session.tokens?.cache?.read ?? 0)
    row.cost += session.cost ?? 0
    const touched = session.time?.updated ?? session.time?.created ?? 0
    if (touched > row.lastUsed) {
      row.lastUsed = touched
      row.lastTitle = session.title
    }
    rows.set(agent, row)
  }

  return [...rows.values()].sort((a, b) => b.sessions - a.sessions || b.lastUsed - a.lastUsed)
}

function topBy<T>(items: T[], pick: (item: T) => number): T | undefined {
  return items.reduce<T | undefined>((best, item) => {
    if (!best) return item
    return pick(item) > pick(best) ? item : best
  }, undefined)
}

export function buildInsights(overview: Overview, series: Series): string[] {  const { stats, sessions } = overview
  const insights: string[] = []
  const sessionCount = stats?.sessions ?? sessions.items.length
  const steps = stats?.steps ?? series.points.reduce((sum, point) => sum + point.steps, 0)
  const activeDays = stats?.activeDays ?? series.points.filter((point) => point.steps > 0).length

  if (sessionCount > 0 || steps > 0) {
    const streak = stats?.streak ? ` A sequência atual é de ${formatInteger(stats.streak)} dias.` : ''
    insights.push(
      `${formatInteger(sessionCount)} sessões e ${formatInteger(steps)} passos em ${formatInteger(activeDays)} dias ativos.${streak}`,
    )
  }

  const models = buildModelRows(stats?.models ?? [])
  const topModel = models[0]
  if (topModel) {
    insights.push(
      `${topModel.name} lidera com ${formatInteger(topModel.steps)} passos (${formatPercent(topModel.share)}), ${formatCompact(topModel.input)} tokens de entrada e ${formatCompact(topModel.cacheRead)} de cache lido.`,
    )
  }

  const tools = buildToolRows(stats?.tools?.usage ?? [])
  const topTool = tools[0]
  if (topTool) {
    insights.push(
      `${topTool.name} é a ferramenta mais chamada: ${formatInteger(topTool.calls)} chamadas com ${formatPercent(topTool.successRate)} de sucesso e mediana de ${formatDuration(topTool.durationP50)}.`,
    )
  }

  const mostFailures = topBy(tools, (tool) => tool.failed)
  if (mostFailures && mostFailures.failed > 0) {
    const rate = mostFailures.calls > 0 ? mostFailures.failed / mostFailures.calls : 0
    insights.push(
      `${mostFailures.name} concentra as falhas: ${formatInteger(mostFailures.failed)} de ${formatInteger(mostFailures.calls)} chamadas (${formatPercent(rate)}).`,
    )
  }

  if (stats) {
    const rate = cacheHitRate(stats.tokens)
    if (stats.tokens.cache.read > 0) {
      insights.push(
        `O cache respondeu por ${formatPercent(rate)} dos tokens de contexto lidos: ${formatCompact(stats.tokens.cache.read)} vindos do cache contra ${formatCompact(stats.tokens.input)} de entrada nova.`,
      )
    }

    if (stats.cost > 0) {
      insights.push(`Custo registrado no período: ${formatUsd(stats.cost)}.`)
    } else {
      const sessionCost = sessions.items.reduce((sum, item) => sum + (item.cost ?? 0), 0)
      insights.push(
        sessionCost > 0
          ? `Custo registrado pelas sessões do período: ${formatUsd(sessionCost)}.`
          : 'Nenhum custo registrado no período: os modelos usados não cobraram por token.',
      )
    }
  }

  const peak = topBy(series.points, (point) => point.steps)
  if (peak && peak.steps > 0) {
    insights.push(
      `${peak.label} foi o dia mais ativo, com ${formatInteger(peak.steps)} passos${series.bucket === 'week' ? ' na semana' : ''}.`,
    )
  }

  const agents = buildAgentRows(sessions.items)
  const topAgent = agents[0]
  if (topAgent) {
    insights.push(
      `${topAgent.agent} foi o agente mais usado, em ${formatInteger(topAgent.sessions)} sessões.`,
    )
  }

  return insights
}
