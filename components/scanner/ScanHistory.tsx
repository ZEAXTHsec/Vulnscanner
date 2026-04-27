'use client'

// components/scanner/ScanHistory.tsx
// Shows recent scans. Uses the local store (store/index.ts) as primary source
// so results appear instantly after a scan, without a Supabase round-trip.
// On mount, if the store is empty, falls back to Supabase to load server-side history.

import { useEffect, useState } from 'react'
import { ScanReport } from '@/lib/types'
import { initStore, getHistory, subscribe } from '@/store/index'
import { supabase } from '@/lib/supabase'

interface ScanRow {
  id: string
  url: string
  score: number
  high: number
  medium: number
  low: number
  created_at: string
}

function reportToRow(r: ScanReport): ScanRow {
  return {
    id: r.scanId,
    url: r.url,
    score: r.summary.score,
    high: r.summary.high,
    medium: r.summary.medium,
    low: r.summary.low,
    created_at: r.timestamp,
  }
}

function scoreColor(score: number) {
  return score >= 80 ? 'var(--accent)' : score >= 50 ? 'var(--orange)' : 'var(--red)'
}

const ClockSVG = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

export default function ScanHistory() {
  const [scans, setScans] = useState<ScanRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initStore()
    const storeHistory = getHistory()

    if (storeHistory.length > 0) {
      setScans(storeHistory.map(reportToRow))
      setLoading(false)
    } else {
      supabase
        .from('scans')
        .select('id, url, score, high, medium, low, created_at')
        .order('created_at', { ascending: false })
        .limit(10)
        .then(({ data, error }) => {
          if (!error && data) setScans(data as ScanRow[])
          setLoading(false)
        })
    }

    const unsubscribe = subscribe(() => {
      const updated = getHistory()
      if (updated.length > 0) setScans(updated.map(reportToRow))
    })

    return unsubscribe
  }, [])

  if (loading) return (
    <div style={{
      margin: '2rem 0',
      padding: '20px 24px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      color: 'var(--text-muted)', fontSize: '0.88rem',
      fontFamily: 'var(--font-mono)',
    }}>
      Loading scan history…
    </div>
  )

  if (scans.length === 0) return null

  const COLS = ['URL', 'Score', 'Critical', 'Medium', 'Low', 'Date']

  return (
    <section style={{ marginBottom: '80px' }}>
      {/* Heading */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '20px' }}>
        <span style={{ color: 'var(--text-muted)', display: 'flex' }}><ClockSVG /></span>
        <h2 style={{
          fontSize: '1.1rem', fontWeight: 700,
          color: 'var(--text)', letterSpacing: '-0.02em', margin: 0,
        }}>Recent Scans</h2>
        <span style={{
          padding: '2px 10px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-mid)',
          borderRadius: '999px',
          fontSize: '0.7rem', fontWeight: 600,
          color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
        }}>{scans.length}</span>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-mid)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 80px 80px 80px 60px 120px',
          padding: '11px 20px',
          borderBottom: '1px solid var(--border-mid)',
          background: 'var(--bg-elevated)',
        }}>
          {COLS.map(h => (
            <div key={h} style={{
              fontSize: '0.7rem', fontWeight: 700,
              color: 'var(--text-muted)', letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {scans.map((scan, i) => (
          <div
            key={scan.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 80px 80px 80px 60px 120px',
              padding: '13px 20px',
              borderBottom: i < scans.length - 1 ? '1px solid var(--border)' : 'none',
              background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              alignItems: 'center',
              transition: 'background 0.15s',
            }}
          >
            {/* URL */}
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.83rem',
              color: 'var(--accent)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              paddingRight: '16px',
            }}>
              {scan.url.replace(/https?:\/\//, '')}
            </div>

            {/* Score */}
            <div>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem', fontWeight: 700,
                color: scoreColor(scan.score),
              }}>{scan.score}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>/100</span>
            </div>

            {/* Critical */}
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.88rem',
              fontWeight: 700,
              color: scan.high > 0 ? 'var(--red)' : 'var(--text-dim)',
            }}>{scan.high}</div>

            {/* Medium */}
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.88rem',
              fontWeight: 700,
              color: scan.medium > 0 ? 'var(--orange)' : 'var(--text-dim)',
            }}>{scan.medium}</div>

            {/* Low */}
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.88rem',
              fontWeight: 600,
              color: scan.low > 0 ? 'var(--yellow)' : 'var(--text-dim)',
            }}>{scan.low}</div>

            {/* Date */}
            <div style={{
              fontSize: '0.78rem', color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}>
              {new Date(scan.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}