// lib/checks/dns.ts
// Only checks version-specific server header leaks.
// Generic header checks (X-Frame-Options, Referrer-Policy, etc.) live in headers.ts.

import { Check, ScanContext, ScanResult } from '@/lib/types'
import { serverVersionLeakPrompt } from '@/lib/utils/fix-prompts'

export const dnsCheck: Check = {
  id: 'dns',
  name: 'DNS & Headers',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const results: ScanResult[] = []
    const server = ctx.headers['server']

    if (server) {
      const leaksVersion =
        /[\d.]{3,}/.test(server) || /apache|nginx|iis|php/i.test(server)

      if (leaksVersion) {
        results.push({
          checkId: 'dns-server-leak',
          name: 'Server Version Disclosed',
          severity: 'low',
          status: 'fail',
          detail: `Server header reveals software/version: "${server}". Attackers use this to look up known CVEs for that exact version and craft targeted exploits.`,
          fix: 'Remove or genericize the Server header (e.g. ServerTokens Prod in Apache, server_tokens off in nginx).',
          fixPrompt: serverVersionLeakPrompt(ctx.stack),
          score: 2,
        })
      } else {
        results.push({
          checkId: 'dns-server-ok',
          name: 'Server Header',
          severity: 'info',
          status: 'pass',
          detail: `Server header present but does not leak version info: "${server}".`,
          score: 0,
        })
      }
    }

    return results
  },
}