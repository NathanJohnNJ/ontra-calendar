'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getEventsForDateWithRecurring, getDayStats } from '@/app/actions/calendar'
import { EventTimerList } from './event-timer-list'

interface Event {
  id: string
  title: string
  eventType: string
  startTime?: string
  endTime?: string
  description?: string
}

interface DayViewProps {
  date: string
  onBack: () => void
}

export function DayView({ date, onBack }: DayViewProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [stats, setStats] = useState({ totalMinutes: 0, sessionCount: 0 })
  const [isLoading, setIsLoading] = useState(true)

  const formattedDate = new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  useEffect(() => {
    loadData()
  }, [date])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [loadedEvents, dayStats] = await Promise.all([
        getEventsForDateWithRecurring(date),
        getDayStats(date),
      ])
      setEvents(loadedEvents)
      setStats(dayStats)
    } catch (error) {
      console.error('Failed to load day data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (time?: string) => {
    if (!time) return ''
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  // Show every 4 hours unless there are events, then show more detail
  const hasEvents = events.length > 0
  const hourSlots = hasEvents 
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 6 }, (_, i) => i * 4)

  return (
    <div className="min-h-screen bg-background p-4 transition-all duration-300 ease-out">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <Button
          variant="ghost"
          className="mb-4 flex items-center gap-1"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to calendar
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">{formattedDate}</h1>
            <p className="text-muted-foreground mt-2">
              {stats.totalMinutes} minutes tracked across {stats.sessionCount} sessions
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid grid-cols-4 gap-6">
        {/* Day Schedule Timeline */}
        <div className="col-span-3">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-6">Day Schedule</h2>

            {isLoading ? (
              <p className="text-muted-foreground">Loading schedule...</p>
            ) : (
              <div className="space-y-2">
                {hourSlots.map((hour) => {
                  const hourEvents = events.filter((event) => {
                    if (!event.startTime) return false
                    const eventHour = parseInt(event.startTime.split(':')[0])
                    return eventHour === hour
                  })

                  return (
                    <div key={hour} className="flex gap-4">
                      <div className="w-16 text-xs text-muted-foreground font-medium pt-2">
                        {String(hour).padStart(2, '0')}:00
                      </div>
                      <div className="flex-1 space-y-1">
                        {hourEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`p-3 rounded text-sm ${
                              event.eventType === 'goal_based'
                                ? 'bg-primary/10 border-l-2 border-primary'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="font-medium">{event.title}</p>
                            {event.startTime && event.endTime && (
                              <p className="text-xs text-muted-foreground">
                                {formatTime(event.startTime)} - {formatTime(event.endTime)}
                              </p>
                            )}
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Tasks & Stats */}
        <div className="space-y-6">
          {/* Tasks */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold mb-3">Tasks for Today</h3>
            <EventTimerList date={date} onTimerStarted={loadData} />
          </div>

          {/* Day Stats */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold mb-3">Today&apos;s Progress</h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Total Time</p>
                <p className="text-2xl font-bold">
                  {Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sessions</p>
                <p className="text-xl font-semibold">{stats.sessionCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
