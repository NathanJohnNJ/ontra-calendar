'use client'

import { useState } from 'react'
import { MiniCalendar } from './mini-calendar'
import { ClockWidget } from './clock-widget'
import { CurrentTimers } from './current-timers'
import { AddEventModal } from './add-event-modal'
import { AddGoalModal } from './add-goal-modal'
import { RemindersModal } from './reminders-modal'
import { SettingsModal } from './settings-modal'
import { EventTimerList } from './event-timer-list'
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
            Ontra Calendar
          </h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowRemindersModal(true)}
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowSettingsModal(true)}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Left Column: Mini Calendar & Stats */}
          <div className="space-y-6">
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
            <div className="bg-card rounded-lg border border-border p-6">
              <p className="text-sm text-muted-foreground mb-2">Today</p>
              <h2 className="text-4xl font-bold">
                {formattedDate}
              </h2>
            </div>

            <CurrentTimers date={today} />

            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold mb-3">Today&apos;s Tasks</h3>
              <EventTimerList date={today} onTimerStarted={() => {}} />
            </div>
          </div>

          {/* Right Column: Clock & Settings */}
          <div className="flex flex-col items-center space-y-6">
            <div className="bg-card rounded-lg border border-border p-6 w-full flex justify-center">
              <ClockWidget />
            </div>

            <div className="bg-card rounded-lg border border-border p-4 w-full">
              <h3 className="text-sm font-semibold mb-4">Quick Actions</h3>
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
