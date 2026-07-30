'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { updateUserPreferences } from '@/app/actions/calendar'

interface ThemeContextType {
  primaryColor: string
  clockType: 'digital' | 'analog'
  setPrimaryColor: (color: string) => Promise<void>
  setClockType: (type: 'digital' | 'analog') => Promise<void>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({
  children,
  initialColor,
  initialClockType,
}: {
  children: React.ReactNode
  initialColor: string
  initialClockType: string
}) {
  const [primaryColor, setPrimaryColorState] = useState(initialColor)
  const [clockType, setClockTypeState] = useState<'digital' | 'analog'>(
    initialClockType === 'analog' ? 'analog' : 'digital',
  )

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--primary', primaryColor)
    root.style.setProperty('--primary-foreground', '#ffffff')
  }, [primaryColor])

  const setPrimaryColor = async (color: string) => {
    setPrimaryColorState(color)
    try {
      await updateUserPreferences({ primaryColor: color })
    } catch (error) {
      console.error('Failed to update theme:', error)
    }
  }

  const setClockType = async (type: 'digital' | 'analog') => {
    setClockTypeState(type)
    try {
      await updateUserPreferences({ clockType: type })
    } catch (error) {
      console.error('Failed to update clock type:', error)
    }
  }

  return (
    <ThemeContext.Provider value={{ primaryColor, clockType, setPrimaryColor, setClockType }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
