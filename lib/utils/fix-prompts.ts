// lib/utils/fix-prompts.ts
// Stack-aware AI prompt templates for each major vulnerability check.
// These prompts are designed to be pasted into an AI assistant (ChatGPT, Claude, etc.)
// and produce copy-paste-ready, project-specific fixes.

import { DetectedStack } from './detect-stack'

function stackHint(stack: DetectedStack): string {
  const parts: string[] = []
  if (stack.framework !== 'unknown') parts.push(`Framework: ${stack.framework}`)
  if (stack.hosting  !== 'unknown') parts.push(`Hosting: ${stack.hosting}`)
  if (stack.webserver !== 'unknown') parts.push(`Web server: ${stack.webserver}`)
  return parts.length ? `My stack: ${parts.join(', ')}.` : ''
}

// ── CSP ───────────────────────────────────────────────────────────────────────

export function cspMissingPrompt(stack: DetectedStack): string {
  const hint = stackHint(stack)
  const extra = stack.framework === 'nextjs'
    ? ' Show me how to add it in next.config.js headers() and also as a middleware fallback.'
    : stack.framework === 'express'
    ? ' Show me how to add it via the helmet npm package.'
    : ''
  return `I need to add a Content-Security-Policy header to my website to protect against XSS attacks. ${hint}${extra} Give me a starter CSP policy with default-src 'self', and explain each directive. Show me the exact header string to deploy.`
}

export function cspWeakPrompt(stack: DetectedStack): string {
  const hint = stackHint(stack)
  return `My Content-Security-Policy uses 'unsafe-inline' and/or 'unsafe-eval', which weakens XSS protection. ${hint} How do I remove these? Explain how to use nonces or hashes for inline scripts instead, with a working example for my stack.`
}

// ── CORS ──────────────────────────────────────────────────────────────────────

export function corsWildcardCredentialsPrompt(stack: DetectedStack): string {
  const hint = stackHint(stack)
  return `My server returns Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true — this is a dangerous CORS misconfiguration. ${hint} Explain why this is a security risk, and show me how to fix it by restricting the allowed origin to a specific domain while keeping credentials working.`
}

export function corsWildcardPrompt(stack: DetectedStack): string {
  const hint = stackHint(stack)
  return `My API returns Access-Control-Allow-Origin: * which means any website can read the response. ${hint} When is this safe vs. dangerous? Show me how to restrict CORS to specific trusted origins, with code for my stack.`
}

// ── Headers ───────────────────────────────────────────────────────────────────

export function xFrameOptionsPrompt(stack: DetectedStack): string {
  const hint = stackHint(stack)
  const extra = stack.framework === 'nextjs'
    ? ' Show the next.config.js headers() approach and also the CSP frame-ancestors directive as a modern alternative.'
    : stack.webserver === 'nginx'
    ? ' Show the nginx.conf add_header line.'
    : stack.webserver === 'apache'
    ? ' Show the Apache .htaccess Header always set line.'
    : ''
  return `My website is missing the X-Frame-Options header, leaving it vulnerable to clickjacking. ${hint}${extra} Give me the exact header to add, and explain when to use X-Frame-Options vs. CSP frame-ancestors.`
}

export function xContentTypeOptionsPrompt(stack: DetectedStack): string {
  const hint = stackHint(stack)
  return `My website is missing the X-Content-Type-Options: nosniff header. ${hint} Explain what MIME-sniffing attacks are, why this header prevents them, and show me exactly where and how to add it for my stack.`
}

export function referrerPolicyPrompt(stack: DetectedStack): string {
  const hint = stackHint(stack)
  return `My website is missing a Referrer-Policy header. ${hint} Explain what data leaks this prevents, and give me the recommended Referrer-Policy value with the exact header to add. Show me the difference between strict-origin, no-referrer, and strict-origin-when-cross-origin.`
}

export function permissionsPolicyPrompt(stack: DetectedStack): string {
  const hint = stackHint(stack)
  return `My website is missing a Permissions-Policy header. ${hint} What browser features does this header control? Give me a sensible default Permissions-Policy that disables camera, microphone, geolocation, and payment unless needed, with the exact header string to deploy.`
}

// ── HSTS ──────────────────────────────────────────────────────────────────────

export function hstsPrompt(stack: DetectedStack): string {
  const hint = stackHint(stack)
  return `My website is missing a Strict-Transport-Security (HSTS) header. ${hint} Explain what HSTS does and how it prevents SSL stripping attacks. Give me the recommended header value with max-age. Should I include includeSubDomains and preload? Explain the risks of the preload directive before I add it.`
}

// ── DMARC / SPF ───────────────────────────────────────────────────────────────

export function dmarcMissingPrompt(stack: DetectedStack): string {
  const hint = stackHint(stack)
  return `My domain is missing a DMARC DNS record, which means anyone can send spoofed emails from my domain. ${hint} Explain how DMARC, SPF, and DKIM work together. Give me the exact DNS TXT records to add to start with a monitoring-only policy (p=none) and progress to enforcement (p=reject), with examples.`
}

export function spfMissingPrompt(stack: DetectedStack): string {
  const hint = stackHint(stack)
  return `My domain has no SPF record, so email receivers can't verify which servers are allowed to send mail from my domain. ${hint} Give me the exact DNS TXT record to add for SPF. How do I include my mail provider (e.g. Google Workspace, SendGrid, Mailgun)? What's the difference between ~all and -all?`
}

// ── SQL Injection ─────────────────────────────────────────────────────────────

export function sqliErrorLeakPrompt(stack: DetectedStack): string {
  const hint = stackHint(stack)
  return `My website is leaking SQL error messages in its HTML output — this exposes my database type, table structure, and query logic to attackers. ${hint} Explain exactly what an attacker can learn from these errors, and show me how to: 1) disable detailed DB errors in production, 2) set up generic error pages, and 3) log DB errors server-side only. Give me the exact config changes for my stack.`
}

export function sqliParamPrompt(stack: DetectedStack): string {
  const hint = stackHint(stack)
  return `My URL has query parameters (like ?id=, ?user=, ?page=) that may be passed directly to SQL queries. ${hint} Explain what SQL injection is, how an attacker would exploit these parameters, and show me: 1) how to use parameterised queries / prepared statements for my stack, 2) how to validate and sanitise input, 3) how to test if my app is actually vulnerable. Give me code examples.`
}

// ── Open Redirect ─────────────────────────────────────────────────────────────

export function openRedirectPrompt(stack: DetectedStack): string {
  const hint = stackHint(stack)
  return `My website has links with redirect parameters (like ?redirect=, ?next=, ?return_url=) pointing to external URLs. ${hint} Explain how attackers use open redirects for phishing — e.g. sending victims to evil.com via my trusted domain. Show me: 1) how to validate redirect destinations server-side with an allowlist, 2) how to detect and block off-domain redirects, 3) the exact code fix for my stack.`
}

// ── Server Version Leak ───────────────────────────────────────────────────────

export function serverVersionLeakPrompt(stack: DetectedStack): string {
  const hint = stackHint(stack)
  const extra = stack.webserver === 'nginx'
    ? ' Show the nginx.conf server_tokens off directive and where to place it.'
    : stack.webserver === 'apache'
    ? ' Show the Apache ServerTokens Prod and ServerSignature Off directives.'
    : ''
  return `My server header exposes the web server software and version number. ${hint}${extra} Explain why version disclosure helps attackers target CVEs. Show me how to suppress or genericise the Server header for my stack, and verify it's working.`
}

// ── Exposed Sensitive Files ───────────────────────────────────────────────────

export function exposedFilesHighPrompt(stack: DetectedStack): string {
  const hint = stackHint(stack)
  return `Critical files are publicly accessible on my server — including potential .env files, .git directories, or database configs. ${hint} This is a serious breach risk. Show me: 1) how to immediately block access via nginx/Apache/.htaccess, 2) how to verify the files are no longer accessible, 3) how to rotate any credentials that may have been exposed, and 4) how to prevent this in future deployments. Give me exact config blocks.`
}

export function exposedFilesMediumPrompt(stack: DetectedStack): string {
  const hint = stackHint(stack)
  return `Dependency and config files (like package.json, composer.json, or Gemfile) are publicly accessible on my server. ${hint} Explain what attackers learn from these files (dependency versions, known CVEs), and show me how to block access to them via server config. Give me the exact rules for my stack.`
}

// ── Rate Limiting ─────────────────────────────────────────────────────────────

export function rateLimitPrompt(stack: DetectedStack): string {
  const hint = stackHint(stack)
  const extra = stack.framework === 'nextjs'
    ? ' Show me how to add rate limiting in Next.js API routes using the `rate-limiter-flexible` package or Upstash Redis.'
    : stack.framework === 'express'
    ? ' Show me how to add `express-rate-limit` middleware to protect login and API routes.'
    : ''
  return `My website has no rate limiting on login or API endpoints, leaving it vulnerable to brute force and credential stuffing attacks. ${hint}${extra} Explain the attack scenarios, and show me: 1) how to implement rate limiting, 2) how to add account lockout after failed attempts, 3) how to add Cloudflare Turnstile (free CAPTCHA) to the login form.`
}

// ── XSS ───────────────────────────────────────────────────────────────────────

export function xssDomSinkPrompt(stack: DetectedStack): string {
  const hint = stackHint(stack)
  return `My page source contains DOM XSS sink patterns — code that can execute attacker-controlled JavaScript if URL parameters reach these sinks. ${hint} Explain DOM XSS: how an attacker crafts a URL to steal cookies or hijack sessions. Show me: 1) how to audit every DOM sink (innerHTML, outerHTML, document.write, eval), 2) how to use textContent instead of innerHTML, 3) how to add DOMPurify for any case where HTML must be inserted, and 4) how to test for DOM XSS with a browser devtools payload.`
}

// ── CSRF ─────────────────────────────────────────────────────────────────────

export function csrfPrompt(stack: DetectedStack): string {
  const hint = stackHint(stack)
  const extra = stack.framework === 'nextjs'
    ? ' Show me how to implement CSRF protection in Next.js API routes using the `csrf` package or SameSite cookies.'
    : stack.framework === 'express'
    ? ' Show me how to add `csurf` middleware to all form endpoints.'
    : ''
  return `My website has forms without CSRF tokens, making them vulnerable to cross-site request forgery. ${hint}${extra} Explain how CSRF attacks work — e.g. a malicious site silently submitting a form as a logged-in user. Show me how to add CSRF tokens to all forms and verify them server-side.`
}