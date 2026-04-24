// lib/checks/cookies.ts

import { Check, ScanContext, ScanResult } from '@/lib/types'

export const cookiesCheck: Check = {
  id: 'cookies',
  name: 'Cookie Security',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const results: ScanResult[] = []
    const setCookie = ctx.headers['set-cookie']

    if (!setCookie) {
      results.push({
        checkId: 'cookies-none',
        name: 'Cookie Security',
        severity: 'info',
        status: 'pass',
        detail: 'No Set-Cookie headers found on this page.',
        score: 0,
      })
      return results
    }

    // Normalise — can be string or string[]
    const cookieList = Array.isArray(setCookie) ? setCookie : [setCookie]
    const issues: string[] = []
    const passed: string[] = []

    for (const cookie of cookieList) {
      const lower = cookie.toLowerCase()
      const name = cookie.split('=')[0].trim()

      const missingSecure = !lower.includes('secure')
      const missingHttpOnly = !lower.includes('httponly')
      const missingSameSite = !lower.includes('samesite')

      if (missingSecure) issues.push(`"${name}" missing Secure flag`)
      if (missingHttpOnly) issues.push(`"${name}" missing HttpOnly flag`)
      if (missingSameSite) issues.push(`"${name}" missing SameSite attribute`)

      if (!missingSecure && !missingHttpOnly && !missingSameSite) {
        passed.push(name)
      }
    }

    if (issues.length === 0) {
      results.push({
        checkId: 'cookies-ok',
        name: 'Cookie Flags Secure',
        severity: 'info',
        status: 'pass',
        detail: `All ${cookieList.length} cookie(s) have Secure, HttpOnly, and SameSite set.`,
        score: 0,
      })
      return results
    }

    // Group by severity
    const secureIssues = issues.filter((i) => i.includes('Secure') || i.includes('HttpOnly'))
    const sameSiteIssues = issues.filter((i) => i.includes('SameSite'))

    if (secureIssues.length > 0) {
      results.push({
        checkId: 'cookies-insecure',
        name: 'Insecure Cookie Flags',
        severity: 'high',
        status: 'fail',
        detail: secureIssues.slice(0, 3).join('; ') + (secureIssues.length > 3 ? ` (+${secureIssues.length - 3} more)` : ''),
        fix: 'Set Secure and HttpOnly on all cookies. Example: Set-Cookie: session=abc; Secure; HttpOnly; SameSite=Strict',
        score: 7,
      })
    }

    if (sameSiteIssues.length > 0) {
      results.push({
        checkId: 'cookies-samesite',
        name: 'SameSite Attribute Missing',
        severity: 'medium',
        status: 'fail',
        detail: `${sameSiteIssues.length} cookie(s) missing SameSite attribute — vulnerable to CSRF via cross-site requests.`,
        fix: 'Add SameSite=Strict or SameSite=Lax to all cookies. Strict is most secure.',
        score: 4,
      })
    }

    if (passed.length > 0) {
      results.push({
        checkId: 'cookies-some-ok',
        name: 'Some Cookies Secure',
        severity: 'info',
        status: 'pass',
        detail: `Cookie(s) with all flags set correctly: ${passed.join(', ')}`,
        score: 0,
      })
    }

    return results
  },
}