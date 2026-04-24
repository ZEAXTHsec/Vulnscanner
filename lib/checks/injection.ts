// lib/checks/injection.ts

import { Check, ScanContext, ScanResult } from '@/lib/types'
import { cspMissingPrompt, cspWeakPrompt } from '@/lib/utils/fix-prompts'

export const injectionCheck: Check = {
  id: 'injection',
  name: 'Injection Surface',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const results: ScanResult[] = []
    const html = ctx.html

    // Check 1: Forms without CSRF tokens
    const formMatches: string[] = html.match(/<form[^>]*>/gi) || []
    const csrfSignals = [
      '_token', 'csrf', 'nonce', '__RequestVerificationToken',
      'authenticity_token', 'wp_nonce'
    ]
    const hasCsrf = csrfSignals.some((s) => html.toLowerCase().includes(s))

    if (formMatches.length > 0 && !hasCsrf) {
      results.push({
        checkId: 'injection-csrf',
        name: 'CSRF Token Missing',
        severity: 'high',
        status: 'fail',
        detail: `Found ${formMatches.length} form(s) with no detectable CSRF token. Forms may be vulnerable to cross-site request forgery.`,
        fix: 'Add CSRF tokens to all forms. Most frameworks (Laravel, Django, Rails) do this automatically.',
        score: 8,
      })
    } else if (formMatches.length > 0) {
      results.push({
        checkId: 'injection-csrf-ok',
        name: 'CSRF Tokens Present',
        severity: 'info',
        status: 'pass',
        detail: `Found ${formMatches.length} form(s) with CSRF token signals detected.`,
        score: 0,
      })
    }

    // Check 2: Inline JS with dangerous patterns
    const dangerousPatterns = [
      { pattern: /document\.write\s*\(/i, label: 'document.write()' },
      { pattern: /innerHTML\s*=/i, label: 'innerHTML assignment' },
      { pattern: /eval\s*\(/i, label: 'eval()' },
    ]

    const found: string[] = []
    for (const { pattern, label } of dangerousPatterns) {
      if (pattern.test(html)) found.push(label)
    }

    if (found.length > 0) {
      results.push({
        checkId: 'injection-xss-patterns',
        name: 'XSS-Prone JS Patterns',
        severity: 'medium',
        status: 'fail',
        detail: `Detected potentially unsafe JS: ${found.join(', ')}. These can enable XSS if user input reaches them.`,
        fix: 'Replace innerHTML with textContent, avoid eval(), use DOMPurify to sanitize any user-supplied HTML.',
        score: 5,
      })
    } else {
      results.push({
        checkId: 'injection-xss-ok',
        name: 'No Obvious XSS Patterns',
        severity: 'info',
        status: 'pass',
        detail: 'No high-risk JS patterns (eval, innerHTML, document.write) found in page source.',
        score: 0,
      })
    }

    // Check 3: CSP header
    const csp = ctx.headers['content-security-policy']
    if (!csp) {
      results.push({
        checkId: 'injection-no-csp',
        name: 'Content Security Policy Missing',
        severity: 'medium',
        status: 'fail',
        detail: 'No CSP header found. Without CSP, XSS attacks have no browser-level mitigation.',
        fix: "Add a Content-Security-Policy header. Start with: Content-Security-Policy: default-src 'self'",
        fixPrompt: cspMissingPrompt(ctx.stack),
        score: 5,
      })
    } else {
      const isWeak = csp.includes("'unsafe-inline'") || csp.includes("'unsafe-eval'")
      if (isWeak) {
        results.push({
          checkId: 'injection-weak-csp',
          name: 'Weak CSP Policy',
          severity: 'medium',
          status: 'fail',
          detail: "CSP contains 'unsafe-inline' or 'unsafe-eval' — these defeat much of CSP's protection.",
          fix: "Remove 'unsafe-inline' and 'unsafe-eval'. Use nonces or hashes for inline scripts instead.",
          fixPrompt: cspWeakPrompt(ctx.stack),
          score: 4,
        })
      } else {
        results.push({
          checkId: 'injection-csp-ok',
          name: 'Content Security Policy',
          severity: 'info',
          status: 'pass',
          detail: 'CSP header present with no obviously weak directives.',
          score: 0,
        })
      }
    }

    return results
  },
}