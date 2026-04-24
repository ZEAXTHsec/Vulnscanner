// lib/checks/https.ts

import { Check, ScanContext, ScanResult } from '@/lib/types'

export const httpsCheck: Check = {
  id: 'https-enforcement',
  name: 'HTTPS Enforcement',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const isHttps = ctx.url.startsWith('https://')

    if (!isHttps) {
      return [{
        checkId: 'no-https',
        name: 'HTTPS not enforced',
        severity: 'high',
        status: 'fail',
        detail: 'Site is served over HTTP. All data in transit is unencrypted and can be intercepted.',
        fix: 'Redirect all HTTP traffic to HTTPS and obtain a TLS certificate (free via Let\'s Encrypt).',
        score: 9,
      }]
    }

    return [{
      checkId: 'https-ok',
      name: 'HTTPS enforced',
      severity: 'info',
      status: 'pass',
      detail: 'Site is served over HTTPS.',
      score: 0,
    }]
  },
}