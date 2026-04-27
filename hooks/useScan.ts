// hooks/useScan.ts
// Encapsulates all scan state and logic so ScanInput can stay a thin presentation layer.

import { useState, useCallback, useRef } from 'react'
import { ScanReport } from '@/lib/types'
import { addReport } from '@/store/index'

export type ScanState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; report: ScanReport }
  | { status: 'error'; message: string }

// ─── URL normalisation + client-side validation ───────────────────────────────
// Strips non-http(s) schemes before they even reach the server.

function normaliseUrl(raw: string): string | null {
  const trimmed = raw.trim()

  // Already has a scheme
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed)
      if (!['http:', 'https:'].includes(u.protocol)) return null
      return trimmed
    } catch {
      return null
    }
  }

  // Bare hostname / path — prepend https://
  const withScheme = 'https://' + trimmed
  try {
    new URL(withScheme)
    return withScheme
  } catch {
    return null
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useScan() {
  const [state, setState] = useState<ScanState>({ status: 'idle' })
  // Abort controller ref — cancels in-flight fetch if user re-scans or unmounts
  const abortRef = useRef<AbortController | null>(null)

  const scan = useCallback(async (rawUrl: string) => {
    const url = rawUrl.trim()
    if (!url) return

    const normUrl = normaliseUrl(url)
    if (!normUrl) {
      setState({ status: 'error', message: 'Invalid URL — only http:// and https:// URLs are supported.' })
      return
    }

    // Cancel any in-flight request before starting a new one (#13)
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState({ status: 'loading' })

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normUrl }),
        signal: controller.signal,
      })

      const data = await res.json()

      if (!res.ok) {
        setState({ status: 'error', message: data.error ?? 'Scan failed' })
        return
      }

      const report = data as ScanReport
      addReport(report)
      setState({ status: 'success', report })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return // user cancelled
      setState({ status: 'error', message: 'Network error — is the server running?' })
    }
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState({ status: 'idle' })
  }, [])

  return {
    state,
    scan,
    reset,
    isLoading: state.status === 'loading',
    report:    state.status === 'success' ? state.report : null,
    error:     state.status === 'error'   ? state.message : null,
  }
}