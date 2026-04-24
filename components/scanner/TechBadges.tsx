'use client'

// components/scanner/TechBadges.tsx
// Parses tech-detect results out of the full results array and renders
// coloured category badges. If nothing was detected, renders nothing.
// Usage in ScanInput.tsx (add above ResultsTable):
//   <TechBadges results={report.results} />

import { ScanResult } from '@/lib/types'

interface Props {
  results: ScanResult[]
}

interface TechItem {
  name: string
  category: string
}

// Category → accent colour
const CATEGORY_COLOR: Record<string, string> = {
  Server:           '#6366f1',
  CDN:              '#0ea5e9',
  Framework:        '#8b5cf6',
  CMS:              '#ec4899',
  'E-Commerce':     '#f97316',
  'Website Builder':'#14b8a6',
  'JS Library':     '#f59e0b',
  Analytics:        '#10b981',
}

const DEFAULT_COLOR = '#6b7280'

function parseTech(results: ScanResult[]): TechItem[] {
  const techResult = results.find(
    (r) => r.checkId === 'tech-detected' && Array.isArray(r.raw?.detected)
  )
  if (!techResult) return []

  // raw.detected entries are "Name (Category)" strings
  return (techResult.raw!.detected as string[]).map((entry) => {
    const match = entry.match(/^(.+?)\s+\((.+?)\)$/)
    if (match) return { name: match[1], category: match[2] }
    return { name: entry, category: 'Other' }
  })
}

export default function TechBadges({ results }: Props) {
  const tech = parseTech(results)
  if (tech.length === 0) return null

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          marginBottom: '8px',
        }}
      >
        🛠 Detected Stack
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {tech.map(({ name, category }) => {
          const color = CATEGORY_COLOR[category] ?? DEFAULT_COLOR
          return (
            <span
              key={name}
              title={category}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: color + '15',
                color,
                border: `1px solid ${color}30`,
              }}
            >
              {name}
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 500,
                  opacity: 0.75,
                }}
              >
                {category}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}