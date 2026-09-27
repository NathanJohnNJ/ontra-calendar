'use client'

import { memo, useEffect, useState } from 'react'
import { Clock, Clock12 } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'

export const ClockWidget = memo(function ClockWidget() {
  const { clockType, setClockType } = useTheme()
  const [time, setTime] = useState<Date | null>(null)

  // Align the interval to the next second boundary so ticks stay in sync with
  // real time (and don't drift). The state lives only inside this memoized
  // component, so its per-second render never propagates to siblings.
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined
    const timeout = setTimeout(() => {
      setTime(new Date())
      interval = setInterval(() => setTime(new Date()), 1000)
    }, 1000 - (Date.now() % 1000))
    return () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
    }
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
          {/* Hands rotate via CSS custom properties + will-change so updates are
              composited on the GPU instead of triggering layout/paint work. */}
          <div className="absolute w-1 h-12 bg-foreground rounded-full origin-bottom will-change-transform"
               style={{
                 transform: `rotate(calc(var(--h) * 1deg))`,
                 ['--h' as any]: (hours % 12) * 30 + (minutes / 60) * 30,
                 bottom: '50%',
               }}
          />
          <div className="absolute w-0.5 h-16 bg-foreground rounded-full origin-bottom will-change-transform"
               style={{
                 transform: `rotate(calc(var(--m) * 1deg))`,
                 ['--m' as any]: minutes * 6 + (seconds / 60) * 6,
                 bottom: '50%',
               }}
          />
          <div className="absolute w-1 h-20 bg-red-500 rounded-full origin-bottom will-change-transform"
               style={{
                 transform: `rotate(calc(var(--s) * 1deg))`,
                 ['--s' as any]: seconds * 6,
                 bottom: '50%',
               }}
          />
          <div className="absolute w-3 h-3 bg-foreground rounded-full" />
        </div>
      )}
      <button
        onClick={() => setClockType(clockType === 'digital' ? 'analog' : 'digital')}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
        title={`Switch to ${clockType === 'digital' ? 'analog' : 'digital'} clock`}
      >
        {clockType === 'digital' ? <Clock12 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
      </button>
    </div>
  )
})
