// lib/checks/rate-limit.ts

import { Check, ScanContext, ScanResult } from '@/lib/types'
import { rateLimitPrompt } from '@/lib/utils/fix-prompts'

export const rateLimitCheck: Check = {
  id: 'rate-limit',
  name: 'Rate Limiting & Brute Force Protection',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const results: ScanResult[] = []
    const headers = ctx.headers
    const html = ctx.html

    // Check for rate limit headers
    const rateLimitHeaders = [
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'ratelimit-limit',
      'retry-after',
      'x-rate-limit-limit',
    ]

    const foundRateHeaders = rateLimitHeaders.filter((h) => headers[h])

    // CDN/WAF platforms enforce rate limiting at the edge without exposing headers
    // on normal page loads — downgrade to info when edge protection is confirmed.
    const hasCdnProtection = ctx.stack.hosting !== 'unknown'

    if (foundRateHeaders.length > 0) {
      results.push({
        checkId: 'rate-limit-headers-ok',
        name: 'Rate Limiting Headers Present',
        severity: 'info',
        status: 'pass',
        detail: `Rate limiting headers detected: ${foundRateHeaders.join(', ')}`,
      })
    } else if (hasCdnProtection) {
      const hostingName = ctx.stack.hosting.charAt(0).toUpperCase() + ctx.stack.hosting.slice(1)
      results.push({
        checkId: 'rate-limit-cdn',
        name: 'Rate Limiting (CDN/WAF)',
        severity: 'info',
        status: 'pass',
        detail: `Site is served through ${hostingName} — rate limiting is likely enforced at the edge. Verify in your ${hostingName} dashboard.`,
      })
    } else {
      results.push({
        checkId: 'rate-limit-headers-missing',
        name: 'No Rate Limiting Headers',
        severity: 'medium',
        status: 'fail',
        detail: 'No rate limiting headers found. Login and API endpoints may be vulnerable to brute force — an attacker can make thousands of password attempts per minute with no penalty.',
        fix: 'Implement rate limiting on login, signup, and API endpoints. Use Cloudflare, nginx limit_req, or middleware like express-rate-limit.',
        fixPrompt: rateLimitPrompt(ctx.stack),
      })
    }

    // Login form without CAPTCHA signals
    const hasLoginForm = /<input[^>]*type=["']password["']/i.test(html)
    const hasCaptcha = [
      'recaptcha', 'hcaptcha', 'turnstile', 'cf-turnstile',
      'g-recaptcha', 'captcha',
    ].some((s) => html.toLowerCase().includes(s))

    if (hasLoginForm && !hasCaptcha) {
      results.push({
        checkId: 'rate-limit-no-captcha',
        name: 'Login Form Without CAPTCHA',
        severity: 'medium',
        status: 'fail',
        detail: 'Password form detected with no CAPTCHA or bot protection. Vulnerable to automated credential stuffing.',
        fix: 'Add Cloudflare Turnstile (free) or hCaptcha to login forms. Also implement account lockout after N failed attempts.',
      })
    } else if (hasLoginForm && hasCaptcha) {
      results.push({
        checkId: 'rate-limit-captcha-ok',
        name: 'Login Protected by CAPTCHA',
        severity: 'info',
        status: 'pass',
        detail: 'Login form has CAPTCHA/bot protection detected.',
      })
    }

    // Check for security.txt
    let hasSecurityTxt = false
    try {
      const { fetchPath } = await import('@/lib/scanner/fetcher')
      for (const path of ['/.well-known/security.txt', '/security.txt']) {
        const res = await fetchPath(ctx.url, path)
        if (res.statusCode === 200) {
          hasSecurityTxt = true
          break
        }
      }
    } catch { /* skip */ }

    if (!hasSecurityTxt) {
      results.push({
        checkId: 'security-txt-missing',
        name: 'security.txt Not Found',
        severity: 'low',
        status: 'fail',
        detail: 'No /.well-known/security.txt file. Security researchers have no way to report vulnerabilities.',
        fix: 'Create a security.txt at /.well-known/security.txt with a contact email. See securitytxt.org.',
      })
    } else {
      results.push({
        checkId: 'security-txt-ok',
        name: 'security.txt Present',
        severity: 'info',
        status: 'pass',
        detail: 'security.txt found — vulnerability disclosure contact is configured.',
      })
    }

    return results
  },
}