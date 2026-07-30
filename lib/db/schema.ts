import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  time,
  pgEnum,
} from 'drizzle-orm/pg-core'

// Better Auth tables
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull(),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  expiresAt: timestamp('expiresAt'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt'),
})

// App-specific tables
export const eventTypeEnum = pgEnum('event_type', ['regular', 'goal_based'])

export const events = pgTable('events', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  date: date('date').notNull(),
  startTime: time('startTime'),
  endTime: time('endTime'),
  eventType: eventTypeEnum('eventType').notNull().default('regular'),
  color: text('color'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const goals = pgTable('goals', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  eventId: text('eventId')
    .notNull()
    .references(() => events.id),
  goalTimeMinutes: integer('goalTimeMinutes').notNull(),
  repeatFrequency: text('repeatFrequency').notNull().default('once'),
  daysOfWeek: text('daysOfWeek').notNull().default('[]'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const timerSessions = pgTable('timerSessions', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  goalId: text('goalId')
    .notNull()
    .references(() => goals.id),
  eventId: text('eventId')
    .notNull()
    .references(() => events.id),
  sessionStart: timestamp('sessionStart').notNull(),
  sessionEnd: timestamp('sessionEnd'),
  durationMinutes: integer('durationMinutes'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const reminderTypeEnum = pgEnum('reminder_type', ['event', 'goal_focus', 'track_time'])

export const reminders = pgTable('reminders', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  eventId: text('eventId')
    .notNull()
    .references(() => events.id),
  reminderType: reminderTypeEnum('reminderType').notNull(),
  reminderTime: timestamp('reminderTime').notNull(),
  isDismissed: boolean('isDismissed').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const userPreferences = pgTable('userPreferences', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().unique(),
  primaryColor: text('primaryColor').notNull().default('#3b82f6'),
  clockType: text('clockType').notNull().default('digital'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
