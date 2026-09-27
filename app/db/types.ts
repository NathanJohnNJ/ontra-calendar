import type { timerSessions } from '@/lib/db/schema'

/**
 * Plain serializable types for data that crosses the server -> client boundary.
 * Server components can pass query results straight to client components without
 * re-declaring (and drifting) duplicate interfaces on each side.
 */
export type TimerSession = typeof timerSessions.$inferSelect
