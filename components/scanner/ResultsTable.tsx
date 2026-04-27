'use client'

import { useState } from 'react'
import type React from 'react'
import { ScanResult } from '@/lib/types'

interface Props { results: ScanResult[]; url?: string; timestamp?: string }
type Filter = 'all' | 'fail' | 'high' | 'medium' | 'low'

const SEV_COLOR: Record<string, string>  = { high: 'var(--red)', medium: 'var(--orange)', low: 'var(--yellow)', info: 'var(--blue)' }
const SEV_BG: Record<string, string>     = { high: 'var(--red-dim)', medium: 'var(--orange-dim)', low: 'var(--yellow-dim)', info: 'var(--blue-dim)' }
const SEV_BORDER: Record<string, string> = { high: 'rgba(255,77,106,0.16)', medium: 'rgba(255,140,66,0.16)', low: 'rgba(255,201,77,0.16)', info: 'rgba(77,166,255,0.13)' }

const BotSVG      = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="16" y1="15" x2="16" y2="15"/></svg>
const CheckSVG    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const DownloadSVG = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const ChevronSVG  = ({ open }: { open: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const WarnSVG   = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const WrenchSVG = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>

function StatusDot({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: React.ReactNode }> = {
    pass: { color: 'var(--accent)', icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
    fail: { color: 'var(--red)',    icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> },
    skip: { color: 'var(--text-muted)', icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg> },
  }
  const s = map[status] ?? map.skip
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '24px', height: '24px', borderRadius: '50%',
      background: s.color + '16', border: `1px solid ${s.color}38`, color: s.color,
      flexShrink: 0,
    }}>{s.icon}</span>
  )
}

function ResultRow({ r, index }: { r: ScanResult; index: number }) {
  const [open, setOpen]     = useState(false)
  const [copied, setCopied] = useState(false)

  const isFail   = r.status === 'fail'
  const color    = SEV_COLOR[r.severity] ?? 'var(--text-muted)'
  const bg       = SEV_BG[r.severity] ?? 'transparent'
  const border   = isFail ? (SEV_BORDER[r.severity] ?? 'var(--border)') : 'var(--border)'
  const hasBody  = isFail && (r.detail || r.fix || r.fixPrompt)

  const handleCopy = () => {
    if (!r.fixPrompt) return
    navigator.clipboard.writeText(r.fixPrompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{
      border: `1px solid ${border}`,
      borderRadius: 'var(--radius)',
      background: index % 2 === 0 ? 'var(--bg-card)' : 'rgba(255,255,255,0.01)',
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      <div
        onClick={() => hasBody && setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '13px 18px',
          cursor: hasBody ? 'pointer' : 'default',
        }}
      >
        <StatusDot status={r.status} />
        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', flex: 1, letterSpacing: '-0.01em' }}>
          {r.name}
        </span>
        <span style={{
          background: bg, color,
          padding: '3px 10px', borderRadius: '999px',
          fontSize: '0.67rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
        }}>{r.severity}</span>
        {hasBody && (
          <span style={{ color: 'var(--text-dim)', display: 'flex', flexShrink: 0 }}>
            <ChevronSVG open={open} />
          </span>
        )}
      </div>

      {open && hasBody && (
        <div style={{
          borderTop: `1px solid ${border}`,
          padding: '16px 18px 16px 54px',
          display: 'flex', gap: '20px', flexWrap: 'wrap',
          background: 'var(--bg-elevated)',
        }}>
          {r.detail && (
            <div style={{ flex: '1', minWidth: '200px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px',
                color, fontSize: '0.68rem', fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                <WarnSVG /> Risk
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-sub)', lineHeight: '1.7' }}>
                {r.detail}
              </p>
            </div>
          )}

          {r.detail && r.fix && (
            <div style={{ width: '1px', background: 'var(--border)', alignSelf: 'stretch', flexShrink: 0 }} />
          )}

          {r.fix && (
            <div style={{ flex: '1', minWidth: '200px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px',
                color: 'var(--accent)', fontSize: '0.68rem', fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                <WrenchSVG /> Fix
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-sub)', lineHeight: '1.7' }}>
                {r.fix}
              </p>
            </div>
          )}

          {r.fixPrompt && (
            <div style={{ width: '100%', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <button onClick={handleCopy} style={{
                padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600,
                border: '1px solid',
                borderColor: copied ? 'rgba(34,211,168,0.35)' : 'var(--border-mid)',
                borderRadius: '8px',
                background: copied ? 'var(--accent-dim)' : 'transparent',
                color: copied ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'inline-flex', alignItems: 'center', gap: '7px',
              }}>
                {copied ? <CheckSVG /> : <BotSVG />}
                {copied ? 'Copied — paste into AI chat' : 'Copy AI fix prompt'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ResultsTable({ results, url, timestamp }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify({ url, scannedAt: timestamp, results }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `scan-${(url ?? 'scan').replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.json`
    a.click()
  }

  const failCount = results.filter(r => r.status === 'fail').length
  const filtered  = results.filter(r => {
    if (filter === 'all')    return true
    if (filter === 'fail')   return r.status === 'fail'
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
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: '6px 16px', fontSize: '0.8rem', fontWeight: 600,
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
          padding: '6px 16px', fontSize: '0.8rem', fontWeight: 600,
          border: '1px solid var(--border-mid)', borderRadius: '999px',
          background: 'transparent', color: 'var(--text-muted)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          transition: 'all 0.15s',
        }}>
          <DownloadSVG /> Export JSON
        </button>
      </div>

      {filtered.length === 0 ? (
        <div style={{
          padding: '3.5rem', textAlign: 'center',
          color: 'var(--text-muted)', fontSize: '0.92rem',
          background: 'var(--bg-card)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}>No results match this filter.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {filtered.map((r, i) => (
            <ResultRow key={r.checkId + i} r={r} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}