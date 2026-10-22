import { spawn } from 'node:child_process'
import type {
  AgentSummary,
  Overview,
  OverviewError,
  ServerInfo,
  SessionSummary,
  SessionsResponse,
  StatsData,
} from '../shared/types.ts'

const DAY_MS = 86_400_000
const CACHE_TTL_MS = Number(process.env.OC_MONITOR_CACHE_MS ?? 10_000)
const CLI_TIMEOUT_MS = Number(process.env.OC_MONITOR_TIMEOUT_MS ?? 30_000)
const MAX_SESSION_PAGES = 12
const PAGE_SIZE = 100

const API_PATH_PATTERN = /^\/api\/[A-Za-z0-9/_.?=&-]+$/
const CURSOR_PATTERN = /^[A-Za-z0-9_=.-]+$/
const TIMEZONE_PATTERN = /^[A-Za-z][A-Za-z0-9_+-]*(?:\/[A-Za-z0-9_+-]+)*$/
const BIN_PATTERN = /^[A-Za-z0-9 _.:\\/-]+$/

export class OpenCodeApiError extends Error {
  readonly hint?: string

  constructor(message: string, hint?: string) {
    super(message)
    this.name = 'OpenCodeApiError'
    this.hint = hint
  }
}

type CacheEntry = { at: number; value: Promise<unknown> }
const cache = new Map<string, CacheEntry>()

/** Runs a read-only request through the official CLI, which resolves the service and its auth. */
export function opencodeApi<T>(path: string, ttlMs = CACHE_TTL_MS): Promise<T> {
  if (!API_PATH_PATTERN.test(path)) {
    return Promise.reject(new OpenCodeApiError('Caminho de API inválido'))
  }

  const hit = cache.get(path)
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as Promise<T>

  const value = runCli<T>(path)
  cache.set(path, { at: Date.now(), value })
  value.catch(() => {
    if (cache.get(path)?.value === value) cache.delete(path)
  })
  return value
}

function runCli<T>(path: string): Promise<T> {
  const bin = resolveBinary()

  return new Promise<T>((resolve, reject) => {
    // Windows: the npm shim is a .cmd and Node cannot spawn it without a shell.
    // PowerShell keeps the query string intact and decodes the CLI output as UTF-8.
    const child =
      process.platform === 'win32'
        ? spawn(
            'powershell.exe',
            [
              '-NoLogo',
              '-NoProfile',
              '-NonInteractive',
              '-Command',
              `[Console]::OutputEncoding=[Text.Encoding]::UTF8; $ProgressPreference='SilentlyContinue'; & "${bin}" api get '${path}'; exit $LASTEXITCODE`,
            ],
            { windowsHide: true },
          )
        : spawn(bin, ['api', 'get', path], { windowsHide: true })

    let stdout = ''
    let stderr = ''
    let settled = false

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      child.kill()
      reject(new OpenCodeApiError('O serviço do OpenCode demorou demais para responder'))
    }, CLI_TIMEOUT_MS)

    child.stdout?.setEncoding('utf8')
    child.stderr?.setEncoding('utf8')
    child.stdout?.on('data', (chunk: string) => {
      stdout += chunk
    })
    child.stderr?.on('data', (chunk: string) => {
      stderr += chunk
    })

    child.on('error', (error: NodeJS.ErrnoException) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(
        error.code === 'ENOENT'
          ? new OpenCodeApiError(
              'CLI do OpenCode não encontrado',
              'Instale o OpenCode ou defina OPENCODE_BIN com o caminho do executável.',
            )
          : new OpenCodeApiError('Não foi possível executar o CLI do OpenCode', error.message),
      )
    })

    child.on('close', (code) => {
      if (settled) return
      settled = true
      clearTimeout(timer)

      if (code !== 0) {
        const detail = stderr.trim().slice(0, 400)
        if (/CommandNotFoundException|não é reconhecido|is not recognized as the name/i.test(detail)) {
          reject(
            new OpenCodeApiError(
              'CLI do OpenCode não encontrado',
              'Instale o OpenCode ou defina OPENCODE_BIN com o caminho do executável.',
            ),
          )
          return
        }
        if (/unauthori[sz]ed|401/i.test(detail)) {
          reject(
            new OpenCodeApiError(
              'O serviço do OpenCode recusou a autenticação',
              'Rode `opencode service restart` e tente de novo.',
            ),
          )
          return
        }
        reject(
          new OpenCodeApiError(
            'O serviço do OpenCode respondeu com erro',
            detail || `CLI terminou com código ${code}`,
          ),
        )
        return
      }

      try {
        resolve(JSON.parse(stdout) as T)
      } catch {
        reject(new OpenCodeApiError('Resposta do OpenCode não é JSON válido', stdout.slice(0, 200)))
      }
    })
  })
}

function resolveBinary() {
  const candidate = (process.env.OPENCODE_BIN ?? 'opencode').replace(/^"|"$/g, '')
  return BIN_PATTERN.test(candidate) ? candidate : 'opencode'
}

export function sanitizeTimezone(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (trimmed.length > 64 || !TIMEZONE_PATTERN.test(trimmed)) return null
  return trimmed
}

export function sanitizeDays(value: number): 0 | 7 | 30 | 90 {
  if (value === 0 || value === 7 || value === 30 || value === 90) return value
  return 30
}

async function listSessions(since: number): Promise<{ items: SessionSummary[]; truncated: boolean }> {
  const byId = new Map<string, SessionSummary>()
  let cursor: string | null = null
  let truncated = false

  for (let page = 0; page < MAX_SESSION_PAGES; page += 1) {
    let path = `/api/session?limit=${PAGE_SIZE}&order=desc`
    if (cursor) {
      if (!CURSOR_PATTERN.test(cursor)) {
        truncated = true
        break
      }
      path += `&cursor=${cursor}`
    }

    const response = await opencodeApi<SessionsResponse>(path)
    const items = response.data ?? []
    for (const item of items) byId.set(item.id, item)

    const oldest = items.at(-1)?.time?.created
    cursor = response.cursor?.next ?? null
    if (!cursor) break
    if (oldest !== undefined && oldest < since) break
    if (page === MAX_SESSION_PAGES - 1) truncated = true
  }

  const items = [...byId.values()]
    .filter((item) => !since || (item.time?.created ?? 0) >= since)
    .sort((a, b) => (b.time?.created ?? 0) - (a.time?.created ?? 0))
  return { items, truncated }
}

async function settle<T>(source: string, promise: Promise<T>, errors: OverviewError[]) {
  try {
    return (await promise) as T
  } catch (error) {
    errors.push({ source, message: error instanceof Error ? error.message : String(error) })
    return null
  }
}

export async function getOverview(days: number, timezone: string | null): Promise<Overview> {
  const to = Date.now()
  const from = days > 0 ? to - days * DAY_MS : null
  const errors: OverviewError[] = []

  const tzQuery = timezone ? `&timezone=${timezone}` : ''
  const statsPath = from
    ? `/api/experimental/session/stats?tools=detail&from=${from}&to=${to}${tzQuery}`
    : `/api/experimental/session/stats?tools=detail&to=${to}${tzQuery}`

  const [info, statsResponse, agents, active, location] = await Promise.all([
    settle('info', opencodeApi<ServerInfo>('/api/info', 5_000), errors),
    settle('stats', opencodeApi<{ data: StatsData }>(statsPath), errors),
    settle('agents', opencodeApi<{ data: AgentSummary[] }>('/api/agent', 30_000), errors),
    settle(
      'active',
      opencodeApi<{ data: Record<string, { type: string }> }>('/api/session/active', 5_000),
      errors,
    ),
    settle('location', opencodeApi<{ directory?: string }>('/api/location', 30_000), errors),
  ])

  const stats = statsResponse?.data ?? null

  const since = from ?? stats?.range?.from ?? 0
  const sessions = await settle('sessions', listSessions(since), errors)

  const rangeFrom = from ?? stats?.range?.from ?? sessions?.items.at(-1)?.time?.created ?? to

  return {
    fetchedAt: Date.now(),
    range: { from: rangeFrom, to, days, timezone },
    info,
    stats,
    agents: agents?.data ?? null,
    active: active?.data ?? null,
    location,
    sessions: sessions ?? { items: [], truncated: false },
    errors,
  }
}
