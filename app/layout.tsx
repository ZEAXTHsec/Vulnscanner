import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ShieldScan — Instant Security Analysis',
  description: 'Find vulnerabilities in 30 seconds. AI-powered fixes for your stack.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          :root {
            --bg:            #04060d;
            --bg-card:       #080c16;
            --bg-elevated:   #0c1120;
            --bg-hover:      #101726;
            --border:        rgba(255,255,255,0.055);
            --border-mid:    rgba(255,255,255,0.085);
            --border-bright: rgba(255,255,255,0.14);
            --text:          #dde4f0;
            --text-sub:      #8899b0;
            --text-muted:    #4a5a70;
            --text-dim:      #243040;
            --accent:        #22d3a8;
            --accent-2:      #38bdf8;
            --accent-dim:    rgba(34,211,168,0.08);
            --accent-glow:   rgba(34,211,168,0.22);
            --red:           #f0516a;
            --red-dim:       rgba(240,81,106,0.09);
            --orange:        #fb923c;
            --orange-dim:    rgba(251,146,60,0.09);
            --yellow:        #fbbf24;
            --yellow-dim:    rgba(251,191,36,0.09);
            --blue:          #60a5fa;
            --blue-dim:      rgba(96,165,250,0.09);
            --font-ui:       'Space Grotesk', -apple-system, sans-serif;
            --font-mono:     'Space Mono', 'Fira Code', monospace;
            --radius:        8px;
            --radius-lg:     14px;
            --radius-xl:     20px;
          }
          html { font-size: 16px; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
          body {
            background: var(--bg);
            color: var(--text);
            font-family: var(--font-ui);
            font-size: 0.9rem;
            line-height: 1.65;
            min-height: 100vh;
          }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
          ::selection { background: rgba(34,211,168,0.18); color: var(--accent); }

          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(18px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes scanLine {
            0%   { top: -2px; opacity: 0; }
            4%   { opacity: 0.9; }
            96%  { opacity: 0.9; }
            100% { top: calc(100% + 2px); opacity: 0; }
          }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
          @keyframes spin   { to { transform: rotate(360deg); } }
          @keyframes badgePop {
            from { opacity: 0; transform: translateX(10px) scale(0.95); }
            to   { opacity: 1; transform: translateX(0)    scale(1); }
          }
          @keyframes glowPulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.75; } }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}