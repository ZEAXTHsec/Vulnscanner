// lib/scanner/fetcher.ts

import { SCAN_CONFIG } from '@/lib/constants'
import { FetchResult } from '@/lib/types'

function normalizeHeaders(raw: Headers): Record<string, string> {
  const normalized: Record<string, string> = {}
  raw.forEach((value, key) => {
    normalized[key.toLowerCase()] = value
  })
  return normalized
}

function buildAbortController(): { controller: AbortController; clear: () => void } {
  const controller = new AbortController()
  const timer = setTimeout(
    () => controller.abort(),
    SCAN_CONFIG.FETCH_TIMEOUT_MS
  )
  return {
    controller,
    clear: () => clearTimeout(timer),
  }
}

export async function fetchTarget(url: string): Promise<FetchResult> {
  const { controller, clear } = buildAbortController()

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': SCAN_CONFIG.USER_AGENT,
      },
      redirect: 'follow',
    })

    clear()

    const html = await response.text()
    const headers = normalizeHeaders(response.headers)

    return {
      url,
      html,
      headers,
      statusCode: response.status,
    }
  } catch (err: unknown) {
    clear()

    const isTimeout =
      err instanceof Error && err.name === 'AbortError'

    return {
      url,
      html: '',
      headers: {},
      statusCode: 0,
      error: isTimeout
        ? `Request timed out after ${SCAN_CONFIG.FETCH_TIMEOUT_MS / 1000}s`
        : `Fetch failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
    }
  }
}

// Fetch a path relative to the base URL (used for sensitive path checks later)
export async function fetchPath(
  baseUrl: string,
  path: string
): Promise<FetchResult> {
  const base = new URL(baseUrl)
  const target = `${base.origin}${path}`
  return fetchTarget(target)
}