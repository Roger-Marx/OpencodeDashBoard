import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { getOverview, OpenCodeApiError, sanitizeDays, sanitizeTimezone } from './opencode.ts'

const ROUTE = '/oc-api/overview'

type Next = (error?: unknown) => void

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

const middleware = async (req: IncomingMessage, res: ServerResponse, next: Next) => {
  if (!req.url) return next()

  let url: URL
  try {
    url = new URL(req.url, 'http://localhost')
  } catch {
    return next()
  }

  if (url.pathname !== ROUTE) return next()
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Método não permitido' })

  const days = sanitizeDays(Number(url.searchParams.get('days') ?? 30))
  const timezone = sanitizeTimezone(url.searchParams.get('tz'))

  try {
    const overview = await getOverview(days, timezone)
    sendJson(res, 200, overview)
  } catch (error) {
    const isApiError = error instanceof OpenCodeApiError
    sendJson(res, 502, {
      error: isApiError ? error.message : 'Falha ao ler os dados do OpenCode',
      hint: isApiError ? error.hint : undefined,
    })
  }
}

/**
 * Serves `/oc-api/overview` in dev and preview. The browser cannot call the OpenCode
 * service directly (auth + CORS), so the CLI is the transport.
 */
export function opencodeMonitor(): Plugin {
  return {
    name: 'oc-monitor-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
