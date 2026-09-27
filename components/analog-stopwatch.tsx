'use client'

import { memo } from 'react'

interface AnalogStopwatchProps {
  seconds: number
  size?: number
}

// Static tick marks computed once at module load — no per-render trig work.
const TICKS = Array.from({ length: 12 }).map((_, i) => {
  const angle = (i * 30) * (Math.PI / 180)
  return {
    x1: 50 + 42 * Math.sin(angle),
    y1: 50 - 42 * Math.cos(angle),
    x2: 50 + 45 * Math.sin(angle),
    y2: 50 - 45 * Math.cos(angle),
  }
})

// Pure presentational component: rotation is derived directly from props.
// (Previously it mirrored `seconds` into useState via useEffect, causing a
// redundant extra render pass for every tick.) Memoized so paused timers skip
// re-rendering entirely while other timers tick.
export const AnalogStopwatch = memo(function AnalogStopwatch({
  seconds,
  size = 48,
}: AnalogStopwatchProps) {
  const rotation = (seconds % 60) * 6

  return (
    <div className="flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="drop-shadow-sm"
      >
        {/* Outer circle */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.2" />

        {/* Center dot */}
        <circle cx="50" cy="50" r="3" fill="currentColor" />

        {/* Second hand (the main indicator) */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: '50px 50px',
            transition: 'transform 0.1s linear',
            willChange: 'transform',
          }}
        />

        {/* Tick marks */}
        {TICKS.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.5"
          />
        ))}
      </svg>
    </div>
  )
})
