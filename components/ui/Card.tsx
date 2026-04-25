'use client'

import { useEffect, useRef } from 'react'

interface CardProps {
  children: React.ReactNode
  /** delay in ms for staggered entrance animations */
  delay?: number
  /** accent colour for the top border line */
  accentColor?: string
  /** whether to show the animated shimmer border on hover */
  shimmer?: boolean
  className?: string
  style?: React.CSSProperties
}

export default function Card({
  children,
  delay = 0,
  accentColor,
  shimmer = false,
  style,
}: CardProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onEnter = () => {
      el.style.transform = 'translateY(-3px)'
      el.style.borderColor = 'var(--border-bright)'
      el.style.boxShadow = 'var(--shadow-card), 0 0 24px rgba(0,212,170,0.08)'
    }
    const onLeave = () => {
      el.style.transform = 'translateY(0)'
      el.style.borderColor = 'var(--border-mid)'
      el.style.boxShadow = 'var(--shadow-card)'
    }

    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <>
      <style>{`
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(14px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes shimmerSweep {
          0%   { background-position: -300% 0; }
          100% { background-position: 300% 0; }
        }
        .shield-card {
          position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border-mid);
          border-radius: var(--radius-lg);
          padding: 20px;
          box-shadow: var(--shadow-card);
          transition: transform 0.22s cubic-bezier(0.22,1,0.36,1),
                      border-color 0.22s ease,
                      box-shadow 0.22s ease;
          animation: cardReveal 0.4s cubic-bezier(0.22,1,0.36,1) both;
          overflow: hidden;
        }
        .shield-card-shimmer::after {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(0,212,170,0.12) 50%,
            transparent 70%
          );
          background-size: 300% 100%;
          animation: shimmerSweep 2.8s ease infinite;
          pointer-events: none;
          z-index: 1;
        }
        .shield-card-accent-bar {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          opacity: 0.7;
        }
      `}</style>
      <div
        ref={ref}
        className={`shield-card${shimmer ? ' shield-card-shimmer' : ''}`}
        style={{
          animationDelay: `${delay}ms`,
          ...style,
        }}
      >
        {accentColor && (
          <div
            className="shield-card-accent-bar"
            style={{ background: accentColor }}
          />
        )}
        {children}
      </div>
    </>
  )
}