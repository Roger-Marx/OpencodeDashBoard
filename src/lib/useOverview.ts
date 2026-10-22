import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Overview } from '../../shared/types'

export type ApiError = { message: string; hint?: string }

type ErrorPayload = { error?: string; hint?: string }

export type OverviewState = {
  data: Overview | null
  error: ApiError | null
  loading: boolean
  refreshing: boolean
  timezone: string
  refresh: () => void
}

const REFRESH_MS = 30_000

export function useOverview(days: number, autoRefresh: boolean): OverviewState {
  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    [],
  )

  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const requestID = useRef(0)

  const load = useCallback(
    async (kind: 'initial' | 'refresh') => {
      const id = requestID.current + 1
      requestID.current = id

      if (kind === 'initial') setLoading(true)
      else setRefreshing(true)

      try {
        const response = await fetch(
          `/oc-api/overview?days=${days}&tz=${encodeURIComponent(timezone)}`,
          { headers: { Accept: 'application/json' } },
        )
        const payload = (await response.json().catch(() => null)) as
          | (Partial<Overview> & ErrorPayload)
          | null

        if (requestID.current !== id) return

        if (!response.ok || !payload || payload.error) {
          setError({
            message: payload?.error ?? `O servidor local respondeu com status ${response.status}.`,
            hint: payload?.hint,
          })
          return
        }

        setData(payload as Overview)
        setError(null)
      } catch {
        if (requestID.current !== id) return
        setError({
          message: 'Não foi possível falar com o servidor local do monitor.',
          hint: 'Confirme que o `npm run dev` continua rodando nesta máquina.',
        })
      } finally {
        if (requestID.current === id) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [days, timezone],
  )

  useEffect(() => {
    setData(null)
    setError(null)
    void load('initial')
  }, [load])

  useEffect(() => {
    if (!autoRefresh) return
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void load('refresh')
    }, REFRESH_MS)
    return () => clearInterval(timer)
  }, [autoRefresh, load])

  const refresh = useCallback(() => {
    void load(data ? 'refresh' : 'initial')
  }, [data, load])

  return { data, error, loading, refreshing, timezone, refresh }
}
