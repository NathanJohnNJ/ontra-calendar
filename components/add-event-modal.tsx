'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createEvent } from '@/app/actions/calendar'

interface AddEventModalProps {
  isOpen: boolean
  onClose: () => void
  date: string
  onEventCreated?: () => void
}

export function AddEventModal({ isOpen, onClose, date, onEventCreated }: AddEventModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [repeatFrequency, setRepeatFrequency] = useState('once')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const daysLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    try {
      await createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        eventType: 'regular',
        repeatFrequency,
        daysOfWeek,
      })
      setTitle('')
      setDescription('')
      setStartTime('')
      setEndTime('')
      setRepeatFrequency('once')
      setDaysOfWeek([])
      onEventCreated?.()
      onClose()
    } catch (error) {
      console.error('Failed to create event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg border border-border p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Event</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              placeholder="Enter event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <textarea
              id="description"
              placeholder="Enter event description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time (optional)</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time (optional)</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
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

          {repeatFrequency !== 'once' && repeatFrequency !== 'monthly' && (
            <div>
              <Label>Days of Week</Label>
              <div className="grid grid-cols-7 gap-2">
                {daysLabels.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleDay(index)}
                    className={`py-2 px-1 text-sm font-medium rounded transition-colors ${
                      daysOfWeek.includes(index)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {daysOfWeek.length === 0
                  ? 'Select days to limit recurrence, or leave empty for all days'
                  : `Repeating on: ${daysOfWeek.map((d) => daysLabels[d]).join(', ')}`}
              </p>
            </div>
          )}

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
              {isLoading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
