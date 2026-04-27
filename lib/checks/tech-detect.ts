// lib/checks/tech-detect.ts

import { Check, ScanContext, ScanResult } from '@/lib/types'

interface TechSignature {
  name: string
  category: string
  detect: (ctx: ScanContext) => boolean
}

const SIGNATURES: TechSignature[] = [
  // Servers
  { name: 'Nginx', category: 'Server', detect: (ctx) => ctx.headers['server']?.toLowerCase().includes('nginx') ?? false },
  { name: 'Apache', category: 'Server', detect: (ctx) => ctx.headers['server']?.toLowerCase().includes('apache') ?? false },
  { name: 'Cloudflare', category: 'CDN', detect: (ctx) => !!ctx.headers['cf-ray'] },

  // Frameworks
  { name: 'Next.js', category: 'Framework', detect: (ctx) => ctx.headers['x-powered-by']?.includes('Next') ?? ctx.html.includes('__NEXT_DATA__') },
  { name: 'WordPress', category: 'CMS', detect: (ctx) => ctx.html.includes('/wp-content/') || ctx.html.includes('/wp-includes/') },
  { name: 'Shopify', category: 'E-Commerce', detect: (ctx) => ctx.html.includes('cdn.shopify.com') },
  { name: 'Wix', category: 'Website Builder', detect: (ctx) => ctx.html.includes('static.wixstatic.com') },
  { name: 'Squarespace', category: 'Website Builder', detect: (ctx) => ctx.html.includes('squarespace.com') },

  // JS Libraries
  { name: 'React', category: 'JS Library', detect: (ctx) => ctx.html.includes('react') || ctx.html.includes('__react') },
  { name: 'jQuery', category: 'JS Library', detect: (ctx) => ctx.html.includes('jquery') },
  { name: 'Vue.js', category: 'JS Library', detect: (ctx) => ctx.html.includes('vue.') || ctx.html.includes('__vue') },

  // Analytics
  { name: 'Google Analytics', category: 'Analytics', detect: (ctx) => ctx.html.includes('google-analytics.com') || ctx.html.includes('gtag') },
  { name: 'Hotjar', category: 'Analytics', detect: (ctx) => ctx.html.includes('hotjar.com') },
]

export const techDetectCheck: Check = {
  id: 'tech-detection',
  name: 'Technology Detection',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const detected: string[] = []

    for (const sig of SIGNATURES) {
      try {
        if (sig.detect(ctx)) {
          detected.push(`${sig.name} (${sig.category})`)
        }
      } catch {
        // signature check failed silently
      }
    }

    if (detected.length === 0) {
      return [{
        checkId: 'tech-none',
        name: 'Technology Detection',
        severity: 'info',
        status: 'pass',
        detail: 'No known technologies detected from HTML/headers.',
      }]
    }

    return [{
      checkId: 'tech-detected',
      name: 'Technology Stack',
      severity: 'info',
      status: 'pass',
      detail: `Detected: ${detected.join(', ')}`,
      raw: { detected },
    }]
  },
}