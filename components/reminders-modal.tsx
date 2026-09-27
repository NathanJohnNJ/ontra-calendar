'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPendingReminders, dismissReminder } from '@/app/actions/calendar'

interface Reminder {
  id: string
  eventId: string
  reminderType: string
  reminderTime: Date
  isDismissed: boolean
}

interface RemindersModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RemindersModal({ isOpen, onClose }: RemindersModalProps) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadReminders()
    }
  }, [isOpen])

  const loadReminders = async () => {
    setIsLoading(true)
    try {
      const pending = await getPendingReminders()
      setReminders(pending)
    } catch (error) {
      console.error('Failed to load reminders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = async (reminderId: string) => {
    try {
      await dismissReminder(reminderId)
      setReminders(reminders.filter((r) => r.id !== reminderId))
    } catch (error) {
      console.error('Failed to dismiss reminder:', error)
    }
  }

  if (!isOpen) return null

  const reminderTypeLabels: Record<string, string> = {
    event: 'Event Reminder',
    goal_focus: 'Goal Focus Reminder',
    track_time: 'Track Time Reminder',
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg border border-border p-6 w-full max-w-md max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-card">
          <h2 className="text-lg font-semibold">Reminders</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading reminders...</p>
        ) : reminders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending reminders</p>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="flex items-start justify-between bg-muted p-3 rounded">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {reminderTypeLabels[reminder.reminderType] || reminder.reminderType}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(reminder.reminderTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDismiss(reminder.id)}
                  className="h-8 w-8 p-0"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 mt-4 border-t border-border">
          <Button onClick={onClose} className="w-full" variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
