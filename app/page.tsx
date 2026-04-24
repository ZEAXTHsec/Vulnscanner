import ScanInput from '@/components/scanner/ScanInput'
import ScanHistory from '@/components/scanner/ScanHistory'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem', height: '56px',
        background: 'rgba(7,9,15,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.1rem' }}>🛡</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1rem',
            letterSpacing: '-0.01em',
            color: 'var(--text)',
          }}>
            Shield<span style={{ color: 'var(--accent)' }}>Scan</span>
          </span>
          <span style={{
            marginLeft: '6px',
            padding: '1px 7px',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(0,229,135,0.2)',
            borderRadius: '999px',
            fontSize: '0.65rem',
            fontWeight: 600,
            color: 'var(--accent)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>Beta</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '7px', height: '7px',
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'inline-block',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>23 checks running now</span>
        </div>
      </nav>

      {/* Main */}
      <main style={{ flex: 1, padding: '0 1.5rem 4rem', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
        <ScanInput />
        <ScanHistory />
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '1.2rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          © 2025 ShieldScan
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          23 security checks · No data stored · Results in ~10s
        </span>
      </footer>
    </div>
  )
}