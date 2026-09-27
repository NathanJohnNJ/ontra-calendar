'use client'

import { useEffect, useState } from 'react'
import { Pause, Play, StopCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { startTimerSession, stopTimerSession, getActiveTimerSessions } from '@/app/actions/calendar'

interface TimerSession {
  goalId: string
  eventId: string
  eventTitle: string
  isRunning: boolean
  elapsedSeconds: number
  sessionId?: string
}

interface CurrentTimersProps {
  date: string
  onTimerUpdate?: () => void
}

export function CurrentTimers({ date, onTimerUpdate }: CurrentTimersProps) {
  const [timers, setTimers] = useState<TimerSession[]>([])
  const [activeSessions, setActiveSessions] = useState<Map<string, Date>>(new Map())

  useEffect(() => {
    const loadActiveSessions = async () => {
      try {
        const sessions = await getActiveTimerSessions(date)
        const active = new Map()
        sessions.forEach((session: any) => {
          active.set(session.id, new Date(session.sessionStart))
        })
        setActiveSessions(active)
      } catch (error) {
        console.error('Failed to load active sessions:', error)
      }
    }

    loadActiveSessions()
    const interval = setInterval(loadActiveSessions, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [date])

  // Update elapsed time for active timers
  useEffect(() => {
    const updateTimers = () => {
      setTimers((prevTimers) =>
        prevTimers.map((timer) => {
          if (timer.isRunning && timer.sessionId && activeSessions.has(timer.sessionId)) {
            const start = activeSessions.get(timer.sessionId)!
            const elapsed = Math.floor((Date.now() - start.getTime()) / 1000)
            return { ...timer, elapsedSeconds: elapsed }
          }
          return timer
        }),
      )
    }

    const interval = setInterval(updateTimers, 1000)
    return () => clearInterval(interval)
  }, [activeSessions])

  const handleStartTimer = async (goalId: string, eventId: string, eventTitle: string) => {
    try {
      const sessionId = await startTimerSession(goalId, eventId)
      const newTimer: TimerSession = {
        goalId,
        eventId,
        eventTitle,
        isRunning: true,
        elapsedSeconds: 0,
        sessionId,
      }
      setTimers([...timers, newTimer])
      setActiveSessions(new Map(activeSessions).set(sessionId, new Date()))
      onTimerUpdate?.()
    } catch (error) {
      console.error('Failed to start timer:', error)
    }
  }

  const handleStopTimer = async (sessionId: string | undefined) => {
    if (!sessionId) return
    try {
      await stopTimerSession(sessionId)
      setTimers(timers.filter((t) => t.sessionId !== sessionId))
      const newActive = new Map(activeSessions)
      newActive.delete(sessionId)
      setActiveSessions(newActive)
      onTimerUpdate?.()
    } catch (error) {
      console.error('Failed to stop timer:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold mb-3">Active Timers</h3>
      {timers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active timers</p>
      ) : (
        <div className="space-y-2">
          {timers.map((timer) => (
            <div key={timer.sessionId} className="flex items-center justify-between bg-muted p-3 rounded">
              <div>
                <p className="text-sm font-medium">{timer.eventTitle}</p>
                <p className="text-lg font-mono font-bold text-primary">{formatTime(timer.elapsedSeconds)}</p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => handleStopTimer(timer.sessionId)}
                >
                  <StopCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
