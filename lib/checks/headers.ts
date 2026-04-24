// lib/checks/headers.ts

import { Check, ScanContext, ScanResult } from '@/lib/types'
import {
  xFrameOptionsPrompt,
  xContentTypeOptionsPrompt,
  referrerPolicyPrompt,
} from '@/lib/utils/fix-prompts'

// Server header values that are generic/opaque — not worth flagging
const SAFE_SERVER_PATTERNS = [
  /^gws$/i,          // Google
  /^ESF$/i,          // Google ESF
  /^cloudflare$/i,
  /^nginx$/i,        // no version — just "nginx" is fine
  /^apache$/i,       // no version — just "apache" is fine
  /^openresty$/i,
  /^litespeed$/i,
  /^hcdn$/i,
  /^cdn$/i,
  /^server$/i,
]

// Server values that DO leak useful info to attackers
const LEAKY_SERVER_PATTERN = /[\d.]{3,}|apache\/|nginx\/|iis\/|php\/|tomcat\/|jetty\/|unicorn|passenger/i

const LEAK_HEADERS: {
  key: string
  name: string
  detail: (val: string) => string
  fix: string
  severity: 'high' | 'medium' | 'low'
  score: number
  shouldFlag?: (val: string) => boolean
}[] = [
  {
    key: 'server',
    name: 'Server Header Exposes Software',
    detail: (val) => `Server header reveals: "${val}". Attackers can target known CVEs for this software/version.`,
    fix: 'Suppress or genericise the Server header in your web server config (e.g. ServerTokens Prod in Apache, server_tokens off in nginx).',
    severity: 'low',
    score: 2,
    // Only flag if it leaks a version/software name — not generic opaque values
    shouldFlag: (val) => {
      if (SAFE_SERVER_PATTERNS.some((p) => p.test(val))) return false
      return LEAKY_SERVER_PATTERN.test(val)
    },
  },
  {
    key: 'x-powered-by',
    name: 'X-Powered-By Header Exposes Framework',
    detail: (val) => `X-Powered-By reveals: "${val}". This helps attackers fingerprint your stack.`,
    fix: 'Remove X-Powered-By. In Express: app.disable("x-powered-by"). In PHP: expose_php = Off.',
    severity: 'low',
    score: 2,
  },
  {
    key: 'x-aspnet-version',
    name: 'ASP.NET Version Exposed',
    detail: (val) => `X-AspNet-Version: "${val}" — version fingerprinting risk.`,
    fix: 'Remove in web.config: <httpRuntime enableVersionHeader="false" />',
    severity: 'low',
    score: 2,
  },
  {
    key: 'x-aspnetmvc-version',
    name: 'ASP.NET MVC Version Exposed',
    detail: (val) => `X-AspNetMvc-Version: "${val}" — version fingerprinting risk.`,
    fix: 'In Global.asax Application_Start: MvcHandler.DisableMvcResponseHeader = true;',
    severity: 'low',
    score: 1,
  },
]

export const headersCheck: Check = {
  id: 'headers',
  name: 'Security Headers',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const results: ScanResult[] = []

    // 1. Required security headers — individual so each can carry a fixPrompt
    const missingNames: string[] = []

    const xct = ctx.headers['x-content-type-options']
    if (!xct) {
      missingNames.push('X-Content-Type-Options')
      results.push({
        checkId: 'header-missing-x-content-type-options',
        name: 'X-Content-Type-Options Missing',
        severity: 'medium',
        status: 'fail',
        detail: 'Browser may MIME-sniff responses away from the declared content-type, enabling content injection attacks.',
        fix: 'Add header: X-Content-Type-Options: nosniff',
        fixPrompt: xContentTypeOptionsPrompt(ctx.stack),
        score: 4,
      })
    }

    const xfo = ctx.headers['x-frame-options']
    if (!xfo) {
      missingNames.push('X-Frame-Options')
      results.push({
        checkId: 'header-missing-x-frame-options',
        name: 'X-Frame-Options Missing',
        severity: 'medium',
        status: 'fail',
        detail: 'Page can be embedded in an iframe by any origin, enabling clickjacking attacks.',
        fix: 'Add header: X-Frame-Options: SAMEORIGIN (or use CSP frame-ancestors directive).',
        fixPrompt: xFrameOptionsPrompt(ctx.stack),
        score: 5,
      })
    }

    const rp = ctx.headers['referrer-policy']
    if (!rp) {
      missingNames.push('Referrer-Policy')
      results.push({
        checkId: 'header-missing-referrer-policy',
        name: 'Referrer-Policy Missing',
        severity: 'low',
        status: 'fail',
        detail: 'Browser will send the full Referrer header by default, potentially leaking URLs with sensitive query params to third parties.',
        fix: 'Add header: Referrer-Policy: strict-origin-when-cross-origin',
        fixPrompt: referrerPolicyPrompt(ctx.stack),
        score: 2,
      })
    }

    // X-XSS-Protection is deprecated since Chrome 78 (2019) — flag presence as info only
    // We intentionally skip flagging its absence

    if (missingNames.length === 0) {
      results.push({
        checkId: 'headers-required-ok',
        name: 'Security Headers Present',
        severity: 'info',
        status: 'pass',
        detail: 'All recommended security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy) are set.',
        score: 0,
      })
    }

    // 2. Info-leaking headers
    let anyLeakFlagged = false
    for (const h of LEAK_HEADERS) {
      const val = ctx.headers[h.key]
      if (!val) continue
      // If the header has a custom shouldFlag guard, respect it
      if (h.shouldFlag && !h.shouldFlag(val)) continue
      anyLeakFlagged = true
      results.push({
        checkId: `header-leak-${h.key}`,
        name: h.name,
        severity: h.severity,
        status: 'fail',
        detail: h.detail(val),
        fix: h.fix,
        score: h.score,
      })
    }

    if (!anyLeakFlagged) {
      results.push({
        checkId: 'headers-leak-ok',
        name: 'No Version-Leaking Headers',
        severity: 'info',
        status: 'pass',
        detail: 'Server, X-Powered-By, and framework version headers are suppressed or absent.',
        score: 0,
      })
    }

    // 3. Cross-Origin isolation headers
    const coep = ctx.headers['cross-origin-embedder-policy']
    const coop = ctx.headers['cross-origin-opener-policy']
    if (!coep || !coop) {
      results.push({
        checkId: 'headers-corp-missing',
        name: 'Cross-Origin Isolation Headers Missing',
        severity: 'low',
        status: 'fail',
        detail: `Missing: ${[!coep && 'COEP', !coop && 'COOP'].filter(Boolean).join(', ')}. These headers enable cross-origin isolation, required for SharedArrayBuffer and Spectre mitigations.`,
        fix: 'Add: Cross-Origin-Embedder-Policy: require-corp and Cross-Origin-Opener-Policy: same-origin if your app uses SharedArrayBuffer.',
        score: 1,
      })
    }

    return results
  },
}