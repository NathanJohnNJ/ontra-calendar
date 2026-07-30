'use client'

import { useEffect, useState } from 'react'

interface AnalogStopwatchProps {
  seconds: number
  size?: number
}

export function AnalogStopwatch({ seconds, size = 48 }: AnalogStopwatchProps) {
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    // Calculate rotation: 6 degrees per second (360 / 60 = 6)
    setRotation((seconds % 60) * 6)
  }, [seconds])

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
          }}
        />

        {/* Tick marks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30) * (Math.PI / 180)
          const x1 = 50 + 42 * Math.sin(angle)
          const y1 = 50 - 42 * Math.cos(angle)
          const x2 = 50 + 45 * Math.sin(angle)
          const y2 = 50 - 45 * Math.cos(angle)

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.5"
            />
          )
        })}
      </svg>
    </div>
  )
}
