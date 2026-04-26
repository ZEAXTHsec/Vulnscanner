// lib/checks/xss.ts
// DOM-based XSS signal detection — identifies sink patterns, unsafe URL schemes,
// cross-origin message handling gaps, and prototype pollution vectors in page source.
// Does NOT overlap with injection.ts (which covers eval/innerHTML/document.write).

import { Check, ScanContext, ScanResult } from '@/lib/types'
import { xssDomSinkPrompt } from '@/lib/utils/fix-prompts'

interface XssSignal {
  pattern: RegExp
  label: string
  detail: string
  severity: 'high' | 'medium' | 'low'
  score: number
  // Optional second pattern — BOTH must match to fire (reduces false positives)
  confirmPattern?: RegExp
}

const DOM_SIGNALS: XssSignal[] = [
  {
    pattern: /href\s*=\s*["']?\s*javascript:/i,
    label: 'javascript: URL scheme',
    detail: 'href="javascript:..." can execute arbitrary JS when clicked — a classic DOM XSS vector.',
    severity: 'high',
    score: 8,
  },
  {
    pattern: /location\s*(?:\.href|\.replace|\.assign)\s*=\s*[^"'\s][^;]*(hash|search|param|query)/i,
    label: 'DOM-controlled location assignment',
    detail: 'location.href/replace/assign is set from URL-derived data (hash/search). An attacker can craft a URL to redirect victims to a javascript: scheme or external site.',
    severity: 'high',
    score: 8,
  },
  {
    pattern: /\.src\s*=\s*[^"';\n]*(?:location|hash|search|param|query)/i,
    label: 'DOM source assignment from URL data',
    detail: 'A script/iframe src is being set from URL-controlled input — potential script injection vector.',
    severity: 'high',
    score: 8,
  },
  {
    pattern: /document\.cookie\s*=[^;]+(?:unescape|decodeURI|location\.)/i,
    label: 'Cookie set from URL-derived value',
    detail: 'document.cookie is being assigned a value derived from the URL. An attacker-controlled URL could inject a session fixation payload.',
    severity: 'medium',
    score: 5,
  },
  {
    pattern: /postMessage\s*\(/i,
    label: 'postMessage usage detected',
    detail: 'postMessage is used. If the message handler does not validate the event.origin, cross-origin messages can trigger XSS or data theft.',
    severity: 'medium',
    score: 4,
  },
  {
    pattern: /addEventListener\s*\(\s*["']message["']/i,
    label: 'message event listener without visible origin check',
    detail: 'A message event listener is registered. Verify event.origin is checked before trusting the data.',
    severity: 'low',
    score: 3,
  },
  {
    pattern: /srcdoc\s*=/i,
    label: 'iframe srcdoc usage',
    detail: 'iframe srcdoc injects raw HTML into an iframe. If any part of that HTML is user-controlled, it is a direct XSS sink.',
    severity: 'medium',
    score: 5,
  },
  {
    // Minified frameworks (React, Closure, gws) set Object.prototype legitimately.
    // Require the proto access to appear near a user-input source to confirm exploit shape.
    pattern: /\.__proto__\s*=|Object\.prototype\[/i,
    confirmPattern: /(?:location|search|hash|param|query|input|request)[\s\S]{0,120}Object\.prototype|Object\.prototype[\s\S]{0,120}(?:location|search|hash|param|query|input)/i,
    label: 'Prototype pollution vector',
    detail: 'Code modifies __proto__ or Object.prototype in a context that appears to involve user-controlled input — a prototype pollution pattern that can lead to XSS or RCE.',
    severity: 'high',
    score: 7,
  },
  {
    pattern: /insertAdjacentHTML\s*\(/i,
    label: 'insertAdjacentHTML usage',
    detail: 'insertAdjacentHTML is a direct HTML-injection sink. If any argument is user-controlled it enables XSS.',
    severity: 'medium',
    score: 5,
  },
  {
    pattern: /outerHTML\s*=/i,
    label: 'outerHTML assignment',
    detail: 'outerHTML assignment is an HTML-injection sink. User-controlled values passed here enable DOM XSS.',
    severity: 'medium',
    score: 5,
  },
]

function hasOriginCheck(html: string): boolean {
  return (
    /event\.origin\s*[!=]==?\s*['"`]/.test(html) ||
    /e\.origin\s*[!=]==?\s*['"`]/.test(html) ||
    /allowedOrigin|trustedOrigin|ALLOWED_ORIGIN/i.test(html)
  )
}

export const xssCheck: Check = {
  id: 'xss',
  name: 'DOM XSS Vectors',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const results: ScanResult[] = []

    const strippedHtml = ctx.html
      .replace(/<script[^>]+type=["']application\/(?:json|ld\+json)["'][^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')

    const fired: string[] = []

    for (const sig of DOM_SIGNALS) {
      if (!sig.pattern.test(strippedHtml)) continue

      // Require confirmation pattern if defined
      if (sig.confirmPattern && !sig.confirmPattern.test(strippedHtml)) continue

      // postMessage — downgrade if origin check is present
      if (sig.label === 'postMessage usage detected' && hasOriginCheck(strippedHtml)) {
        results.push({
          checkId: 'xss-postmessage-ok',
          name: 'postMessage with Origin Check',
          severity: 'info',
          status: 'pass',
          detail: 'postMessage is used and an origin validation pattern was detected.',
          score: 0,
        })
        continue
      }

      // Skip message-listener check if postMessage already flagged
      if (
        sig.label === 'message event listener without visible origin check' &&
        fired.includes('postMessage usage detected')
      ) {
        continue
      }

      fired.push(sig.label)

      results.push({
        checkId: `xss-${sig.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: sig.label,
        severity: sig.severity,
        status: 'fail',
        detail: sig.detail,
        fix: 'Audit all DOM sinks. Never pass user-controlled data (URL params, hash, cookies) directly to HTML-injection sinks. Use textContent instead of innerHTML where possible, and validate postMessage origins.',
        fixPrompt: xssDomSinkPrompt(ctx.stack),
        score: sig.score,
      })
    }

    if (fired.length === 0) {
      results.push({
        checkId: 'xss-dom-ok',
        name: 'No DOM XSS Sinks Detected',
        severity: 'info',
        status: 'pass',
        detail: 'No high-risk DOM XSS patterns (javascript: URLs, srcdoc, outerHTML, prototype pollution, etc.) detected in page source.',
        score: 0,
      })
    }

    return results
  },
}