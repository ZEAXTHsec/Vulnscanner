// lib/scanner/crawler.ts
// Bounded same-origin crawler.
// Respects MAX_CRAWL_DEPTH and MAX_PAGES from SCAN_CONFIG.
// Only follows same-origin <a href> links — no query explosions, no external domains,
// no file downloads. Returns pages crawled + endpoint count for UI display.

import { SCAN_CONFIG } from '@/lib/constants'
import { fetchTarget } from '@/lib/scanner/fetcher'
import { FetchResult } from '@/lib/types'

export interface CrawlResult {
  // The primary page (homepage) — used as the main ScanContext
  primary: FetchResult
  // All pages crawled including primary
  pages: FetchResult[]
  // Stats for UI display
  stats: {
    pagesCrawled: number
    endpointsTested: number
    linksFound: number
  }
}

const IGNORED_EXTENSIONS = /\.(pdf|zip|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|mp4|mp3|css|js|xml|json)$/i
const IGNORED_PREFIXES   = ['mailto:', 'tel:', 'javascript:', '#', 'data:']

function extractLinks(html: string, base: URL): string[] {
  const hrefs = html.match(/href=["']([^"']+)["']/gi) || []
  const links: string[] = []

  for (const attr of hrefs) {
    const match = attr.match(/href=["']([^"']+)["']/i)
    if (!match) continue
    const raw = match[1].trim()

    // Skip ignored prefixes
    if (IGNORED_PREFIXES.some(p => raw.startsWith(p))) continue

    // Skip file downloads
    if (IGNORED_EXTENSIONS.test(raw)) continue

    try {
      const resolved = new URL(raw, base)

      // Same origin only
      if (resolved.origin !== base.origin) continue

      // Drop query strings and fragments — prevents parameter explosions
      resolved.search = ''
      resolved.hash   = ''

      links.push(resolved.href)
    } catch {
      // Unparseable href — skip
    }
  }

  return links
}

function countEndpoints(pages: FetchResult[]): number {
  // Count unique paths across all crawled pages
  const paths = new Set<string>()
  for (const page of pages) {
    try {
      paths.add(new URL(page.url).pathname)
    } catch { /* skip */ }
  }
  return paths.size
}

export async function crawlTarget(startUrl: string): Promise<CrawlResult> {
  const base        = new URL(startUrl)
  const visited     = new Set<string>()
  const queue:      { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }]
  const pages:      FetchResult[] = []
  let   linksFound  = 0

  while (queue.length > 0 && pages.length < SCAN_CONFIG.MAX_PAGES) {
    const next = queue.shift()
    if (!next) break

    const { url, depth } = next
    const normalised = url.replace(/\/$/, '') || url

    if (visited.has(normalised)) continue
    visited.add(normalised)

    const result = await fetchTarget(url)

    // Skip failed fetches
    if (result.error || result.statusCode === 0) continue

    // Skip non-HTML responses (CSS, JSON APIs, etc.)
    const ct = result.headers['content-type'] ?? ''
    if (!ct.includes('text/html') && ct !== '') continue

    pages.push(result)

    // Stop expanding at max depth
    if (depth >= SCAN_CONFIG.MAX_CRAWL_DEPTH) continue

    // Expand links from this page
    const links = extractLinks(result.html, base)
    linksFound += links.length

    for (const link of links) {
      const normLink = link.replace(/\/$/, '') || link
      if (!visited.has(normLink) && pages.length + queue.length < SCAN_CONFIG.MAX_PAGES) {
        queue.push({ url: link, depth: depth + 1 })
      }
    }
  }

  // Also parse sitemap.xml for additional paths (non-blocking)
  try {
    const sitemapUrl = `${base.origin}/sitemap.xml`
    if (!visited.has(sitemapUrl)) {
      const sitemap = await fetchTarget(sitemapUrl)
      if (sitemap.statusCode === 200 && sitemap.html.includes('<loc>')) {
        const locs = sitemap.html.match(/<loc>([^<]+)<\/loc>/gi) || []
        linksFound += locs.length

        for (const loc of locs) {
          const url = loc.replace(/<\/?loc>/gi, '').trim()
          try {
            const resolved = new URL(url)
            if (resolved.origin === base.origin) {
              resolved.search = ''
              resolved.hash   = ''
              const norm = resolved.href.replace(/\/$/, '') || resolved.href
              if (!visited.has(norm) && pages.length + queue.length < SCAN_CONFIG.MAX_PAGES) {
                queue.push({ url: resolved.href, depth: 1 })
              }
            }
          } catch { /* skip */ }
        }
      }
    }
  } catch { /* sitemap is optional */ }

  // Drain remaining queue up to MAX_PAGES
  while (queue.length > 0 && pages.length < SCAN_CONFIG.MAX_PAGES) {
    const next = queue.shift()
    if (!next) break

    const normalised = next.url.replace(/\/$/, '') || next.url
    if (visited.has(normalised)) continue
    visited.add(normalised)

    const result = await fetchTarget(next.url)
    if (!result.error && result.statusCode !== 0) {
      const ct = result.headers['content-type'] ?? ''
      if (ct.includes('text/html') || ct === '') {
        pages.length < SCAN_CONFIG.MAX_PAGES && pages.push(result)
      }
    }
  }

  const primary = pages[0] ?? await fetchTarget(startUrl)

  return {
    primary,
    pages,
    stats: {
      pagesCrawled:    pages.length,
      endpointsTested: countEndpoints(pages),
      linksFound,
    },
  }
}