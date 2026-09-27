'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/theme-context'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { primaryColor, clockType, setPrimaryColor, setClockType } = useTheme()
  const [selectedColor, setSelectedColor] = useState(primaryColor)

  useEffect(() => {
    setSelectedColor(primaryColor)
  }, [primaryColor])

  const handleColorChange = async (color: string) => {
    setSelectedColor(color)
    await setPrimaryColor(color)
  }

  const colors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Indigo', value: '#6366f1' },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg border border-border p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Color Theme */}
          <div>
            <label className="text-sm font-semibold block mb-3">Primary Color</label>
            <div className="grid grid-cols-5 gap-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorChange(color.value)}
                  className={`h-10 rounded-lg transition-all ${
                    selectedColor === color.value
                      ? 'ring-2 ring-offset-2 ring-foreground'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Clock Type */}
          <div>
            <label className="text-sm font-semibold block mb-3">Clock Display</label>
            <div className="space-y-2">
              <button
                onClick={() => setClockType('digital')}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  clockType === 'digital'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                Digital
              </button>
              <button
                onClick={() => setClockType('analog')}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  clockType === 'analog'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                Analog
              </button>
            </div>
          </div>

          {/* About */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-semibold mb-2">About</h3>
            <p className="text-xs text-muted-foreground">
              Ontra Calendar v1.0.0
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              A powerful time tracking and productivity calendar to help you achieve your goals.
            </p>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-border">
          <Button onClick={onClose} className="w-full" variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
