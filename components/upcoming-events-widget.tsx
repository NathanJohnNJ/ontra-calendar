'use client'

import { CalendarDays } from 'lucide-react'

type UpcomingEvent = { id: string; title: string; startTime: string | null; endTime: string | null; color: string | null }

export function UpcomingEventsWidget({ events }: { events: UpcomingEvent[] }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2"><CalendarDays className="text-primary" aria-hidden="true" /><h3 className="text-sm font-semibold">Upcoming events</h3></div>
      {events.length ? <div className="flex min-h-0 flex-col gap-2 overflow-auto">{events.slice(0, 5).map((event) => <div key={event.id} className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2"><span className="size-2 shrink-0 rounded-full bg-primary" style={event.color ? { backgroundColor: event.color } : undefined} /><div className="min-w-0"><p className="truncate text-sm font-medium">{event.title}</p><p className="text-xs text-muted-foreground">{event.startTime ?? 'All day'}{event.endTime ? ` – ${event.endTime}` : ''}</p></div></div>)}</div> : <p className="text-sm text-muted-foreground">No upcoming events today.</p>}
    </div>
  )
}

export type { UpcomingEvent }
