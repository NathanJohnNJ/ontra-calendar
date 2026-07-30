'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/theme-context'

export function ClockWidget() {
  const { clockType, setClockType } = useTheme()
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!time) return null

  const hours = time.getHours()
  const minutes = time.getMinutes()
  const seconds = time.getSeconds()

  return (
    <div className="flex flex-col items-center gap-4">
      {clockType === 'digital' ? (
        <div className="text-5xl font-bold font-mono tracking-tighter">
          {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      ) : (
        <div className="relative w-40 h-40 rounded-full border-4 border-primary bg-card flex items-center justify-center">
          <div className="absolute w-1 h-12 bg-foreground rounded-full origin-bottom" 
               style={{
                 transform: `rotate(${(hours % 12) * 30 + (minutes / 60) * 30}deg)`,
                 bottom: '50%',
               }}
          />
          <div className="absolute w-0.5 h-16 bg-foreground rounded-full origin-bottom"
               style={{
                 transform: `rotate(${minutes * 6 + (seconds / 60) * 6}deg)`,
                 bottom: '50%',
               }}
          />
          <div className="absolute w-1 h-20 bg-red-500 rounded-full origin-bottom"
               style={{
                 transform: `rotate(${seconds * 6}deg)`,
                 bottom: '50%',
               }}
          />
          <div className="absolute w-3 h-3 bg-foreground rounded-full" />
        </div>
      )}
      <button
        onClick={() => setClockType(clockType === 'digital' ? 'analog' : 'digital')}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Switch to {clockType === 'digital' ? 'analog' : 'digital'}
      </button>
    </div>
  )
}
