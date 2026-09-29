'use client'

import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { MiniCalendar } from './mini-calendar'
import { ClockWidget } from './clock-widget'
import { ActiveTimersWidget, type TimerGoal } from './active-timers-widget'
import { UpcomingEventsWidget, type UpcomingEvent } from './upcoming-events-widget'
import { CurrentGoalsWidget, type CurrentGoal } from './current-goals-widget'
import { TasksWidget } from './tasks-widget'
import { useTheme } from '@/lib/theme-context'
import { Bell, Check, Grip, Pencil, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TimerSession } from '@/app/db/types'
import { updateUserPreferences } from '@/app/actions/calendar'
import type { ComponentType } from 'react'
import type { Layout } from 'react-grid-layout'

type Layouts = Partial<Record<string, Layout>>
import { ResponsiveReactGridLayout, WidthProvider } from 'react-grid-layout/legacy'

const ResponsiveGridLayout = WidthProvider(ResponsiveReactGridLayout)
const DashboardGrid = ResponsiveGridLayout as unknown as ComponentType<Record<string, unknown>>
import 'react-grid-layout/css/styles.css'

const defaultLayouts: Layouts = {
  lg: [
    { i: 'calendar', x: 0, y: 0, w: 4, h: 8, minW: 4, minH: 8 },
    { i: 'today', x: 4, y: 0, w: 4, h: 3, minW: 4, minH: 3 },
    { i: 'timers', x: 4, y: 3, w: 4, h: 4, minW: 4, minH: 4 },
    { i: 'clock', x: 8, y: 0, w: 4, h: 6, minW: 4, maxW: 4, minH: 6, maxH: 6 },
    { i: 'actions', x: 8, y: 6, w: 4, h: 2, minW: 4, minH: 2 },
    { i: 'quick-actions', x: 8, y: 8, w: 4, h: 4, minW: 4, minH: 4 },
    { i: 'tasks', x: 8, y: 12, w: 4, h: 6, minW: 4, minH: 4 },
    { i: 'upcoming', x: 0, y: 8, w: 4, h: 4, minW: 4, minH: 4 },
    { i: 'goals', x: 4, y: 7, w: 4, h: 5, minW: 4, minH: 5 },
  ],
  md: [
    { i: 'calendar', x: 0, y: 0, w: 5, h: 8, minW: 5, minH: 8 },
    { i: 'today', x: 5, y: 0, w: 5, h: 3, minW: 5, minH: 3 },
    { i: 'timers', x: 5, y: 3, w: 5, h: 4, minW: 5, minH: 4 },
    { i: 'clock', x: 0, y: 8, w: 5, h: 6, minW: 5, maxW: 5, minH: 6, maxH: 6 },
    { i: 'actions', x: 5, y: 8, w: 5, h: 2, minW: 5, minH: 2 },
    { i: 'quick-actions', x: 5, y: 10, w: 5, h: 4, minW: 5, minH: 4 },
    { i: 'tasks', x: 5, y: 14, w: 5, h: 6, minW: 5, minH: 4 },
    { i: 'upcoming', x: 0, y: 14, w: 5, h: 4, minW: 5, minH: 4 },
    { i: 'goals', x: 5, y: 14, w: 5, h: 4, minW: 5, minH: 4 },
  ],
  sm: [
    { i: 'calendar', x: 0, y: 0, w: 6, h: 8, minW: 6, minH: 8 },
    { i: 'today', x: 0, y: 8, w: 6, h: 3, minW: 6, minH: 3 },
    { i: 'timers', x: 0, y: 11, w: 6, h: 4, minW: 6, minH: 4 },
    { i: 'clock', x: 0, y: 15, w: 6, h: 6, minW: 6, maxW: 6, minH: 6, maxH: 6 },
    { i: 'actions', x: 0, y: 21, w: 6, h: 2, minW: 6, minH: 2 },
    { i: 'quick-actions', x: 0, y: 23, w: 6, h: 4, minW: 6, minH: 4 },
    { i: 'tasks', x: 0, y: 27, w: 6, h: 6, minW: 6, minH: 4 },
    { i: 'upcoming', x: 0, y: 33, w: 6, h: 4, minW: 6, minH: 4 },
    { i: 'goals', x: 0, y: 31, w: 6, h: 4, minW: 6, minH: 4 },
  ],
}

function hasValidLayout(layout: unknown, ids: string[]) {
  if (!Array.isArray(layout)) return false
  const items = layout.filter((item): item is Layout[number] => item && typeof item.i === 'string')
  if (items.length !== ids.length || new Set(items.map((item) => item.i)).size !== ids.length) return false
  return items.every((item, index) => {
    const itemRight = item.x + item.w
    const itemBottom = item.y + item.h
    return item.w > 0 && item.h > 0 && item.x >= 0 && item.y >= 0 && items.every((other, otherIndex) => {
      if (index === otherIndex) return true
      return itemRight <= other.x || other.x + other.w <= item.x || itemBottom <= other.y || other.y + other.h <= item.y
    })
  })
}

const widgetIds = ['calendar', 'today', 'timers', 'clock', 'actions', 'quick-actions', 'tasks', 'upcoming', 'goals'] as const
type WidgetId = (typeof widgetIds)[number]
type WidgetVisibility = Record<WidgetId, boolean>

const defaultVisibility: WidgetVisibility = Object.fromEntries(widgetIds.map((id) => [id, true])) as WidgetVisibility

function parseDashboardConfig(value?: string): { layouts: Layouts; visibility: WidgetVisibility } {
  if (!value) return { layouts: defaultLayouts, visibility: defaultVisibility }
  try {
    const parsed = JSON.parse(value)
    const storedLayouts = parsed?.layouts ?? parsed
    const ids = defaultLayouts.lg?.map((item) => item.i) ?? []
    if (!ids.length || !['lg', 'md', 'sm'].every((breakpoint) => hasValidLayout(storedLayouts?.[breakpoint], ids))) {
      return { layouts: defaultLayouts, visibility: defaultVisibility }
    }

    const layouts = Object.fromEntries(['lg', 'md', 'sm'].map((breakpoint) => [
      breakpoint,
      storedLayouts[breakpoint].map((item: Layout[number]) => {
        const defaultItem = defaultLayouts[breakpoint]?.find((candidate) => candidate.i === item.i)
        const minH = defaultItem?.minH ?? 2
        const minW = defaultItem?.minW ?? 1
        return { ...item, w: Math.max(item.w, minW), h: Math.max(item.h, minH), minW, minH }
      }),
    ]))
    const visibility = { ...defaultVisibility, ...(parsed?.visibility ?? {}) }
    return { layouts, visibility }
  } catch {
    return { layouts: defaultLayouts, visibility: defaultVisibility }
  }
}

function WidgetFrame({
  children,
  editMode,
  widgetId,
  visible,
  onVisibilityChange,
  className = '',
}: {
  children: ReactNode
  editMode: boolean
  widgetId: WidgetId
  visible: boolean
  onVisibilityChange: (visible: boolean) => void
  className?: string
}) {
  return (
    <div className={`widget-shell widget-interactive ${!visible ? (editMode ? 'widget-is-hidden' : 'widget-is-removed') : ''} ${className}`}>
      {editMode && (
        <div className="widget-edit-controls">
          <button type="button" className="widget-handle" aria-label="Drag widget to reposition"><Grip aria-hidden="true" /></button>
          <label
            className="widget-visibility-toggle"
            aria-label={`${visible ? 'Hide' : 'Show'} ${widgetId} widget`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <input type="checkbox" checked={visible} onChange={(event) => onVisibilityChange(event.target.checked)} />
          </label>
        </div>
      )}
      {children}
    </div>
  )
}

export function HomeScreen({
initialGoals = [],
    initialSessions = [],
    initialEvents = [],
    currentGoals = [],
  initialTasks = [],
  initialLayout,
}: {
  initialGoals?: TimerGoal[]
  initialSessions?: TimerSession[]
  initialEvents?: UpcomingEvent[]
  currentGoals?: CurrentGoal[]
  initialTasks?: any[]
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
  const initialDashboardConfig = useMemo(() => parseDashboardConfig(initialLayout), [initialLayout])
  const [layouts, setLayouts] = useState<Layouts>(() => initialDashboardConfig.layouts)
  const [visibility, setVisibility] = useState<WidgetVisibility>(() => initialDashboardConfig.visibility)
  const { primaryColor } = useTheme()

  const formattedDate = useMemo(
    () => new Date(today + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    [today],
  )

  const saveDashboardConfig = useCallback(async (nextLayouts: Layouts, nextVisibility: WidgetVisibility) => {
    await updateUserPreferences({ dashboardLayout: JSON.stringify({ layouts: nextLayouts, visibility: nextVisibility }) })
  }, [])

  const handleVisibilityChange = useCallback((widgetId: WidgetId, visible: boolean) => {
    setVisibility((current) => {
      const next = { ...current, [widgetId]: visible }
      void saveDashboardConfig(layouts, next)
      return next
    })
  }, [layouts, saveDashboardConfig])

  const handleCalendarDateSelect = useCallback((date: string) => {
    setSelectedDate(date)
    setExpandedDate(date)
    setIsExpanded(true)
  }, [])
  const noop = useCallback(() => {}, [])
  const moveHiddenWidgetsToBottom = useCallback((sourceLayouts: Layouts, nextVisibility: WidgetVisibility): Layouts => {
    return Object.fromEntries(Object.entries(sourceLayouts).map(([breakpoint, layout]) => {
      if (!layout) return [breakpoint, layout]
      const visibleItems = layout.filter((item) => nextVisibility[item.i as WidgetId] !== false)
      const hiddenItems = layout.filter((item) => nextVisibility[item.i as WidgetId] === false)
      const bottom = visibleItems.reduce((max, item) => Math.max(max, item.y + item.h), 0)
      return [breakpoint, [...visibleItems, ...hiddenItems.map((item, index) => ({ ...item, y: bottom + index * item.h }))]]
    }))
  }, [])

  const handleLayoutChange = useCallback((_: Layout, nextLayouts: Layouts) => {
    setLayouts(nextLayouts)
    if (editMode) void saveDashboardConfig(nextLayouts, visibility)
  }, [editMode, saveDashboardConfig, visibility])

  const handleEditModeChange = useCallback(() => {
    setEditMode((current) => {
      if (!current) return true
      const nextLayouts = moveHiddenWidgetsToBottom(layouts, visibility)
      setLayouts(nextLayouts)
      void saveDashboardConfig(nextLayouts, visibility)
      return false
    })
  }, [layouts, moveHiddenWidgetsToBottom, saveDashboardConfig, visibility])

  if (isExpanded) return <DayView date={expandedDate} onBack={() => setIsExpanded(false)} />

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl" style={{ color: primaryColor }}>Ontra Calendar</h1>
          <Button variant={editMode ? 'default' : 'outline'} onClick={handleEditModeChange} aria-pressed={editMode}>
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
        <DashboardGrid
          className={editMode ? 'dashboard-layout is-editing' : 'dashboard-layout'}
          layouts={layouts}
          breakpoints={{ lg: 1100, md: 768, sm: 0 }}
          cols={{ lg: 12, md: 10, sm: 6 }}
          rowHeight={28}
          margin={[24, 24]}
          containerPadding={[0, 0]}
          compactType="vertical" as const
          preventCollision={false}
          allowOverlap={false}
          isDraggable={editMode}
          isResizable={editMode}
          draggableHandle=".widget-handle"
          draggableCancel=".widget-visibility-toggle, .widget-visibility-toggle *"
          onLayoutChange={handleLayoutChange}
        >
          <section key="calendar" className="dashboard-widget" aria-label="Mini calendar">
            <WidgetFrame editMode={editMode} widgetId="calendar" visible={visibility.calendar} onVisibilityChange={(value) => handleVisibilityChange('calendar', value)}><MiniCalendar onDateSelect={editMode ? noop : handleCalendarDateSelect} selectedDate={selectedDate} /></WidgetFrame>
          </section>
          <section key="today" className="dashboard-widget" aria-label="Today">
            <WidgetFrame editMode={editMode} widgetId="today" visible={visibility.today} onVisibilityChange={(value) => handleVisibilityChange('today', value)} className="p-6"><p className="text-sm text-muted-foreground">Today</p><h2 className="mt-2 text-2xl font-bold">{formattedDate}</h2></WidgetFrame>
          </section>
          <section key="timers" className="dashboard-widget" aria-label="Active timers">
            <WidgetFrame editMode={editMode} widgetId="timers" visible={visibility.timers} onVisibilityChange={(value) => handleVisibilityChange('timers', value)} className="p-4"><h3 className="mb-3 text-sm font-semibold">Active Timers</h3><ActiveTimersWidget date={today} onAddGoal={() => setShowAddGoalModal(true)} initialGoals={initialGoals} initialSessions={initialSessions} disabled={editMode} /></WidgetFrame>
          </section>
          <section key="clock" className="dashboard-widget" aria-label="Clock"><WidgetFrame editMode={editMode} widgetId="clock" visible={visibility.clock} onVisibilityChange={(value) => handleVisibilityChange('clock', value)} className="flex items-center justify-center p-6"><ClockWidget disabled={editMode} /></WidgetFrame></section>
          <section key="actions" className="dashboard-widget" aria-label="Shortcuts"><WidgetFrame editMode={editMode} widgetId="actions" visible={visibility.actions} onVisibilityChange={(value) => handleVisibilityChange('actions', value)} className="grid grid-cols-2 gap-3"><Button disabled={editMode} className="h-full rounded-xl border border-border bg-card hover:bg-muted" variant="ghost" onClick={() => setShowRemindersModal(true)}><span className="flex flex-col items-center gap-1"><Bell /> <span className="text-xs">Reminders</span></span></Button><Button disabled={editMode} className="h-full rounded-xl border border-border bg-card hover:bg-muted" variant="ghost" onClick={() => setShowSettingsModal(true)}><span className="flex flex-col items-center gap-1"><Settings /> <span className="text-xs">Settings</span></span></Button></WidgetFrame></section>
          <section key="quick-actions" className="dashboard-widget" aria-label="Quick actions"><WidgetFrame editMode={editMode} widgetId="quick-actions" visible={visibility['quick-actions']} onVisibilityChange={(value) => handleVisibilityChange('quick-actions', value)} className="p-4"><h3 className="mb-3 text-sm font-semibold">Quick Actions</h3><div className="flex flex-col gap-2"><Button disabled={editMode} variant="outline" onClick={() => setShowAddEventModal(true)}>+ Add Event</Button><Button disabled={editMode} variant="outline" onClick={() => setShowAddGoalModal(true)}>+ Add Goal</Button></div></WidgetFrame></section>
          <section key="tasks" className="dashboard-widget" aria-label="Tasks"><WidgetFrame editMode={editMode} widgetId="tasks" visible={visibility.tasks} onVisibilityChange={(value) => handleVisibilityChange('tasks', value)} className="flex h-full min-h-[240px] flex-col overflow-visible p-4"><TasksWidget initialTasks={initialTasks} /></WidgetFrame></section>
          <section key="upcoming" className="dashboard-widget" aria-label="Upcoming events"><WidgetFrame editMode={editMode} widgetId="upcoming" visible={visibility.upcoming} onVisibilityChange={(value) => handleVisibilityChange('upcoming', value)} className="p-4"><UpcomingEventsWidget events={initialEvents} /></WidgetFrame></section>
          <section key="goals" className="dashboard-widget" aria-label="Current goals"><WidgetFrame editMode={editMode} widgetId="goals" visible={visibility.goals} onVisibilityChange={(value) => handleVisibilityChange('goals', value)} className="p-4"><CurrentGoalsWidget goals={currentGoals} /></WidgetFrame></section>
        </DashboardGrid>
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

