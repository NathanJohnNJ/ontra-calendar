'use client'

import { useState } from 'react'
import { MiniCalendar } from './mini-calendar'
import { ClockWidget } from './clock-widget'
import { AddEventModal } from './add-event-modal'
import { AddGoalModal } from './add-goal-modal'
import { RemindersModal } from './reminders-modal'
import { SettingsModal } from './settings-modal'
import { ActiveTimersWidget } from './active-timers-widget'
import { DayView } from './day-view'
import { useTheme } from '@/lib/theme-context'
import { Bell, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HomeScreen() {
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedDate, setExpandedDate] = useState(today)
  const [showAddEventModal, setShowAddEventModal] = useState(false)
  const [showAddGoalModal, setShowAddGoalModal] = useState(false)
  const [showRemindersModal, setShowRemindersModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const { primaryColor } = useTheme()

  const formattedDate = new Date(today + 'T00:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const handleCalendarDateSelect = (date: string) => {
    setSelectedDate(date)
    setExpandedDate(date)
    setIsExpanded(true)
  }

  if (isExpanded) {
    return <DayView date={expandedDate} onBack={() => setIsExpanded(false)} />
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
              <ActiveTimersWidget date={today} onAddGoal={() => setShowAddGoalModal(true)} />
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
                onClick={() => setShowRemindersModal(true)}
                title="View reminders"
              >
                <Bell className="h-6 w-6 mb-1" />
                <span className="text-xs">Reminders</span>
              </Button>
              <Button 
                className="h-16 flex flex-col items-center justify-center rounded-lg border border-border bg-card hover:bg-muted" 
                variant="ghost"
                onClick={() => setShowSettingsModal(true)}
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
                  onClick={() => setShowAddEventModal(true)}
                >
                  + Add Event
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setShowAddGoalModal(true)}
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
        onClose={() => setShowAddEventModal(false)}
        date={today}
        onEventCreated={() => {}}
      />

      <AddGoalModal
        isOpen={showAddGoalModal}
        onClose={() => setShowAddGoalModal(false)}
        date={today}
        onGoalCreated={() => {}}
      />

      <RemindersModal
        isOpen={showRemindersModal}
        onClose={() => setShowRemindersModal(false)}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  )
}
