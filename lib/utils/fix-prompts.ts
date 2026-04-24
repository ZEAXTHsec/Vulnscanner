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