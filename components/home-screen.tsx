'use client'

import { useCallback, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { MiniCalendar } from './mini-calendar'
import { ClockWidget } from './clock-widget'
import { ActiveTimersWidget, type TimerGoal } from './active-timers-widget'
import { useTheme } from '@/lib/theme-context'
import { Bell, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TimerSession } from '@/app/db/types'

// Code-split heavy, non-critical UI: modals and the expanded day view are only
// fetched when the user actually opens them, shrinking the initial JS bundle.
const AddEventModal = dynamic(() => import('./add-event-modal').then((m) => m.AddEventModal), { ssr: false })
const AddGoalModal = dynamic(() => import('./add-goal-modal').then((m) => m.AddGoalModal), { ssr: false })
const RemindersModal = dynamic(() => import('./reminders-modal').then((m) => m.RemindersModal), { ssr: false })
const SettingsModal = dynamic(() => import('./settings-modal').then((m) => m.SettingsModal), { ssr: false })
const DayView = dynamic(() => import('./day-view').then((m) => m.DayView), { ssr: false })

export function HomeScreen({
  initialGoals = [],
  initialSessions = [],
}: {
  initialGoals?: TimerGoal[]
  initialSessions?: TimerSession[]
}) {
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const [selectedDate, setSelectedDate] = useState(today)
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedDate, setExpandedDate] = useState(today)
  const [showAddEventModal, setShowAddEventModal] = useState(false)
  const [showAddGoalModal, setShowAddGoalModal] = useState(false)
  const [showRemindersModal, setShowRemindersModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const { primaryColor } = useTheme()

  const formattedDate = useMemo(
    () =>
      new Date(today + 'T00:00:00Z').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [today],
  )

  const handleCalendarDateSelect = useCallback((date: string) => {
    setSelectedDate(date)
    setExpandedDate(date)
    setIsExpanded(true)
  }, [])

  const handleBackFromDayView = useCallback(() => setIsExpanded(false), [])
  const openAddEventModal = useCallback(() => setShowAddEventModal(true), [])
  const closeAddEventModal = useCallback(() => setShowAddEventModal(false), [])
  const openAddGoalModal = useCallback(() => setShowAddGoalModal(true), [])
  const closeAddGoalModal = useCallback(() => setShowAddGoalModal(false), [])
  const openRemindersModal = useCallback(() => setShowRemindersModal(true), [])
  const closeRemindersModal = useCallback(() => setShowRemindersModal(false), [])
  const openSettingsModal = useCallback(() => setShowSettingsModal(true), [])
  const closeSettingsModal = useCallback(() => setShowSettingsModal(false), [])
  const noop = useCallback(() => {}, [])

  if (isExpanded) {
    return <DayView date={expandedDate} onBack={handleBackFromDayView} />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-center">
          <h1 className="text-5xl font-bold text-center" style={{ color: primaryColor }}>
            Ontra Calendar
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Left Column: Mini Calendar */}
          <div className="space-y-4">
            <MiniCalendar onDateSelect={handleCalendarDateSelect} selectedDate={selectedDate} />
            
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold mb-4">Stats</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">0 min</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">0 min</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">All Time</p>
                  <p className="text-2xl font-bold">0 min</p>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column: Date & Current Tasks */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg border border-border p-6 w-min">
              <p className="text-sm text-muted-foreground mb-2">Today</p>
              <h2 className="text-2xl font-bold">
                {formattedDate}
              </h2>
            </div>

            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold mb-3">Active Timers</h3>
              <ActiveTimersWidget
                date={today}
                onAddGoal={openAddGoalModal}
                initialGoals={initialGoals}
                initialSessions={initialSessions}
              />
            </div>
          </div>

          {/* Right Column: Clock & Widgets */}
          <div className="flex flex-col items-center space-y-4">
            {/* Clock Widget */}
            <div className="bg-card rounded-lg border border-border p-6 w-full flex justify-center">
              <ClockWidget />
            </div>

            {/* Small action widgets */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button 
                className="h-16 flex flex-col items-center justify-center rounded-lg border border-border bg-card hover:bg-muted" 
                variant="ghost"
                onClick={openRemindersModal}
                title="View reminders"
              >
                <Bell className="h-6 w-6 mb-1" />
                <span className="text-xs">Reminders</span>
              </Button>
              <Button 
                className="h-16 flex flex-col items-center justify-center rounded-lg border border-border bg-card hover:bg-muted" 
                variant="ghost"
                onClick={openSettingsModal}
                title="Open settings"
              >
                <Settings className="h-6 w-6 mb-1" />
                <span className="text-xs">Settings</span>
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-lg border border-border p-4 w-full">
              <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={openAddEventModal}
                >
                  + Add Event
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={openAddGoalModal}
                >
                  + Add Goal
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AddEventModal
        isOpen={showAddEventModal}
        onClose={closeAddEventModal}
        date={today}
        onEventCreated={noop}
      />

      <AddGoalModal
        isOpen={showAddGoalModal}
        onClose={closeAddGoalModal}
        date={today}
        onGoalCreated={noop}
      />

      <RemindersModal
        isOpen={showRemindersModal}
        onClose={closeRemindersModal}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={closeSettingsModal}
      />
    </div>
  )
}
