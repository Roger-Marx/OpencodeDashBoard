import { describe, expect, it } from 'vitest'
import type { Overview, SessionSummary, StatsData } from '../../shared/types'
import {
  buildAgentRows,
  buildInsights,
  buildModelRows,
  buildSeries,
  buildToolRows,
  cacheHitRate,
  totalTokens,
} from './metrics'

const at = (day: number, hour = 10) => new Date(2026, 9, day, hour).getTime()

function session(overrides: Partial<SessionSummary> & { created: number }): SessionSummary {
  const { created, ...rest } = overrides
  return {
    id: `ses_${created}`,
    agent: 'build',
    model: { id: 'modelo-a', providerID: 'provedor' },
    cost: 0,
    tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
    time: { created, updated: created },
    title: 'Sessão de teste',
    ...rest,
  }
}

const tokens = (input: number, output: number, reasoning: number, cacheRead = 0) => ({
  input,
  output,
  reasoning,
  cache: { read: cacheRead, write: 0 },
})

describe('buildSeries', () => {
  it('agrupa sessões por dia de criação e acumula custo', () => {
    const series = buildSeries(
      { from: at(19, 0), to: at(21, 23) },
      [
        session({ created: at(20), tokens: tokens(100, 50, 10, 5), cost: 0.5 }),
        session({ created: at(21), tokens: tokens(10, 2, 1), cost: 0.25 }),
      ],
      [
        { date: '2026-10-20', steps: 7 },
        { date: '2026-10-21', steps: 3 },
      ],
    )

    expect(series.bucket).toBe('day')
    expect(series.points).toHaveLength(3)
    expect(series.points[1]).toMatchObject({
      steps: 7,
      sessions: 1,
      input: 100,
      output: 50,
      reasoning: 10,
      cacheRead: 5,
      cost: 0.5,
      cumulativeCost: 0.5,
    })
    expect(series.points[2]).toMatchObject({
      steps: 3,
      sessions: 1,
      cost: 0.25,
      cumulativeCost: 0.75,
    })
  })

  it('usa semanas quando o período passa de 120 dias', () => {
    const series = buildSeries(
      { from: new Date(2026, 0, 1).getTime(), to: new Date(2026, 5, 30).getTime() },
      [],
      [],
    )

    expect(series.bucket).toBe('week')
    expect(series.points.length).toBeLessThan(30)
    expect(series.points.length).toBeGreaterThan(20)
  })

  it('ignora sessões fora do período', () => {
    const series = buildSeries(
      { from: at(20, 0), to: at(20, 23) },
      [session({ created: at(19), tokens: tokens(999, 0, 0) })],
      [],
    )

    expect(series.points).toHaveLength(1)
    expect(series.points[0]?.input).toBe(0)
  })
})

describe('token helpers', () => {
  it('soma os tipos e calcula a taxa de cache', () => {
    expect(totalTokens(tokens(100, 20, 5))).toBe(125)
    expect(cacheHitRate(tokens(100, 0, 0, 900))).toBeCloseTo(0.9)
    expect(cacheHitRate(tokens(0, 0, 0, 0))).toBe(0)
  })
})

describe('buildAgentRows', () => {
  it('ordena por sessões e soma tokens com cache', () => {
    const rows = buildAgentRows([
      session({ created: at(20), agent: 'build', tokens: tokens(10, 5, 1, 100), cost: 1 }),
      session({ created: at(21, 12), agent: 'build', tokens: tokens(5, 5, 1, 50), cost: 2 }),
      session({ created: at(19), agent: 'plan', tokens: tokens(1000, 0, 0), cost: 0 }),
    ])

    expect(rows[0]?.agent).toBe('build')
    expect(rows[0]?.sessions).toBe(2)
    expect(rows[0]?.tokens).toBe(177)
    expect(rows[0]?.cost).toBe(3)
    expect(rows[0]?.lastUsed).toBe(at(21, 12))
    expect(rows[1]?.agent).toBe('plan')
  })

  it('usa "desconhecido" quando a sessão não informa agente', () => {
    const rows = buildAgentRows([session({ created: at(20), agent: undefined })])
    expect(rows[0]?.agent).toBe('desconhecido')
  })
})

describe('buildModelRows', () => {
  it('calcula participação nos passos e ordena', () => {
    const rows = buildModelRows([
      {
        model: { id: 'a', providerID: 'p' },
        steps: 30,
        tokens: tokens(10, 5, 1),
        cost: 0.1,
      },
      {
        model: { id: 'b', providerID: 'p', variant: 'low' },
        steps: 10,
        tokens: tokens(1, 1, 1),
        cost: 0,
      },
    ])

    expect(rows[0]?.name).toBe('a')
    expect(rows[0]?.share).toBeCloseTo(0.75)
    expect(rows[1]?.variant).toBe('low')
    expect(rows[0]?.tokens).toBe(16)
  })
})

describe('buildToolRows', () => {
  it('calcula taxa de sucesso e ordena por chamadas', () => {
    const rows = buildToolRows([
      { name: 'shell', calls: 10, succeeded: 9, failed: 1, unfinished: 0, durationP50: 200 },
      { name: 'read', calls: 20, succeeded: 20, failed: 0, unfinished: 0, durationP50: 7 },
    ])

    expect(rows[0]?.name).toBe('read')
    expect(rows[0]?.successRate).toBe(1)
    expect(rows[1]?.successRate).toBeCloseTo(0.9)
  })
})

describe('buildInsights', () => {
  const range = { from: at(20, 0), to: at(21, 23) }
  const stats: StatsData = {
    range,
    sessions: 2,
    subagents: 0,
    prompts: 4,
    steps: 10,
    tokens: tokens(100, 20, 5, 900),
    cost: 0,
    activeDays: 2,
    streak: 2,
    tools: {
      mode: 'detail',
      totals: { calls: 10, succeeded: 9, failed: 1, unfinished: 0 },
      usage: [
        { name: 'shell', calls: 10, succeeded: 9, failed: 1, unfinished: 0, durationP50: 380 },
      ],
    },
    activity: [
      { date: '2026-10-20', steps: 7 },
      { date: '2026-10-21', steps: 3 },
    ],
    models: [
      {
        model: { id: 'modelo-a', providerID: 'provedor' },
        steps: 10,
        tokens: tokens(100, 20, 5),
        cost: 0,
      },
    ],
  }

  const overview: Overview = {
    fetchedAt: at(21, 23),
    range: { ...range, days: 7, timezone: null },
    info: { version: '2.1.2' },
    stats,
    sessions: {
      items: [
        session({ created: at(20), tokens: tokens(100, 20, 5) }),
        session({ created: at(21), tokens: tokens(10, 2, 1) }),
      ],
      truncated: false,
    },
    agents: null,
    active: null,
    location: null,
    errors: [],
  }

  it('descreve atividade, liderança de modelo, cache e pico', () => {
    const series = buildSeries(overview.range, overview.sessions.items, stats.activity)
    const insights = buildInsights(overview, series).join('\n')

    expect(insights).toContain('2 sessões e 10 passos em 2 dias ativos')
    expect(insights).toContain('modelo-a lidera com 10 passos')
    expect(insights).toContain('90%')
    expect(insights).toContain('20/10 foi o dia mais ativo')
    expect(insights).toContain('Nenhum custo registrado')
    expect(insights).toContain('shell concentra as falhas')
  })
})
