// lib/checks/cors.ts

import { Check, ScanContext, ScanResult } from '@/lib/types'
import { corsWildcardCredentialsPrompt, corsWildcardPrompt } from '@/lib/utils/fix-prompts'

export const corsCheck: Check = {
  id: 'cors-policy',
  name: 'CORS Policy',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const origin = ctx.headers['access-control-allow-origin']
    const methods = ctx.headers['access-control-allow-methods']
    const credentials = ctx.headers['access-control-allow-credentials']
    const isCredentialed = credentials?.toLowerCase() === 'true'

    // No CORS headers — browser default restriction applies, nothing to flag
    if (!origin) {
      return [{
        checkId: 'cors-not-set',
        name: 'CORS Policy',
        severity: 'info',
        status: 'pass',
        detail: 'No CORS headers detected. Cross-origin requests are restricted by default.',
      }]
    }

    const results: ScanResult[] = []

    if (origin === '*') {
      if (isCredentialed) {
        // High: wildcard + credentials. Browsers block this combination but its
        // presence indicates a misconfigured backend — credentials flag is set
        // intentionally, suggesting the developer thought this would work.
        results.push({
          checkId: 'cors-wildcard-credentials',
          name: 'Wildcard CORS with Credentials',
          severity: 'high',
          status: 'fail',
          detail: 'CORS is set to wildcard (*) AND credentials are enabled. Browsers block this combination, but it signals a misconfigured backend that may allow credential leakage on endpoints that do implement it correctly.',
          fix: 'Set Access-Control-Allow-Origin to a specific trusted domain. Never combine * with Access-Control-Allow-Credentials: true.',
          fixPrompt: corsWildcardCredentialsPrompt(ctx.stack),
          raw: { origin, methods, credentials },
        })
      } else {
        // Medium: wildcard without credentials — any origin can read responses.
        // Not credential-leaking but still risky for authenticated APIs.
        results.push({
          checkId: 'cors-wildcard',
          name: 'CORS Wildcard Origin (*)',
          severity: 'medium',
          status: 'fail',
          detail: 'Any origin can read responses from this server. Risky for authenticated or sensitive endpoints — CSRF tokens, user data, or internal API responses may be readable from attacker-controlled pages.',
          fix: 'Restrict Access-Control-Allow-Origin to specific trusted domains. Only use * for genuinely public, unauthenticated resources.',
          fixPrompt: corsWildcardPrompt(ctx.stack),
          raw: { origin, methods, credentials },
        })
      }
    } else if (origin.trim() === 'null') {
      // Medium: reflect "null" origin — sandbox iframes and file:// requests
      // can exploit this to bypass same-origin policy
      results.push({
        checkId: 'cors-null-origin',
        name: 'CORS Allows null Origin',
        severity: 'medium',
        status: 'fail',
        detail: 'Server allows the "null" origin. Sandboxed iframes and local file:// requests have a null origin — an attacker can use a sandboxed iframe to send credentialed cross-origin requests.',
        fix: 'Never whitelist the null origin. Restrict Access-Control-Allow-Origin to explicit trusted domains.',
        raw: { origin, credentials },
      })
    } else {
      // Specific origin configured — pass
      results.push({
        checkId: 'cors-configured',
        name: 'CORS Policy',
        severity: 'info',
        status: 'pass',
        detail: `CORS restricted to origin: ${origin}`,
        raw: { origin },
      })
    }

    return results
  },
}