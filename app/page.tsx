import ScanInput from '@/components/scanner/ScanInput'
import ScanHistory from '@/components/scanner/ScanHistory'

const ShieldSVG = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const DotSVG = () => (
  <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
    <circle cx="3" cy="3" r="3"/>
  </svg>
)

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem', height: '50px',
        background: 'rgba(4,6,13,0.85)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--accent)' }}><ShieldSVG /></span>
          <span style={{ fontWeight: 700, fontSize: '0.93rem', letterSpacing: '-0.025em', color: 'var(--text)' }}>
            Shield<span style={{ color: 'var(--accent)' }}>Scan</span>
          </span>
          <span style={{
            marginLeft: '2px', padding: '2px 7px',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(34,211,168,0.18)',
            borderRadius: '999px',
            fontSize: '0.6rem', fontWeight: 700,
            color: 'var(--accent)', letterSpacing: '0.07em',
            textTransform: 'uppercase',
          }}>Beta</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent)', animation: 'pulse 2s ease-in-out infinite', display: 'flex' }}><DotSVG /></span>
          <span style={{ fontSize: '0.73rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>live</span>
        </div>
      </nav>

      {/* Main */}
      <main style={{ flex: 1, padding: '0 1.5rem 6rem', maxWidth: '940px', margin: '0 auto', width: '100%' }}>
        <ScanInput />
        <ScanHistory />
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '1rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
      }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          ShieldScan © 2025
        </span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
          23 security checks · no data stored
        </span>
      </footer>
    </div>
  )
}