// lib/checks/csp-deep.ts

import { Check, ScanContext, ScanResult } from '@/lib/types'

interface CspDirective {
  name: string
  values: string[]
}

function parseCSP(csp: string): CspDirective[] {
  return csp.split(';').map((part) => {
    const [name, ...values] = part.trim().split(/\s+/)
    return { name: name?.toLowerCase() ?? '', values }
  }).filter((d) => d.name)
}

export const cspDeepCheck: Check = {
  id: 'csp-deep',
  name: 'CSP Deep Analysis',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const results: ScanResult[] = []
    const csp = ctx.headers['content-security-policy']

    if (!csp) {
      // Already covered by injection check — skip to avoid duplicate
      return []
    }

    const directives = parseCSP(csp)
    const directiveMap = Object.fromEntries(directives.map((d) => [d.name, d.values]))

    // Check for wildcard sources
    const wildcardDirs = directives.filter((d) =>
      d.values.includes('*') || d.values.includes('https:') || d.values.includes('http:')
    )
    if (wildcardDirs.length > 0) {
      results.push({
        checkId: 'csp-wildcard',
        name: 'CSP Wildcard Sources',
        severity: 'medium',
        status: 'fail',
        detail: `CSP uses overly broad sources in: ${wildcardDirs.map((d) => d.name).join(', ')}. Wildcards defeat the purpose of CSP.`,
        fix: "Replace wildcard sources with specific trusted domains. Avoid 'https:' as a source — it allows any HTTPS origin.",
        score: 5,
      })
    }

    // Check default-src presence
    if (!directiveMap['default-src'] && !directiveMap['script-src']) {
      results.push({
        checkId: 'csp-no-default',
        name: 'CSP Missing default-src',
        severity: 'medium',
        status: 'fail',
        detail: "CSP has no default-src or script-src directive. Unlisted resource types fall back to allow-all.",
        fix: "Add default-src 'self' as a catch-all baseline in your CSP.",
        score: 4,
      })
    }

    // Check for data: URI sources (XSS vector)
    const dataSrcDirs = directives.filter((d) => d.values.includes('data:'))
    if (dataSrcDirs.length > 0) {
      results.push({
        checkId: 'csp-data-uri',
        name: "CSP Allows data: URIs",
        severity: 'medium',
        status: 'fail',
        detail: `data: URI allowed in: ${dataSrcDirs.map((d) => d.name).join(', ')}. Enables base64-encoded script injection.`,
        fix: "Remove data: from script-src. Only allow data: in img-src if absolutely necessary.",
        score: 4,
      })
    }

    // Check for nonce or hash usage (best practice)
    const usesNonceOrHash = csp.includes("'nonce-") || csp.includes("'sha256-") || csp.includes("'sha384-")
    const hasUnsafeInline = csp.includes("'unsafe-inline'")

    if (!hasUnsafeInline && usesNonceOrHash) {
      results.push({
        checkId: 'csp-nonce-ok',
        name: 'CSP Uses Nonces/Hashes',
        severity: 'info',
        status: 'pass',
        detail: "CSP uses nonces or hashes instead of 'unsafe-inline' — best practice.",
        score: 0,
      })
    }

    // Check upgrade-insecure-requests
    if (!directiveMap['upgrade-insecure-requests'] && ctx.url.startsWith('https://')) {
      results.push({
        checkId: 'csp-no-upgrade',
        name: 'CSP Missing upgrade-insecure-requests',
        severity: 'low',
        status: 'fail',
        detail: 'CSP does not include upgrade-insecure-requests. HTTP sub-resources may not be auto-upgraded to HTTPS.',
        fix: 'Add upgrade-insecure-requests to your CSP to automatically upgrade HTTP resources to HTTPS.',
        score: 1,
      })
    }

    // Check block-all-mixed-content
    if (!directiveMap['block-all-mixed-content'] && !directiveMap['upgrade-insecure-requests']) {
      results.push({
        checkId: 'csp-mixed-content',
        name: 'CSP Mixed Content Not Blocked',
        severity: 'low',
        status: 'fail',
        detail: 'Neither block-all-mixed-content nor upgrade-insecure-requests in CSP.',
        fix: 'Add either upgrade-insecure-requests or block-all-mixed-content to your CSP.',
        score: 1,
      })
    }

    if (results.length === 0) {
      results.push({
        checkId: 'csp-deep-ok',
        name: 'CSP Configuration Strong',
        severity: 'info',
        status: 'pass',
        detail: 'CSP deep analysis passed — no obvious weaknesses found.',
        score: 0,
      })
    }

    return results
  },
}