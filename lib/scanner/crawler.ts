// lib/scanner/crawler.ts
// Bounded same-origin crawler.
// Respects MAX_CRAWL_DEPTH and MAX_PAGES from SCAN_CONFIG.
// Only follows same-origin <a href> links — no query explosions, no external domains,
// no file downloads. Returns pages crawled + endpoint count for UI display.

import { SCAN_CONFIG } from '@/lib/constants'
import { fetchTarget } from '@/lib/scanner/fetcher'
import { FetchResult } from '@/lib/types'

export interface CrawlResult {
  primary: FetchResult          // The primary page (homepage) — used as the main ScanContext
  pages:   FetchResult[]        // All pages crawled including primary
  stats: {
    pagesCrawled:    number
    endpointsTested: number
    linksFound:      number
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

    if (IGNORED_PREFIXES.some(p => raw.startsWith(p))) continue
    if (IGNORED_EXTENSIONS.test(raw)) continue

    try {
      const resolved = new URL(raw, base)
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
  const paths = new Set<string>()
  for (const page of pages) {
    try { paths.add(new URL(page.url).pathname) } catch { /* skip */ }
  }
  return paths.size
}

async function fetchIfHtml(url: string): Promise<FetchResult | null> {
  const result = await fetchTarget(url)
  if (result.error || result.statusCode === 0) return null
  const ct = result.headers['content-type'] ?? ''
  if (ct !== '' && !ct.includes('text/html')) return null
  return result
}

export async function crawlTarget(startUrl: string): Promise<CrawlResult> {
  const base       = new URL(startUrl)
  const visited    = new Set<string>()
  const queue:     { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }]
  const pages:     FetchResult[] = []
  let   linksFound = 0

  // ─── Main BFS loop ────────────────────────────────────────────────────────
  while (queue.length > 0 && pages.length < SCAN_CONFIG.MAX_PAGES) {
    const next = queue.shift()
    if (!next) break

    const { url, depth } = next
    const normalised = url.replace(/\/$/, '') || url

    if (visited.has(normalised)) continue
    visited.add(normalised)

    const result = await fetchIfHtml(url)
    if (!result) continue

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

  // ─── Sitemap supplement ───────────────────────────────────────────────────
  // Parse sitemap.xml for additional paths not discovered via link crawling.
  // Any new URLs go back into the queue; the main loop guard above handles the
  // remaining capacity — no separate drain loop needed.
  try {
    const sitemapUrl = `${base.origin}/sitemap.xml`
    if (!visited.has(sitemapUrl)) {
      visited.add(sitemapUrl)
      const sitemap = await fetchTarget(sitemapUrl)
      if (sitemap.statusCode === 200 && sitemap.html.includes('<loc>')) {
        const locs = sitemap.html.match(/<loc>([^<]+)<\/loc>/gi) || []
        linksFound += locs.length

        for (const loc of locs) {
          const rawUrl = loc.replace(/<\/?loc>/gi, '').trim()
          try {
            const resolved = new URL(rawUrl)
            if (resolved.origin === base.origin) {
              resolved.search = ''
              resolved.hash   = ''
              const norm = resolved.href.replace(/\/$/, '') || resolved.href
              if (!visited.has(norm) && pages.length < SCAN_CONFIG.MAX_PAGES) {
                visited.add(norm)
                const page = await fetchIfHtml(resolved.href)
                if (page) pages.push(page)
              }
            }
          } catch { /* skip */ }
        }
      }
    }
  } catch { /* sitemap is optional */ }

  // Fallback: if primary fetch failed entirely, re-fetch startUrl directly
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