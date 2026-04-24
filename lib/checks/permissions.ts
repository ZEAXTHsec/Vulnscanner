// lib/checks/permissions.ts

import { Check, ScanContext, ScanResult } from '@/lib/types'
import { permissionsPolicyPrompt } from '@/lib/utils/fix-prompts'

export const permissionsCheck: Check = {
  id: 'permissions',
  name: 'Permissions & Feature Policy',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const results: ScanResult[] = []
    const headers = ctx.headers

    // Permissions-Policy
    const pp = headers['permissions-policy']
    if (!pp) {
      results.push({
        checkId: 'permissions-policy-missing',
        name: 'Permissions-Policy Missing',
        severity: 'low',
        status: 'fail',
        detail: 'No Permissions-Policy header. Browser features like camera, microphone, and geolocation are unrestricted.',
        fix: 'Add: Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()',
        fixPrompt: permissionsPolicyPrompt(ctx.stack),
        score: 2,
      })
    } else {
      results.push({
        checkId: 'permissions-policy-ok',
        name: 'Permissions-Policy Set',
        severity: 'info',
        status: 'pass',
        detail: `Permissions-Policy header found: ${pp.slice(0, 80)}${pp.length > 80 ? '…' : ''}`,
        score: 0,
      })
    }

    // X-XSS-Protection is handled by headers.ts — removed to avoid duplicates

    // Cache-Control
    const cacheControl = headers['cache-control']
    if (!cacheControl) {
      results.push({
        checkId: 'cache-control-missing',
        name: 'Cache-Control Missing',
        severity: 'low',
        status: 'fail',
        detail: 'No Cache-Control header. Sensitive pages may be cached by browsers or proxies.',
        fix: 'Add: Cache-Control: no-store for pages with sensitive data.',
        score: 1,
      })
    } else {
      results.push({
        checkId: 'cache-control-ok',
        name: 'Cache-Control Set',
        severity: 'info',
        status: 'pass',
        detail: `Cache-Control: ${cacheControl}`,
        score: 0,
      })
    }

    // Expect-CT was deprecated in Chrome 106 (Oct 2022) and is now ignored
    // by all modern browsers. Chrome 130+ removed support entirely.
    // Checking for it generates noise on every scan — removed.

    return results
  },
}