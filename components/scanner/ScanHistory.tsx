// components/scanner/ScanHistory.tsx

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

export default function ScanHistory() {
  const [scans, setScans] = useState<ScanRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialise the store from localStorage
    initStore()

    const storeHistory = getHistory()

    if (storeHistory.length > 0) {
      // Store has data — use it immediately, no Supabase needed
      setScans(storeHistory.map(reportToRow))
      setLoading(false)
    } else {
      // Store is empty (first visit / cleared) — pull from Supabase
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

    // Subscribe to store changes so new scans appear instantly
    const unsubscribe = subscribe(() => {
      const updated = getHistory()
      if (updated.length > 0) {
        setScans(updated.map(reportToRow))
      }
    })

    return unsubscribe
  }, [])

  const scoreColor = (score: number) =>
    score >= 80 ? '#22c55e' : score >= 50 ? '#f97316' : '#ef4444'

  if (loading) return (
    <div style={{ marginTop: '3rem', color: '#888' }}>Loading scan history...</div>
  )

  if (scans.length === 0) return (
    <div style={{ marginTop: '3rem', color: '#888' }}>No scans yet. Run your first scan above.</div>
  )

  return (
    <div style={{ marginTop: '3rem' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>📋 Recent Scans</h2>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['URL', 'Score', 'High', 'Medium', 'Low', 'Date'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scans.map((scan, i) => (
              <tr key={scan.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{scan.url}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ color: scoreColor(scan.score), fontWeight: 700 }}>{scan.score}</span>
                </td>
                <td style={{ padding: '12px 16px', color: '#ef4444', fontWeight: 600 }}>{scan.high}</td>
                <td style={{ padding: '12px 16px', color: '#f97316', fontWeight: 600 }}>{scan.medium}</td>
                <td style={{ padding: '12px 16px', color: '#eab308', fontWeight: 600 }}>{scan.low}</td>
                <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.8rem' }}>
                  {new Date(scan.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}