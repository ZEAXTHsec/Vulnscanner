'use client'

import { useState } from 'react'
import { ScanResult } from '@/lib/types'

interface Props { results: ScanResult[]; url?: string; timestamp?: string }
type Filter = 'all' | 'fail' | 'high' | 'medium' | 'low'

const SEV_COLOR: Record<string, string> = { high: 'var(--red)', medium: 'var(--orange)', low: 'var(--yellow)', info: 'var(--blue)' }
const SEV_BG: Record<string, string>    = { high: 'var(--red-dim)', medium: 'var(--orange-dim)', low: 'var(--yellow-dim)', info: 'var(--blue-dim)' }

const BotSVG = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/>
    <line x1="8" y1="15" x2="8" y2="15"/><line x1="16" y1="15" x2="16" y2="15"/>
  </svg>
)
const CheckSVG = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const DownloadSVG = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

function StatusDot({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: JSX.Element }> = {
    pass: { color: 'var(--accent)', icon: (
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    )},
    fail: { color: 'var(--red)', icon: (
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    )},
    skip: { color: 'var(--text-muted)', icon: (
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    )},
  }
  const s = map[status] ?? map.skip
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '20px', height: '20px', borderRadius: '50%',
      background: s.color + '16',
      border: `1px solid ${s.color}38`,
      color: s.color,
    }}>{s.icon}</span>
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
    { key: 'all',    label: `All (${results.length})` },
    { key: 'fail',   label: `Issues (${failCount})` },
    { key: 'high',   label: 'Critical' },
    { key: 'medium', label: 'Medium' },
    { key: 'low',    label: 'Low' },
  ]

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: '5px 13px', fontSize: '0.76rem', fontWeight: 600,
            border: '1px solid',
            borderColor: filter === key ? 'var(--accent)' : 'var(--border-mid)',
            borderRadius: '999px',
            background: filter === key ? 'var(--accent-dim)' : 'transparent',
            color: filter === key ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-ui)',
          }}>{label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={handleDownload} style={{
          padding: '5px 13px', fontSize: '0.76rem', fontWeight: 600,
          border: '1px solid var(--border-mid)', borderRadius: '999px',
          background: 'transparent', color: 'var(--text-muted)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
          transition: 'all 0.15s', fontFamily: 'var(--font-ui)',
        }}>
          <DownloadSVG /> Export JSON
        </button>
      </div>

      {filtered.length === 0 ? (
        <div style={{
          padding: '3rem', textAlign: 'center',
          color: 'var(--text-muted)', fontSize: '0.86rem',
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
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['', 'Check', 'Severity', 'Detail', 'Fix', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 15px', textAlign: 'left',
                    fontWeight: 600, fontSize: '0.68rem',
                    color: 'var(--text-muted)', letterSpacing: '0.06em',
                    textTransform: 'uppercase',
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
                    background: isOdd ? 'rgba(255,255,255,0.01)' : 'transparent',
                    verticalAlign: 'top',
                  }}>
                    <td style={{ padding: '11px 15px' }}><StatusDot status={r.status} /></td>

                    <td style={{ padding: '11px 15px', fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--text)', fontSize: '0.83rem' }}>
                      {r.name}
                    </td>

                    <td style={{ padding: '11px 15px' }}>
                      <span style={{
                        background: SEV_BG[r.severity] ?? 'transparent',
                        color: SEV_COLOR[r.severity] ?? 'var(--text-muted)',
                        padding: '2px 8px', borderRadius: '999px',
                        fontSize: '0.65rem', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                      }}>{r.severity}</span>
                    </td>

                    <td style={{ padding: '11px 15px', color: 'var(--text-sub)', maxWidth: '280px', lineHeight: '1.55', fontSize: '0.8rem' }}>
                      {r.detail}
                    </td>

                    <td style={{ padding: '11px 15px', color: 'var(--accent-2)', fontSize: '0.78rem', maxWidth: '200px', lineHeight: '1.55' }}>
                      {r.fix ? (
                        longFix ? (
                          <span>
                            {isExp ? r.fix : r.fix.slice(0, 80) + '…'}{' '}
                            <button onClick={() => toggle(r.checkId)} style={{
                              background: 'none', border: 'none',
                              color: 'var(--accent)', cursor: 'pointer',
                              fontSize: '0.73rem', padding: 0, fontWeight: 600,
                            }}>{isExp ? 'less' : 'more'}</button>
                          </span>
                        ) : r.fix
                      ) : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                    </td>

                    <td style={{ padding: '11px 15px', whiteSpace: 'nowrap' }}>
                      {r.fixPrompt && r.status === 'fail' && (
                        <button onClick={() => handleCopy(r.checkId, r.fixPrompt!)} style={{
                          padding: '4px 10px', fontSize: '0.7rem', fontWeight: 600,
                          border: '1px solid',
                          borderColor: copied === r.checkId ? 'rgba(34,211,168,0.35)' : 'var(--border-mid)',
                          borderRadius: '6px',
                          background: copied === r.checkId ? 'var(--accent-dim)' : 'transparent',
                          color: copied === r.checkId ? 'var(--accent)' : 'var(--text-muted)',
                          cursor: 'pointer', transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', gap: '4px',
                          fontFamily: 'var(--font-ui)',
                        }}>
                          {copied === r.checkId ? <CheckSVG /> : <BotSVG />}
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