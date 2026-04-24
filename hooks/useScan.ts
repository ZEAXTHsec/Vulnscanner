// hooks/useScan.ts
// Encapsulates all scan state and logic so ScanInput (and any future component)
// can stay as a thin presentation layer.

import { useState, useCallback } from 'react'
import { ScanReport } from '@/lib/types'
import { addReport } from '@/store/index'

export type ScanState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; report: ScanReport }
  | { status: 'error'; message: string }

function normaliseUrl(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  return 'https://' + trimmed
}

export function useScan() {
  const [state, setState] = useState<ScanState>({ status: 'idle' })

  const scan = useCallback(async (rawUrl: string) => {
    const url = rawUrl.trim()
    if (!url) return

    setState({ status: 'loading' })

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normaliseUrl(url) }),
      })

      const data = await res.json()

      if (!res.ok) {
        setState({ status: 'error', message: data.error ?? 'Scan failed' })
        return
      }

      const report = data as ScanReport
      addReport(report)
      setState({ status: 'success', report })
    } catch {
      setState({ status: 'error', message: 'Network error — is the server running?' })
    }
  }, [])

  const reset = useCallback(() => {
    setState({ status: 'idle' })
  }, [])

  return {
    state,
    scan,
    reset,
    isLoading: state.status === 'loading',
    report: state.status === 'success' ? state.report : null,
    error: state.status === 'error' ? state.message : null,
  }
}