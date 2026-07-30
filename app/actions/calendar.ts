'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  events,
  goals,
  timerSessions,
  reminders,
  userPreferences,
} from '@/lib/db/schema'
import { eq, and, desc, gte, lte } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

// Event Actions
export async function createEvent(data: {
  title: string
  description?: string
  date: string
  startTime?: string
  endTime?: string
  eventType: 'regular' | 'goal_based'
  color?: string
}) {
  const userId = await getUserId()
  const eventId = uuidv4()

  await db.insert(events).values({
    id: eventId,
    userId,
    title: data.title,
    description: data.description,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    eventType: data.eventType,
    color: data.color,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  revalidatePath('/')
  return eventId
}

export async function getEventsForDate(date: string) {
  const userId = await getUserId()
  return db
    .select()
    .from(events)
    .where(and(eq(events.userId, userId), eq(events.date, date)))
    .orderBy(events.startTime)
}

export async function updateEvent(
  id: string,
  data: Partial<typeof events.$inferInsert>,
) {
  const userId = await getUserId()
  await db
    .update(events)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(events.id, id), eq(events.userId, userId)))

  revalidatePath('/')
}

export async function deleteEvent(id: string) {
  const userId = await getUserId()
  await db.delete(events).where(and(eq(events.id, id), eq(events.userId, userId)))

  revalidatePath('/')
}

// Goal Actions
export async function createGoal(
  eventId: string,
  goalTimeMinutes: number,
  repeatFrequency: string = 'once',
) {
  const userId = await getUserId()
  const goalId = uuidv4()

  await db.insert(goals).values({
    id: goalId,
    userId,
    eventId,
    goalTimeMinutes,
    repeatFrequency,
    createdAt: new Date(),
  })

  revalidatePath('/')
  return goalId
}

export async function getGoalsForEvent(eventId: string) {
  const userId = await getUserId()
  return db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.eventId, eventId)))
}

// Timer Session Actions
export async function startTimerSession(goalId: string, eventId: string) {
  const userId = await getUserId()
  const sessionId = uuidv4()

  await db.insert(timerSessions).values({
    id: sessionId,
    userId,
    goalId,
    eventId,
    sessionStart: new Date(),
    createdAt: new Date(),
  })

  revalidatePath('/')
  return sessionId
}

export async function stopTimerSession(sessionId: string) {
  const userId = await getUserId()
  const session = await db
    .select()
    .from(timerSessions)
    .where(
      and(
        eq(timerSessions.id, sessionId),
        eq(timerSessions.userId, userId),
      ),
    )
    .limit(1)

  if (!session.length) throw new Error('Session not found')

  const endTime = new Date()
  const durationMinutes = Math.round(
    (endTime.getTime() - session[0].sessionStart.getTime()) / 1000 / 60,
  )

  await db
    .update(timerSessions)
    .set({
      sessionEnd: endTime,
      durationMinutes,
    })
    .where(eq(timerSessions.id, sessionId))

  revalidatePath('/')
  return { durationMinutes }
}

export async function getTimerSessionsForGoal(goalId: string, date: string) {
  const userId = await getUserId()
  return db
    .select()
    .from(timerSessions)
    .where(
      and(
        eq(timerSessions.userId, userId),
        eq(timerSessions.goalId, goalId),
        gte(
          timerSessions.sessionStart,
          new Date(`${date}T00:00:00Z`),
        ),
        lte(
          timerSessions.sessionStart,
          new Date(`${date}T23:59:59Z`),
        ),
      ),
    )
    .orderBy(desc(timerSessions.sessionStart))
}

export async function getActiveTimerSessions(date: string) {
  const userId = await getUserId()
  return db
    .select()
    .from(timerSessions)
    .where(
      and(
        eq(timerSessions.userId, userId),
        eq(timerSessions.sessionEnd, null),
        gte(
          timerSessions.sessionStart,
          new Date(`${date}T00:00:00Z`),
        ),
        lte(
          timerSessions.sessionStart,
          new Date(`${date}T23:59:59Z`),
        ),
      ),
    )
    .orderBy(desc(timerSessions.sessionStart))
}

// Stats Actions
export async function getDayStats(date: string) {
  const userId = await getUserId()

  const sessions = await db
    .select()
    .from(timerSessions)
    .where(
      and(
        eq(timerSessions.userId, userId),
        gte(
          timerSessions.sessionStart,
          new Date(`${date}T00:00:00Z`),
        ),
        lte(
          timerSessions.sessionStart,
          new Date(`${date}T23:59:59Z`),
        ),
      ),
    )

  const totalMinutes = sessions.reduce(
    (sum, session) => sum + (session.durationMinutes || 0),
    0,
  )

  return { totalMinutes, sessionCount: sessions.length }
}

// Reminder Actions
export async function createReminder(
  eventId: string,
  reminderType: string,
  reminderTime: Date,
) {
  const userId = await getUserId()
  const reminderId = uuidv4()

  await db.insert(reminders).values({
    id: reminderId,
    userId,
    eventId,
    reminderType,
    reminderTime,
    isDismissed: false,
    createdAt: new Date(),
  })

  revalidatePath('/')
  return reminderId
}

export async function getPendingReminders() {
  const userId = await getUserId()
  return db
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.userId, userId),
        eq(reminders.isDismissed, false),
        lte(reminders.reminderTime, new Date()),
      ),
    )
    .orderBy(desc(reminders.reminderTime))
}

export async function dismissReminder(reminderId: string) {
  const userId = await getUserId()
  await db
    .update(reminders)
    .set({ isDismissed: true })
    .where(
      and(
        eq(reminders.id, reminderId),
        eq(reminders.userId, userId),
      ),
    )

  revalidatePath('/')
}

// User Preferences Actions
export async function getUserPreferences() {
  const userId = await getUserId()
  const prefs = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1)

  if (!prefs.length) {
    // Create default preferences
    const id = uuidv4()
    await db.insert(userPreferences).values({
      id,
      userId,
      primaryColor: '#3b82f6',
      clockType: 'digital',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id, userId, primaryColor: '#3b82f6', clockType: 'digital' }
  }

  return prefs[0]
}

export async function updateUserPreferences(data: {
  primaryColor?: string
  clockType?: string
}) {
  const userId = await getUserId()
  const prefs = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1)

  if (!prefs.length) {
    const id = uuidv4()
    await db.insert(userPreferences).values({
      id,
      userId,
      primaryColor: data.primaryColor || '#3b82f6',
      clockType: data.clockType || 'digital',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  } else {
    await db
      .update(userPreferences)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId))
  }

  revalidatePath('/')
}
