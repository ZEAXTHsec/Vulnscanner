// lib/utils/detect-stack.ts
// Detects the tech stack from headers + HTML.
// Called once in runner.ts before checks run so fix prompts can be stack-aware.

export type DetectedStack = {
  framework: 'nextjs' | 'nuxt' | 'remix' | 'express' | 'laravel' | 'django' | 'rails' | 'wordpress' | 'unknown'
  hosting:   'vercel' | 'netlify' | 'cloudflare' | 'aws' | 'unknown'
  webserver: 'nginx' | 'apache' | 'iis' | 'unknown'
}

export function detectStack(headers: Record<string, string>, html: string): DetectedStack {
  const h = headers

  // ── Framework ──────────────────────────────────────────────────────────────
  let framework: DetectedStack['framework'] = 'unknown'

  if (html.includes('__NEXT_DATA__') || h['x-nextjs-cache'] || h['x-next-cache']) {
    framework = 'nextjs'
  } else if (html.includes('__nuxt') || html.includes('_nuxt/')) {
    framework = 'nuxt'
  } else if (html.includes('__remixContext') || html.includes('__remix_manifest')) {
    framework = 'remix'
  } else if (h['x-powered-by']?.toLowerCase().includes('express')) {
    framework = 'express'
  } else if (html.includes('laravel_session') || h['set-cookie']?.includes('laravel')) {
    framework = 'laravel'
  } else if (html.includes('csrfmiddlewaretoken') || h['x-frame-options'] === 'SAMEORIGIN' && html.includes('django')) {
    framework = 'django'
  } else if (html.includes('authenticity_token') || h['x-powered-by']?.toLowerCase().includes('phusion passenger')) {
    framework = 'rails'
  } else if (html.includes('/wp-content/') || html.includes('wp-json')) {
    framework = 'wordpress'
  }

  // ── Hosting ────────────────────────────────────────────────────────────────
  let hosting: DetectedStack['hosting'] = 'unknown'

  if (h['x-vercel-id'] || h['x-vercel-cache'] || h['server']?.includes('Vercel')) {
    hosting = 'vercel'
  } else if (h['x-nf-request-id'] || h['server']?.toLowerCase().includes('netlify')) {
    hosting = 'netlify'
  } else if (h['cf-ray'] || h['server']?.toLowerCase() === 'cloudflare') {
    hosting = 'cloudflare'
  } else if (h['x-amz-cf-id'] || h['x-amzn-requestid'] || h['server']?.includes('AmazonS3')) {
    hosting = 'aws'
  }

  // ── Web server ─────────────────────────────────────────────────────────────
  let webserver: DetectedStack['webserver'] = 'unknown'
  const server = (h['server'] ?? '').toLowerCase()

  if (server.includes('nginx'))  webserver = 'nginx'
  else if (server.includes('apache')) webserver = 'apache'
  else if (server.includes('iis') || server.includes('microsoft')) webserver = 'iis'

  return { framework, hosting, webserver }
}