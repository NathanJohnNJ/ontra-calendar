// Utility functions for handling recurring goals

type RepeatFrequency = 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly'
type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = Sunday, 6 = Saturday

/**
 * Checks if a recurring goal applies to a specific date
 * @param repeatFrequency - The repeat frequency (once, daily, weekly, etc.)
 * @param daysOfWeek - JSON string array of days the goal applies to (0-6, where 0=Sunday)
 * @param eventDate - The original event date when the goal was created
 * @param checkDate - The date to check if the goal applies
 */
export function goalAppliesToDate(
  repeatFrequency: RepeatFrequency,
  daysOfWeek: string,
  eventDate: string,
  checkDate: string,
): boolean {
  if (repeatFrequency === 'once') {
    // One-time goals only apply to the original event date
    return eventDate === checkDate
  }

  const eventDateObj = new Date(eventDate)
  const checkDateObj = new Date(checkDate)

  // Check if checkDate is on or after eventDate
  if (checkDateObj < eventDateObj) {
    return false
  }

  let daysArr: number[] = []
  try {
    daysArr = JSON.parse(daysOfWeek)
  } catch {
    // If daysOfWeek is invalid, apply to all days
    daysArr = [0, 1, 2, 3, 4, 5, 6]
  }

  const checkDayOfWeek = checkDateObj.getDay()

  // If specific days are set, check if this date's day of week is included
  if (daysArr.length > 0 && !daysArr.includes(checkDayOfWeek)) {
    return false
  }

  switch (repeatFrequency) {
    case 'daily':
      return true

    case 'weekly': {
      const daysDiff = Math.floor(
        (checkDateObj.getTime() - eventDateObj.getTime()) / (1000 * 60 * 60 * 24),
      )
      // Same day of week every week
      return daysDiff % 7 === 0 || checkDayOfWeek === eventDateObj.getDay()
    }

    case 'biweekly': {
      const daysDiff = Math.floor(
        (checkDateObj.getTime() - eventDateObj.getTime()) / (1000 * 60 * 60 * 24),
      )
      return daysDiff % 14 === 0 || (checkDayOfWeek === eventDateObj.getDay() && daysDiff % 14 < 7)
    }

    case 'monthly': {
      const eventDay = eventDateObj.getDate()
      const checkDay = checkDateObj.getDate()
      // Same day of month
      return eventDay === checkDay
    }

    default:
      return false
  }
}

/**
 * Gets all dates a recurring goal should appear on within a date range
 */
export function getRecurringGoalDates(
  repeatFrequency: RepeatFrequency,
  daysOfWeek: string,
  eventDate: string,
  startDate: string,
  endDate: string,
): string[] {
  const dates: string[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    if (goalAppliesToDate(repeatFrequency, daysOfWeek, eventDate, dateStr)) {
      dates.push(dateStr)
    }
    current.setDate(current.getDate() + 1)
  }

  return dates
}
