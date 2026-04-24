'use client'

import { useState } from 'react'
import { ScanResult } from '@/lib/types'

interface Props { results: ScanResult[]; url?: string; timestamp?: string }
type Filter = 'all' | 'fail' | 'high' | 'medium' | 'low'

const SEV_COLOR: Record<string, string> = {
  high: 'var(--red)', medium: 'var(--orange)', low: 'var(--yellow)', info: 'var(--blue)',
}
const SEV_BG: Record<string, string> = {
  high: 'var(--red-dim)', medium: 'var(--orange-dim)', low: 'var(--yellow-dim)', info: 'var(--blue-dim)',
}

function statusDot(status: string) {
  const map: Record<string, { color: string; label: string }> = {
    pass: { color: 'var(--accent)', label: '✓' },
    fail: { color: 'var(--red)', label: '✗' },
    skip: { color: 'var(--text-muted)', label: '–' },
  }
  const s = map[status] ?? map.skip
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '22px', height: '22px',
      borderRadius: '50%',
      background: s.color + '18',
      border: `1px solid ${s.color}40`,
      color: s.color, fontSize: '0.7rem', fontWeight: 700,
    }}>{s.label}</span>
  )
}

export default function ResultsTable({ results, url, timestamp }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState<string | null>(null)

  const toggle = (id: string) => setExpanded(p => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  const handleCopy = (id: string, prompt: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(id); setTimeout(() => setCopied(null), 2000)
    })
  }

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify({ url, scannedAt: timestamp, results }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `scan-${(url ?? 'scan').replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.json`
    a.click()
  }

  const failCount = results.filter(r => r.status === 'fail').length
  const filtered = results.filter(r => {
    if (filter === 'all') return true
    if (filter === 'fail') return r.status === 'fail'
    return r.severity === filter && r.status === 'fail'
  })

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: `All (${results.length})` },
    { key: 'fail', label: `Issues (${failCount})` },
    { key: 'high', label: 'Critical' },
    { key: 'medium', label: 'Medium' },
    { key: 'low', label: 'Low' },
  ]

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: '5px 14px', fontSize: '0.78rem', fontWeight: 600,
            border: '1px solid',
            borderColor: filter === key ? 'var(--accent)' : 'var(--border-mid)',
            borderRadius: '999px',
            background: filter === key ? 'var(--accent-dim)' : 'transparent',
            color: filter === key ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}>{label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={handleDownload} style={{
          padding: '5px 14px', fontSize: '0.78rem', fontWeight: 600,
          border: '1px solid var(--border-mid)', borderRadius: '999px',
          background: 'transparent', color: 'var(--text-muted)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
          transition: 'all 0.15s',
        }}>⬇ Export JSON</button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '3rem', textAlign: 'center',
          color: 'var(--text-muted)', fontSize: '0.88rem',
          background: 'var(--bg-card)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}>No results match this filter.</div>
      ) : (
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: 'var(--bg-card)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['', 'Check', 'Severity', 'Detail', 'Fix', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '11px 16px', textAlign: 'left',
                    fontWeight: 600, fontSize: '0.72rem',
                    color: 'var(--text-muted)', letterSpacing: '0.05em',
                    textTransform: 'uppercase', whiteSpace: 'nowrap',
                    background: 'var(--bg-elevated)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const isExp = expanded.has(r.checkId)
                const longFix = r.fix && r.fix.length > 80
                const isOdd = i % 2 !== 0

                return (
                  <tr key={r.checkId + i} style={{
                    borderBottom: '1px solid var(--border)',
                    background: isOdd ? 'rgba(255,255,255,0.012)' : 'transparent',
                    transition: 'background 0.1s',
                    verticalAlign: 'top',
                  }}>
                    <td style={{ padding: '12px 16px' }}>{statusDot(r.status)}</td>

                    <td style={{
                      padding: '12px 16px', fontWeight: 600,
                      whiteSpace: 'nowrap', color: 'var(--text)',
                      fontFamily: r.status === 'fail' ? 'inherit' : 'inherit',
                    }}>{r.name}</td>

                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: SEV_BG[r.severity] ?? 'transparent',
                        color: SEV_COLOR[r.severity] ?? 'var(--text-muted)',
                        padding: '3px 9px', borderRadius: '999px',
                        fontSize: '0.68rem', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}>{r.severity}</span>
                    </td>

                    <td style={{
                      padding: '12px 16px', color: 'var(--text-muted)',
                      maxWidth: '300px', lineHeight: '1.5', fontSize: '0.83rem',
                    }}>{r.detail}</td>

                    <td style={{
                      padding: '12px 16px', color: 'var(--accent-2)',
                      fontSize: '0.8rem', maxWidth: '220px', lineHeight: '1.5',
                    }}>
                      {r.fix ? (
                        longFix ? (
                          <span>
                            {isExp ? r.fix : r.fix.slice(0, 80) + '…'}{' '}
                            <button onClick={() => toggle(r.checkId)} style={{
                              background: 'none', border: 'none',
                              color: 'var(--accent)', cursor: 'pointer',
                              fontSize: '0.75rem', padding: 0, fontWeight: 600,
                            }}>{isExp ? 'less' : 'more'}</button>
                          </span>
                        ) : r.fix
                      ) : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                    </td>

                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      {r.fixPrompt && r.status === 'fail' && (
                        <button onClick={() => handleCopy(r.checkId, r.fixPrompt!)} style={{
                          padding: '5px 11px', fontSize: '0.72rem', fontWeight: 600,
                          border: '1px solid',
                          borderColor: copied === r.checkId ? 'rgba(0,229,135,0.4)' : 'var(--border-mid)',
                          borderRadius: '7px',
                          background: copied === r.checkId ? 'var(--accent-dim)' : 'transparent',
                          color: copied === r.checkId ? 'var(--accent)' : 'var(--text-muted)',
                          cursor: 'pointer', transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', gap: '4px',
                        }}>
                          {copied === r.checkId ? '✓' : '🤖'}{' '}
                          {copied === r.checkId ? 'Copied' : 'Ask AI'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}