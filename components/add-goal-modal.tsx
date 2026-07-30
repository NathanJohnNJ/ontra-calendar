'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createEvent, createGoal } from '@/app/actions/calendar'

interface AddGoalModalProps {
  isOpen: boolean
  onClose: () => void
  date: string
  onGoalCreated?: () => void
}

export function AddGoalModal({ isOpen, onClose, date, onGoalCreated }: AddGoalModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [goalTimeMinutes, setGoalTimeMinutes] = useState('60')
  const [startTime, setStartTime] = useState('')
  const [repeatFrequency, setRepeatFrequency] = useState('once')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !goalTimeMinutes) return

    setIsLoading(true)
    try {
      // First create the event
      const eventId = await createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        startTime: startTime || undefined,
        eventType: 'goal_based',
      })

      // Then create the goal linked to this event
      await createGoal(eventId, parseInt(goalTimeMinutes), repeatFrequency)

      setTitle('')
      setDescription('')
      setGoalTimeMinutes('60')
      setStartTime('')
      setRepeatFrequency('once')
      onGoalCreated?.()
      onClose()
    } catch (error) {
      console.error('Failed to create goal:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg border border-border p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Goal</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="goal-title">Goal Title</Label>
            <Input
              id="goal-title"
              placeholder="e.g., Learn React, Study Math"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="goal-description">Description (optional)</Label>
            <textarea
              id="goal-description"
              placeholder="What are you working towards?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="goal-time">Goal Time (minutes)</Label>
              <Input
                id="goal-time"
                type="number"
                min="1"
                value={goalTimeMinutes}
                onChange={(e) => setGoalTimeMinutes(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="goal-start-time">Start Time (optional)</Label>
              <Input
                id="goal-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="repeat-frequency">Repeat</Label>
            <select
              id="repeat-frequency"
              value={repeatFrequency}
              onChange={(e) => setRepeatFrequency(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="once">No Repeat (Once)</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="bg-muted p-3 rounded text-sm text-muted-foreground">
            <p>You&apos;ll be able to start the timer once the goal is created.</p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Creating...' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
