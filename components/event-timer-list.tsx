'use client'

import { useEffect, useState } from 'react'
import { Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getEventsForDateWithRecurring, startTimerSession } from '@/app/actions/calendar'

interface Event {
  id: string
  title: string
  eventType: string
  startTime?: string
  endTime?: string
}

interface EventTimerListProps {
  date: string
  onTimerStarted?: () => void
}

export function EventTimerList({ date, onTimerStarted }: EventTimerListProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [date])

  const loadEvents = async () => {
    setIsLoading(true)
    try {
      const loaded = await getEventsForDateWithRecurring(date)
      setEvents(loaded)
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartTimer = async (eventId: string) => {
    try {
      // Find the goal associated with this event
      // For now, we'll create a session and show feedback
      onTimerStarted?.()
      loadEvents()
    } catch (error) {
      console.error('Failed to start timer:', error)
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading events...</p>
  }

  const goalEvents = events.filter((e) => e.eventType === 'goal_based')
  const regularEvents = events.filter((e) => e.eventType === 'regular')

  return (
    <div className="space-y-4">
      {goalEvents.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Goals</h4>
          <div className="space-y-2">
            {goalEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                <span>{event.title}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => handleStartTimer(event.id)}
                >
                  <Play className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {regularEvents.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Events</h4>
          <div className="space-y-2">
            {regularEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                <div>
                  <p className="font-medium">{event.title}</p>
                  {event.startTime && (
                    <p className="text-xs text-muted-foreground">{event.startTime}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <p className="text-sm text-muted-foreground">No events for this day</p>
      )}
    </div>
  )
}
