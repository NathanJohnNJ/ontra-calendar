'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  events,
  tasks,
  taskSubtasks,
  goals,
  timerSessions,
  reminders,
  userPreferences,
} from '@/lib/db/schema'
import { eq, and, desc, gte, lte, or, inArray, isNull } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid'
import { goalAppliesToDate } from '@/lib/recurring-goals'

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
  repeatFrequency?: string
  daysOfWeek?: number[]
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
    repeatFrequency: data.repeatFrequency || 'once',
    daysOfWeek: JSON.stringify(data.daysOfWeek || []),
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

export async function getEventsForDateWithRecurring(date: string, userIdParam?: string) {
  const userId = userIdParam ?? (await getUserId())

  // Independent queries run CONCURRENTLY instead of sequentially — this alone
  // cuts the action's latency from (t1 + t2 + t3 + N*t4) to roughly max(t_i).
  const [directEvents, allEvents, goalEventRows] = await Promise.all([
    // Events specifically for this date
    db
      .select()
      .from(events)
      .where(and(eq(events.userId, userId), eq(events.date, date))),
    // All events that are recurring
    db.select().from(events).where(eq(events.userId, userId)),
    // All goals joined to their event in ONE query (previously an N+1 loop
    // that awaited one SELECT per goal).
    db
      .select({ goal: goals, event: events })
      .from(goals)
      .innerJoin(events, eq(events.id, goals.eventId))
      .where(eq(goals.userId, userId)),
  ])

  // Filter recurring events that apply to this date
  const recurringEventInstances = allEvents.filter((evt) => {
    if (evt.repeatFrequency === 'once') return false
    return goalAppliesToDate(
      evt.repeatFrequency as any,
      evt.daysOfWeek,
      evt.date,
      date,
    )
  })

  // Filter goals that apply to this date
  const recurringGoalInstances = goalEventRows
    .filter(({ goal, event }) =>
      goalAppliesToDate(
        goal.repeatFrequency as any,
        goal.daysOfWeek,
        event.date,
        date,
      ),
    )
    .map(({ event }) => event)

  // Combine direct events, recurring events, and recurring goal instances, remove duplicates
  const combinedEvents = [
    ...directEvents,
    ...recurringEventInstances.filter(
      (evt) => !directEvents.some((de) => de.id === evt.id),
    ),
    ...recurringGoalInstances.filter(
      (evt) =>
        !directEvents.some((de) => de.id === evt.id) &&
        !recurringEventInstances.some((re) => re.id === evt.id),
    ),
  ]

  return combinedEvents.sort((a, b) => (a.startTime ?? '') > (b.startTime ?? '') ? 1 : -1)
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
  daysOfWeek: number[] = [],
) {
  const userId = await getUserId()
  const goalId = uuidv4()

  await db.insert(goals).values({
    id: goalId,
    userId,
    eventId,
    goalTimeMinutes,
    repeatFrequency,
    daysOfWeek: JSON.stringify(daysOfWeek),
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

export async function getGoalsForDate(date: string) {
  const userId = await getUserId()

  // Resolve auth ONCE and pass the userId down (previously getUserId ran again
  // inside getEventsForDateWithRecurring).
  const goalEvents = await getEventsForDateWithRecurring(date, userId)
  const goalEventIds = goalEvents.filter((e) => e.eventType === 'goal_based').map((e) => e.id)

  if (goalEventIds.length === 0) {
    return []
  }

  // Filter by event ids IN SQL instead of fetching every goal and filtering in JS.
  return db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), inArray(goals.eventId, goalEventIds)))
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
        isNull(timerSessions.sessionEnd),
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

// Task Actions
export async function createTask(data: { title: string; description?: string; links?: string; notes?: string; goalDate?: string; goalDurationMinutes?: number; repeatFrequency?: string; daysOfWeek?: number[] }) {
  const userId = await getUserId()
  const id = uuidv4()
  await db.insert(tasks).values({ id, userId, title: data.title, description: data.description || null, links: JSON.stringify((data.links || '').split('\\n').map((link) => link.trim()).filter(Boolean)), notes: data.notes || null, goalDate: data.goalDate || null, goalDurationMinutes: data.goalDurationMinutes || null, repeatFrequency: data.repeatFrequency || 'once', daysOfWeek: JSON.stringify(data.daysOfWeek || []), createdAt: new Date(), updatedAt: new Date() })
  revalidatePath('/')
  return { id, userId, title: data.title, description: data.description || null, links: data.links || '', notes: data.notes || null, goalDate: data.goalDate || null, goalDurationMinutes: data.goalDurationMinutes || null, repeatFrequency: data.repeatFrequency || 'once', daysOfWeek: JSON.stringify(data.daysOfWeek || []), completed: false }
}

export async function getTasks() {
  const userId = await getUserId()
  const rows = await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt))
  const children = await db.select().from(taskSubtasks).where(eq(taskSubtasks.taskId, rows.length ? rows[0].id : '__none__'))
  return rows.map((task) => ({ ...task, links: JSON.parse(task.links || '[]').join('\\n'), subtasks: task.id === rows[0]?.id ? children : [] }))
}

export async function toggleTask(id: string, completed: boolean) {
  const userId = await getUserId()
  await db.update(tasks).set({ completed, updatedAt: new Date() }).where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
  revalidatePath('/')
}

export async function createTaskSubtask(taskId: string, data: { title: string; description?: string; priority: string }) {
  const userId = await getUserId()
  const owns = await db.select({ id: tasks.id }).from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId))).limit(1)
  if (!owns.length) throw new Error('Unauthorized')
  const id = uuidv4()
  const row = { id, taskId, title: data.title, description: data.description || null, priority: data.priority || 'med', completed: false }
  await db.insert(taskSubtasks).values(row)
  revalidatePath('/')
  return row
}

export async function toggleTaskSubtask(id: string, completed: boolean) {
  const userId = await getUserId()
  const owned = await db.select({ taskId: taskSubtasks.taskId }).from(taskSubtasks).innerJoin(tasks, eq(tasks.id, taskSubtasks.taskId)).where(and(eq(taskSubtasks.id, id), eq(tasks.userId, userId))).limit(1)
  if (!owned.length) throw new Error('Unauthorized')
  await db.update(taskSubtasks).set({ completed }).where(eq(taskSubtasks.id, id))
  revalidatePath('/')
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
  reminderType: 'event' | 'goal_focus' | 'track_time',
  reminderTime: Date,
) {
  const userId = await getUserId()
  const reminderId = uuidv4()

  await db.insert(reminders).values({
    id: reminderId,
    userId,
    eventId,
    reminderType: reminderType as any,
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
export async function getUserPreferences(userIdParam?: string) {
  const userId = userIdParam ?? (await getUserId())
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
  return { id, userId, primaryColor: '#3b82f6', clockType: 'digital', dashboardLayout: '[]' }
  }
  
  return prefs[0]
}

export async function updateUserPreferences(data: {
  primaryColor?: string
  clockType?: string
  dashboardLayout?: string
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
