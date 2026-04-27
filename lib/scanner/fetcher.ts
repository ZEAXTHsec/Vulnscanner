// lib/scanner/fetcher.ts

import { SCAN_CONFIG } from '@/lib/constants'
import { FetchResult } from '@/lib/types'
import { lookup } from 'dns/promises'

// ─── SSRF guard ──────────────────────────────────────────────────────────────
// Resolve the hostname and block private/loopback/link-local IPs before
// any outbound fetch.  Prevents scanning AWS metadata (169.254.169.254),
// localhost, and internal RFC-1918 ranges.

// Matches loopback, RFC-1918, link-local, and IPv6 private ranges
const PRIVATE_IP_RE = /^(127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|fc|fd|fe80)/

function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_RE.test(ip)
}

async function assertPublicHost(url: string): Promise<void> {
  const hostname = new URL(url).hostname

  // Reject bare IP literals immediately
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':')) {
    if (isPrivateIp(hostname)) {
      throw new Error(`SSRF blocked: private/loopback IP "${hostname}"`)
    }
    return
  }

  try {
    const { address } = await lookup(hostname)
    if (isPrivateIp(address)) {
      throw new Error(`SSRF blocked: "${hostname}" resolves to private IP "${address}"`)
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('SSRF blocked')) throw err
    // DNS lookup failure — let the fetch attempt handle it naturally
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchTarget(url: string): Promise<FetchResult> {
  try {
    await assertPublicHost(url)
  } catch (err) {
    return {
      url,
      html: '',
      headers: {},
      statusCode: 0,
      error: err instanceof Error ? err.message : 'SSRF check failed',
    }
  }

  const { controller, clear } = buildAbortController()

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': SCAN_CONFIG.USER_AGENT },
      redirect: 'follow',
    })

    clear()

    const html    = await response.text()
    const headers = normalizeHeaders(response.headers)

    return { url, html, headers, statusCode: response.status }
  } catch (err: unknown) {
    clear()

    const isTimeout = err instanceof Error && err.name === 'AbortError'

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

/** Fetch a path relative to the base URL (used for sensitive path checks). */
export async function fetchPath(baseUrl: string, path: string): Promise<FetchResult> {
  const base   = new URL(baseUrl)
  const target = `${base.origin}${path}`
  return fetchTarget(target)
}
