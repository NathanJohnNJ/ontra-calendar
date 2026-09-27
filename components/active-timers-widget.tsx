'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Play, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnalogStopwatch } from './analog-stopwatch'
import { getGoalsForDate, startTimerSession, stopTimerSession } from '@/app/actions/calendar'
import type { TimerSession as DbTimerSession } from '@/app/db/types'

export interface TimerGoal {
  id: string
  title?: string
  eventId: string
  goalTimeMinutes: number
}

interface RuntimeSession {
  dbSessionId: string | null
  goalId: string
  isRunning: boolean
  /** Epoch ms of the most recent "start" tick (null while paused). */
  startedAt: number | null
  /** Seconds accumulated across previous run segments. */
  baseSeconds: number
}

interface ActiveTimersWidgetProps {
  date: string
  onAddGoal?: () => void
  /** Pre-computed by the server so the first paint shows real timers. */
  initialGoals?: TimerGoal[]
  /** Open DB sessions for the date; elapsed time is derived from their timestamps. */
  initialSessions?: DbTimerSession[]
  disabled?: boolean
}

const EMPTY_MAP = new Map<string, RuntimeSession>()

function buildRuntimeState(
  goals: TimerGoal[],
  openDbSessions?: DbTimerSession[],
): Map<string, RuntimeSession> {
  const sessions = new Map<string, RuntimeSession>()
  const byGoal = new Map((openDbSessions ?? []).map((s) => [s.goalId, s]))

  for (const goal of goals) {
    const dbSession = byGoal.get(goal.id)
    if (dbSession) {
      // Resume a server-side running session: derive elapsed from its start timestamp.
      sessions.set(goal.id, {
        dbSessionId: dbSession.id,
        goalId: goal.id,
        isRunning: true,
        startedAt: dbSession.sessionStart.getTime(),
        baseSeconds: 0,
      })
    } else {
      sessions.set(goal.id, {
        dbSessionId: null,
        goalId: goal.id,
        isRunning: false,
        startedAt: null,
        baseSeconds: 0,
      })
    }
  }
  return sessions
}

export const ActiveTimersWidget = memo(function ActiveTimersWidget({
  date,
  onAddGoal,
  initialGoals = [],
  initialSessions = [],
  disabled = false,
}: ActiveTimersWidgetProps) {
  const [goals, setGoals] = useState<TimerGoal[]>(initialGoals)
  const [sessions, setSessions] = useState<Map<string, RuntimeSession>>(
    initialGoals.length > 0 ? buildRuntimeState(initialGoals, initialSessions) : EMPTY_MAP,
  )
  const [isLoading, setIsLoading] = useState(initialGoals.length === 0)
  // Single per-second "tick". Elapsed time is DERIVED from timestamps instead of
  // being incremented inside a second Map — one tiny state update per second drives
  // the whole widget, with no Map churn and no interval recreation each tick.
  const [, setTick] = useState(0)
  const sessionsRef = useRef(sessions)
  sessionsRef.current = sessions
  const eventByGoalRef = useRef(new Map(initialGoals.map((g) => [g.id, g.eventId])))

  // Mount once with server-provided data (no loading flash); only refetch when
  // the visible date actually changes.
  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const goalsData = await getGoalsForDate(date)
        if (cancelled) return
        eventByGoalRef.current = new Map(goalsData.map((g) => [g.id, g.eventId]))
        setGoals(goalsData)
        setSessions(buildRuntimeState(goalsData))
      } catch (error) {
        console.error('Failed to load goals:', error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    // Skip the initial fetch when the server already handed us the data.
    if (initialGoals.length === 0) {
      load()
    }
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  // The interval only exists while at least one timer is running, and it is
  // created exactly once per start/stop transition (not every second).
  const anyRunning = [...sessions.values()].some((s) => s.isRunning)
  useEffect(() => {
    if (!anyRunning) return
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [anyRunning])

  const handleStartTimer = useCallback(async (goalId: string) => {
    const prev = sessionsRef.current.get(goalId)
    if (!prev || prev.isRunning) return
    // Optimistic local update first — UI responds instantly.
    const updated = new Map(sessionsRef.current)
    updated.set(goalId, { ...prev, isRunning: true, startedAt: Date.now() })
    setSessions(updated)
    try {
      const sessionId = await startTimerSession(goalId, eventByGoalRef.current.get(goalId) ?? goalId)
      const after = new Map(sessionsRef.current)
      const cur = after.get(goalId)
      if (cur) after.set(goalId, { ...cur, dbSessionId: sessionId })
      setSessions(after)
    } catch (error) {
      console.error('Failed to persist timer session:', error)
    }
  }, [])

  const handleStopTimer = useCallback(async (goalId: string) => {
    const prev = sessionsRef.current.get(goalId)
    if (!prev || !prev.isRunning) return
    // Freeze the current segment into baseSeconds synchronously.
    const segmentSeconds = prev.startedAt
      ? Math.floor((Date.now() - prev.startedAt) / 1000)
      : 0
    const updated = new Map(sessionsRef.current)
    updated.set(goalId, {
      ...prev,
      isRunning: false,
      startedAt: null,
      baseSeconds: prev.baseSeconds + segmentSeconds,
    })
    setSessions(updated)
    if (prev.dbSessionId) {
      try {
        await stopTimerSession(prev.dbSessionId)
        const after = new Map(sessionsRef.current)
        const cur = after.get(goalId)
        if (cur) after.set(goalId, { ...cur, dbSessionId: null })
        setSessions(after)
      } catch (error) {
        console.error('Failed to stop timer session:', error)
      }
    }
  }, [])

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading timers...</p>
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {/* Timer widgets for each goal */}
        {goals.map((goal) => (
          <TimerCard
            key={goal.id}
            goal={goal}
            session={sessions.get(goal.id)}
            onStart={handleStartTimer}
  onStop={handleStopTimer}
  disabled={disabled}
  />
        ))}

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
})

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

function elapsedOf(session: RuntimeSession | undefined): number {
  if (!session) return 0
  if (session.isRunning && session.startedAt !== null) {
    return session.baseSeconds + Math.floor((Date.now() - session.startedAt) / 1000)
  }
  return session.baseSeconds
}

// Memoized row: only re-renders when its own goal/session reference changes.
const TimerCard = memo(function TimerCard({
  goal,
  session,
  onStart,
  onStop,
  disabled = false,
}: {
  goal: TimerGoal
  session: RuntimeSession | undefined
  onStart: (goalId: string) => void
  onStop: (goalId: string) => void
  disabled?: boolean
}) {
  const elapsed = elapsedOf(session)

  return (
    <div className="bg-card rounded-lg border border-border p-2 flex flex-col items-center justify-center gap-1">
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
  onClick={() => onStart(goal.id)}
  disabled={disabled}
  >
          <Play className="h-3 w-3" />
        </Button>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
  onClick={() => onStop(goal.id)}
  disabled={disabled}
  >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
})
