// lib/checks/ssl-cert.ts

import { Check, ScanContext, ScanResult } from '@/lib/types'

export const sslCertCheck: Check = {
  id: 'ssl-cert',
  name: 'SSL Certificate',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const results: ScanResult[] = []

    if (!ctx.url.startsWith('https://')) {
      return [{
        checkId: 'ssl-no-https',
        name: 'SSL Certificate',
        severity: 'high',
        status: 'fail',
        detail: 'Site is not served over HTTPS — no SSL certificate in use.',
        fix: "Install an SSL certificate (free via Let's Encrypt) and redirect all HTTP to HTTPS.",
      }]
    }

    // HSTS header
    const hsts = ctx.headers['strict-transport-security']
    if (!hsts) {
      results.push({
        checkId: 'ssl-no-hsts',
        name: 'HSTS Missing',
        severity: 'medium',
        status: 'fail',
        detail: 'Strict-Transport-Security header is missing. Browsers can still be downgraded to HTTP.',
        fix: 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
      })
    } else {
      const maxAge = hsts.match(/max-age=(\d+)/)
      const age = maxAge ? parseInt(maxAge[1]) : 0
      if (age < 31536000) {
        results.push({
          checkId: 'ssl-hsts-short',
          name: 'HSTS max-age Too Short',
          severity: 'low',
          status: 'fail',
          detail: `HSTS max-age is ${age}s — recommended minimum is 31536000 (1 year).`,
          fix: 'Set max-age=31536000 or higher in your Strict-Transport-Security header.',
        })
      } else {
        results.push({
          checkId: 'ssl-hsts-ok',
          name: 'HSTS Configured',
          severity: 'info',
          status: 'pass',
          detail: `HSTS enabled with max-age=${age}s.`,
        })
      }

      if (!hsts.includes('preload')) {
        results.push({
          checkId: 'ssl-hsts-no-preload',
          name: 'HSTS Preload Missing',
          severity: 'low',
          status: 'fail',
          detail: 'HSTS preload directive is missing. Site is not eligible for browser preload lists.',
          fix: 'Add "preload" to your HSTS header and submit to hstspreload.org.',
        })
      }
    }

    // Mixed content is handled by mixed-content.ts — removed from here to avoid duplicates

    return results
  },
}