export type TokenCounts = {
  input: number
  output: number
  reasoning: number
  cache: { read: number; write: number }
}

export type StatsToolUsage = {
  name: string
  calls: number
  succeeded: number
  failed: number
  unfinished: number
  durationP50?: number
}

export type StatsModelUsage = {
  model: { id: string; providerID: string; variant?: string }
  steps: number
  tokens: TokenCounts
  cost: number
}

export type StatsData = {
  range: { from: number; to: number }
  sessions: number
  subagents: number
  prompts: number
  steps: number
  tokens: TokenCounts
  cost: number
  activeDays: number
  streak: number
  tools?: {
    mode: string
    totals: { calls: number; succeeded: number; failed: number; unfinished: number }
    usage: StatsToolUsage[]
  }
  activity: Array<{ date: string; steps: number }>
  models: StatsModelUsage[]
}

export type SessionSummary = {
  id: string
  projectID?: string
  agent?: string
  model?: { id: string; providerID: string; variant?: string }
  cost?: number
  tokens?: TokenCounts
  outcome?: string
  title?: string
  time: { created: number; updated?: number; idle?: number }
  location?: { directory?: string }
}

export type AgentSummary = {
  id: string
  name: string
  description?: string
  mode?: string
  hidden?: boolean
}

export type ServerInfo = {
  version?: string
  pid?: number
  urls?: string[]
  paths?: Record<string, string>
  capabilities?: Record<string, unknown>
}

export type SessionsResponse = {
  data: SessionSummary[]
  cursor?: { next?: string | null; previous?: string | null }
}

export type OverviewError = { source: string; message: string }

export type Overview = {
  fetchedAt: number
  range: { from: number; to: number; days: number; timezone: string | null }
  info: ServerInfo | null
  stats: StatsData | null
  sessions: { items: SessionSummary[]; truncated: boolean }
  agents: AgentSummary[] | null
  active: Record<string, { type: string }> | null
  location: { directory?: string } | null
  errors: OverviewError[]
}
