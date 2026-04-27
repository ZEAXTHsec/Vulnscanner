// lib/checks/mixed-content.ts

import { Check, ScanContext, ScanResult } from '@/lib/types'

interface MixedResource {
  tag: string
  url: string
  type: 'active' | 'passive'
}

const ACTIVE_SELECTORS: { tag: string; attr: string }[] = [
  { tag: 'script', attr: 'src' },
  { tag: 'link', attr: 'href' },
  { tag: 'iframe', attr: 'src' },
  { tag: 'object', attr: 'data' },
  { tag: 'embed', attr: 'src' },
]

const PASSIVE_SELECTORS: { tag: string; attr: string }[] = [
  { tag: 'img', attr: 'src' },
  { tag: 'audio', attr: 'src' },
  { tag: 'video', attr: 'src' },
  { tag: 'source', attr: 'src' },
]

function extractHttpResources(
  html: string,
  selectors: { tag: string; attr: string }[],
  type: 'active' | 'passive'
): MixedResource[] {
  const found: MixedResource[] = []
  for (const { tag, attr } of selectors) {
    const tagPattern = new RegExp(
      `<${tag}\\b[^>]*\\s${attr}=["'](http://[^"'\\s>]+)["']`,
      'gi'
    )
    let match: RegExpExecArray | null
    while ((match = tagPattern.exec(html)) !== null) {
      // Skip matches inside <script> blocks
      const before = html.slice(0, match.index)
      const openScripts: number = (before.match(/<script\b/gi) || []).length
      const closeScripts: number = (before.match(/<\/script>/gi) || []).length
      if (openScripts > closeScripts) continue
      found.push({ tag, url: match[1], type })
    }
  }
  return found
}

function extractInlineCssHttp(html: string): MixedResource[] {
  const found: MixedResource[] = []
  let m: RegExpExecArray | null
  const styleAttr = /style="[^"]*url\(['"]?(http:\/\/[^'")]+)['"]?\)/gi
  while ((m = styleAttr.exec(html)) !== null) {
    found.push({ tag: 'style[attr]', url: m[1], type: 'passive' })
  }
  const styleBlocks: string[] = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || []
  for (const block of styleBlocks) {
    const urlPattern = /url\(['"]?(http:\/\/[^'")]+)['"]?\)/gi
    while ((m = urlPattern.exec(block)) !== null) {
      found.push({ tag: 'style[block]', url: m[1], type: 'passive' })
    }
  }
  return found
}

export const mixedContentCheck: Check = {
  id: 'mixed-content',
  name: 'Mixed Content',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const results: ScanResult[] = []

    if (!ctx.url.startsWith('https://')) {
      results.push({
        checkId: 'mixed-content-skip',
        name: 'Mixed Content (N/A)',
        severity: 'info',
        status: 'skip',
        detail: 'Page is served over HTTP — mixed content check only applies to HTTPS pages.',
      })
      return results
    }

    const html = ctx.html
    const activeResources = extractHttpResources(html, ACTIVE_SELECTORS, 'active')
    const passiveResources = [
      ...extractHttpResources(html, PASSIVE_SELECTORS, 'passive'),
      ...extractInlineCssHttp(html),
    ]

    if (activeResources.length > 0) {
      const uniqueUrls = [...new Set(activeResources.map((r) => r.url))]
      const byTag = activeResources.reduce<Record<string, number>>((acc, r) => {
        acc[r.tag] = (acc[r.tag] ?? 0) + 1; return acc
      }, {})
      results.push({
        checkId: 'mixed-content-active',
        name: 'Active Mixed Content Detected',
        severity: 'high',
        status: 'fail',
        detail: `${activeResources.length} active resource(s) loaded over HTTP (${Object.entries(byTag).map(([t, c]) => `${c} <${t}>`).join(', ')}). Browsers block these. Example: ${uniqueUrls.slice(0, 3).join(', ')}`,
        fix: 'Change all resource URLs from http:// to https://.',
      })
    }

    if (passiveResources.length > 0) {
      const uniqueUrls = [...new Set(passiveResources.map((r) => r.url))]
      const byTag = passiveResources.reduce<Record<string, number>>((acc, r) => {
        acc[r.tag] = (acc[r.tag] ?? 0) + 1; return acc
      }, {})
      results.push({
        checkId: 'mixed-content-passive',
        name: 'Passive Mixed Content Detected',
        severity: 'medium',
        status: 'fail',
        detail: `${passiveResources.length} passive resource(s) (${Object.entries(byTag).map(([t, c]) => `${c} <${t}>`).join(', ')}) loaded over HTTP. Example: ${uniqueUrls.slice(0, 3).join(', ')}`,
        fix: 'Change all resource URLs from http:// to https:// or use protocol-relative URLs (//).',
      })
    }

    // Only scan inside <script> blocks for fetch/XHR — avoids false positives from HTML attributes
    const scriptBlocks: string[] = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi) || []
    const scriptContent = scriptBlocks.join('\n')
    const inlineHttpFetch: number = (scriptContent.match(/fetch\(['"]http:\/\/[^'"]+['"]/gi) || []).length
    const inlineHttpXhr: number = (scriptContent.match(/\.open\(['"][A-Z]+['"],\s*['"]http:\/\/[^'"]+['"]/gi) || []).length
    const inlineCount = inlineHttpFetch + inlineHttpXhr

    if (inlineCount > 0) {
      results.push({
        checkId: 'mixed-content-fetch',
        name: 'HTTP Endpoints in JS Fetch/XHR',
        severity: 'medium',
        status: 'fail',
        detail: `Found ${inlineCount} fetch()/XHR call(s) in inline scripts targeting HTTP endpoints. These will be blocked as mixed content.`,
        fix: 'Update all API/fetch endpoint URLs to use https://.',
      })
    }

    if (activeResources.length === 0 && passiveResources.length === 0 && inlineCount === 0) {
      results.push({
        checkId: 'mixed-content-ok',
        name: 'No Mixed Content Detected',
        severity: 'info',
        status: 'pass',
        detail: 'All resources appear to be loaded over HTTPS. No mixed content detected in page source.',
      })
    }

    return results
  },
}