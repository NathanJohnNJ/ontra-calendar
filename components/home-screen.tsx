'use client'

import { useCallback, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { MiniCalendar } from './mini-calendar'
import { ClockWidget } from './clock-widget'
import { ActiveTimersWidget, type TimerGoal } from './active-timers-widget'
import { useTheme } from '@/lib/theme-context'
import { Bell, Check, Grip, Pencil, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TimerSession } from '@/app/db/types'
import { updateUserPreferences } from '@/app/actions/calendar'
import type { Layout, Layouts } from 'react-grid-layout'
import { ResponsiveGridLayout } from 'react-grid-layout/react'
import 'react-grid-layout/css/styles.css'

const defaultLayouts: Layouts = {
  lg: [
    { i: 'calendar', x: 0, y: 0, w: 4, h: 11, minW: 3, minH: 8 },
    { i: 'today', x: 4, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
    { i: 'timers', x: 4, y: 4, w: 4, h: 7, minW: 3, minH: 5 },
    { i: 'clock', x: 8, y: 0, w: 4, h: 6, minW: 3, minH: 4 },
    { i: 'actions', x: 8, y: 6, w: 4, h: 3, minW: 3, minH: 2 },
    { i: 'quick-actions', x: 8, y: 9, w: 4, h: 5, minW: 3, minH: 3 },
  ],
  md: [
    { i: 'calendar', x: 0, y: 0, w: 5, h: 11, minW: 3, minH: 8 },
    { i: 'today', x: 5, y: 0, w: 5, h: 4, minW: 3, minH: 3 },
    { i: 'timers', x: 5, y: 4, w: 5, h: 7, minW: 3, minH: 5 },
    { i: 'clock', x: 0, y: 11, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'actions', x: 5, y: 11, w: 5, h: 3, minW: 3, minH: 2 },
    { i: 'quick-actions', x: 5, y: 14, w: 5, h: 5, minW: 3, minH: 3 },
  ],
  sm: [
    { i: 'calendar', x: 0, y: 0, w: 6, h: 11, minW: 3, minH: 8 },
    { i: 'today', x: 0, y: 11, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'timers', x: 0, y: 15, w: 6, h: 7, minW: 3, minH: 5 },
    { i: 'clock', x: 0, y: 22, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'actions', x: 0, y: 28, w: 6, h: 3, minW: 3, minH: 2 },
    { i: 'quick-actions', x: 0, y: 31, w: 6, h: 5, minW: 3, minH: 3 },
  ],
}

function parseLayouts(value?: string): Layouts {
  if (!value) return defaultLayouts
  try {
    const parsed = JSON.parse(value)
    return parsed?.lg && parsed?.md && parsed?.sm ? parsed : defaultLayouts
  } catch {
    return defaultLayouts
  }
}

export function HomeScreen({
  initialGoals = [],
  initialSessions = [],
  initialLayout,
}: {
  initialGoals?: TimerGoal[]
  initialSessions?: TimerSession[]
  initialLayout?: string
}) {
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const [selectedDate, setSelectedDate] = useState(today)
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedDate, setExpandedDate] = useState(today)
  const [showAddEventModal, setShowAddEventModal] = useState(false)
  const [showAddGoalModal, setShowAddGoalModal] = useState(false)
  const [showRemindersModal, setShowRemindersModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [layouts, setLayouts] = useState<Layouts>(() => parseLayouts(initialLayout))
  const { primaryColor } = useTheme()

  const formattedDate = useMemo(
    () => new Date(today + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    [today],
  )

  const saveLayouts = useCallback(async (nextLayouts: Layouts) => {
    setLayouts(nextLayouts)
    await updateUserPreferences({ dashboardLayout: JSON.stringify(nextLayouts) })
  }, [])

  const handleCalendarDateSelect = useCallback((date: string) => {
    setSelectedDate(date)
    setExpandedDate(date)
    setIsExpanded(true)
  }, [])
  const noop = useCallback(() => {}, [])

  if (isExpanded) return <DayView date={expandedDate} onBack={() => setIsExpanded(false)} />

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl" style={{ color: primaryColor }}>Ontra Calendar</h1>
          <Button variant={editMode ? 'default' : 'outline'} onClick={() => setEditMode((value) => !value)} aria-pressed={editMode}>
            {editMode ? <Check data-icon="inline-start" /> : <Pencil data-icon="inline-start" />}
            {editMode ? 'Done editing' : 'Arrange layout'}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {editMode && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            <Grip className="text-primary" aria-hidden="true" />
            <span>Drag widgets by their handles and resize from the lower-right corner. Everything snaps to the grid.</span>
          </div>
        )}
        <ResponsiveGridLayout
          className="dashboard-layout"
          layouts={layouts}
          breakpoints={{ lg: 1100, md: 768, sm: 0 }}
          cols={{ lg: 12, md: 10, sm: 6 }}
          rowHeight={28}
          margin={[24, 24]}
          containerPadding={[0, 0]}
          compactType="vertical"
          isDraggable={editMode}
          isResizable={editMode}
          draggableHandle=".widget-handle"
          onLayoutChange={(_, nextLayouts) => setLayouts(nextLayouts)}
          onDragStop={(_, nextLayout) => saveLayouts({ ...layouts, lg: nextLayout })}
          onResizeStop={(_, nextLayout) => saveLayouts({ ...layouts, lg: nextLayout })}
        >
          <section key="calendar" className="dashboard-widget" aria-label="Mini calendar">
            <div className="widget-shell"><MiniCalendar onDateSelect={handleCalendarDateSelect} selectedDate={selectedDate} /></div>
          </section>
          <section key="today" className="dashboard-widget" aria-label="Today">
            <div className="widget-shell p-6"><p className="text-sm text-muted-foreground">Today</p><h2 className="mt-2 text-2xl font-bold">{formattedDate}</h2></div>
          </section>
          <section key="timers" className="dashboard-widget" aria-label="Active timers">
            <div className="widget-shell p-4"><h3 className="mb-3 text-sm font-semibold">Active Timers</h3><ActiveTimersWidget date={today} onAddGoal={() => setShowAddGoalModal(true)} initialGoals={initialGoals} initialSessions={initialSessions} /></div>
          </section>
          <section key="clock" className="dashboard-widget" aria-label="Clock"><div className="widget-shell flex h-full items-center justify-center p-6"><ClockWidget /></div></section>
          <section key="actions" className="dashboard-widget" aria-label="Shortcuts"><div className="grid h-full grid-cols-2 gap-3"><Button className="h-full rounded-xl border border-border bg-card hover:bg-muted" variant="ghost" onClick={() => setShowRemindersModal(true)}><span className="flex flex-col items-center gap-1"><Bell /> <span className="text-xs">Reminders</span></span></Button><Button className="h-full rounded-xl border border-border bg-card hover:bg-muted" variant="ghost" onClick={() => setShowSettingsModal(true)}><span className="flex flex-col items-center gap-1"><Settings /> <span className="text-xs">Settings</span></span></Button></div></section>
          <section key="quick-actions" className="dashboard-widget" aria-label="Quick actions"><div className="widget-shell h-full p-4"><h3 className="mb-3 text-sm font-semibold">Quick Actions</h3><div className="flex flex-col gap-2"><Button variant="outline" onClick={() => setShowAddEventModal(true)}>+ Add Event</Button><Button variant="outline" onClick={() => setShowAddGoalModal(true)}>+ Add Goal</Button></div></div></section>
        </ResponsiveGridLayout>
      </main>

      <AddEventModal isOpen={showAddEventModal} onClose={() => setShowAddEventModal(false)} date={today} onEventCreated={noop} />
      <AddGoalModal isOpen={showAddGoalModal} onClose={() => setShowAddGoalModal(false)} date={today} onGoalCreated={noop} />
      <RemindersModal isOpen={showRemindersModal} onClose={() => setShowRemindersModal(false)} />
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </div>
  )
}

const DayView = dynamic(() => import('./day-view').then((m) => m.DayView), { ssr: false })
const AddEventModal = dynamic(() => import('./add-event-modal').then((m) => m.AddEventModal), { ssr: false })
const AddGoalModal = dynamic(() => import('./add-goal-modal').then((m) => m.AddGoalModal), { ssr: false })
const RemindersModal = dynamic(() => import('./reminders-modal').then((m) => m.RemindersModal), { ssr: false })
const SettingsModal = dynamic(() => import('./settings-modal').then((m) => m.SettingsModal), { ssr: false })

