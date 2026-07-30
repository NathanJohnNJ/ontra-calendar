'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MiniCalendarProps {
  onDateSelect: (date: string) => void
  selectedDate?: string
}

export function MiniCalendar({ onDateSelect, selectedDate }: MiniCalendarProps) {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const days = []

  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleDateClick = (day: number | null) => {
    if (day) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dateStr = date.toISOString().split('T')[0]
      onDateSelect(dateStr)
    }
  }

  const isToday = (day: number | null) => {
    if (!day) return false
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const todayStr = today.toISOString().split('T')[0]
    const dateStr = date.toISOString().split('T')[0]
    return dateStr === todayStr
  }

  const isSelected = (day: number | null) => {
    if (!day || !selectedDate) return false
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const dateStr = date.toISOString().split('T')[0]
    return dateStr === selectedDate
  }

  return (
    <div className="w-full bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-xs font-medium text-muted-foreground text-center p-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => handleDateClick(day)}
            className={`
              aspect-square text-xs rounded flex items-center justify-center font-medium
              transition-colors
              ${!day ? 'bg-transparent cursor-default' : 'hover:bg-muted cursor-pointer'}
              ${isToday(day) ? 'bg-primary text-primary-foreground' : ''}
              ${isSelected(day) ? 'bg-blue-200 dark:bg-blue-900' : ''}
              ${day && !isToday(day) && !isSelected(day) ? 'text-foreground' : ''}
            `}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  )
}
