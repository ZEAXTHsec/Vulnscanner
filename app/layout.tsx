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
          href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap"
          rel="stylesheet"
        />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          :root {
            --bg:            #07090f;
            --bg-card:       #0c1018;
            --bg-elevated:   #101620;
            --bg-hover:      #141c28;
            --border:        rgba(255,255,255,0.06);
            --border-mid:    rgba(255,255,255,0.10);
            --border-bright: rgba(255,255,255,0.16);
            --text:          #e2e8f4;
            --text-muted:    #5a6a82;
            --text-dim:      #2d3d55;
            --accent:        #00e587;
            --accent-2:      #00b8d9;
            --accent-dim:    rgba(0,229,135,0.10);
            --accent-glow:   rgba(0,229,135,0.20);
            --red:           #ff4d6a;
            --red-dim:       rgba(255,77,106,0.12);
            --orange:        #ff8c42;
            --orange-dim:    rgba(255,140,66,0.12);
            --yellow:        #f5c842;
            --yellow-dim:    rgba(245,200,66,0.12);
            --blue:          #4da6ff;
            --blue-dim:      rgba(77,166,255,0.10);
            --font-display:  'Syne', sans-serif;
            --font-body:     'DM Sans', sans-serif;
            --font-mono:     'DM Mono', monospace;
            --radius:        12px;
            --radius-lg:     18px;
          }
          html { font-size: 16px; -webkit-font-smoothing: antialiased; scroll-behavior: smooth; }
          body {
            background: var(--bg);
            color: var(--text);
            font-family: var(--font-body);
            font-size: 0.9rem;
            line-height: 1.6;
            min-height: 100vh;
          }
          ::-webkit-scrollbar { width: 5px; }
          ::-webkit-scrollbar-track { background: var(--bg); }
          ::-webkit-scrollbar-thumb { background: var(--border-bright); border-radius: 99px; }
          ::selection { background: var(--accent-dim); color: var(--accent); }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes scanLine {
            0%   { transform: translateY(-100%); opacity: 0; }
            10%  { opacity: 0.6; }
            90%  { opacity: 0.6; }
            100% { transform: translateY(1200%); opacity: 0; }
          }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
          @keyframes shimmerBar { 0% { left: -100%; } 100% { left: 200%; } }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}