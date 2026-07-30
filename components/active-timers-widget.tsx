'use client'

import { useEffect, useState } from 'react'
import { Play, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnalogStopwatch } from './analog-stopwatch'
import { getGoalsForDate, getEventsForDateWithRecurring, startTimerSession, stopTimerSession } from '@/app/actions/calendar'

interface Goal {
  id: string
  title?: string
  eventId: string
  goalTimeMinutes: number
}

interface TimerSession {
  id: string
  goalId: string
  elapsedSeconds: number
  isRunning: boolean
}

interface ActiveTimersWidgetProps {
  date: string
  onAddGoal?: () => void
}

export function ActiveTimersWidget({ date, onAddGoal }: ActiveTimersWidgetProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [goalsWithEvents, setGoalsWithEvents] = useState<Map<string, any>>(new Map())
  const [timerSessions, setTimerSessions] = useState<Map<string, TimerSession>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [elapsedTime, setElapsedTime] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    loadGoals()
  }, [date])

  useEffect(() => {
    const interval = setInterval(() => {
      // Update elapsed time for running timers
      setElapsedTime((prev) => {
        const updated = new Map(prev)
        timerSessions.forEach((session) => {
          if (session.isRunning) {
            updated.set(session.goalId, (updated.get(session.goalId) || 0) + 1)
          }
        })
        return updated
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timerSessions])

  const loadGoals = async () => {
    setIsLoading(true)
    try {
      const goalsData = await getGoalsForDate(date)
      const eventsData = await getEventsForDateWithRecurring(date)

      // Create a map of event titles by event ID
      const eventMap = new Map(eventsData.map((e: any) => [e.id, e]))

      // Create goal objects with event information
      const goalsWithTitles: Goal[] = goalsData.map((goal: any) => ({
        id: goal.id,
        eventId: goal.eventId,
        goalTimeMinutes: goal.goalTimeMinutes,
        title: eventMap.get(goal.eventId)?.title || 'Untitled Goal',
      }))

      setGoals(goalsWithTitles)
      setGoalsWithEvents(eventMap)

      // Initialize timer sessions for all goals (even at 0 seconds)
      const sessions = new Map<string, TimerSession>()
      goalsWithTitles.forEach((goal) => {
        sessions.set(goal.id, {
          id: `${goal.id}-session`,
          goalId: goal.id,
          elapsedSeconds: 0,
          isRunning: false,
        })
      })
      setTimerSessions(sessions)
    } catch (error) {
      console.error('Failed to load goals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartTimer = async (goalId: string) => {
    try {
      const session = timerSessions.get(goalId)
      if (session) {
        // Update session to running
        const updated = new Map(timerSessions)
        updated.set(goalId, { ...session, isRunning: true })
        setTimerSessions(updated)
      }
    } catch (error) {
      console.error('Failed to start timer:', error)
    }
  }

  const handleStopTimer = async (goalId: string) => {
    try {
      const session = timerSessions.get(goalId)
      if (session) {
        // Update session to stopped
        const updated = new Map(timerSessions)
        updated.set(goalId, { ...session, isRunning: false })
        setTimerSessions(updated)
      }
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
    return `${minutes}:${String(secs).padStart(2, '0')}`
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading timers...</p>
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {/* Timer widgets for each goal */}
        {goals.map((goal) => {
          const session = timerSessions.get(goal.id)
          const elapsed = elapsedTime.get(goal.id) || session?.elapsedSeconds || 0

          return (
            <div
              key={goal.id}
              className="bg-card rounded-lg border border-border p-2 flex flex-col items-center justify-center gap-1"
            >
              <AnalogStopwatch seconds={elapsed} size={40} />
              <div className="text-center min-w-0">
                <p className="text-xs font-mono">{formatTime(elapsed)}</p>
                <p className="text-xs text-muted-foreground truncate">{goal.title || 'Goal'}</p>
              </div>
              {!session?.isRunning ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => handleStartTimer(goal.id)}
                >
                  <Play className="h-3 w-3" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => handleStopTimer(goal.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )
        })}

        {/* Add new goal button */}
        <button
          onClick={onAddGoal}
          className="bg-card rounded-lg border border-dashed border-border p-2 flex items-center justify-center hover:bg-muted transition-colors"
          title="Add new goal"
        >
          <div className="w-10 h-10 rounded-full border-2 border-muted-foreground flex items-center justify-center">
            <Plus className="h-5 w-5 text-muted-foreground" />
          </div>
        </button>
      </div>
    </div>
  )
}
