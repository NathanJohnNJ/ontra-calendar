import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getUserPreferences, getGoalsForDate, getActiveTimerSessions, getEventsForDateWithRecurring, getTasks } from '@/app/actions/calendar'
import { ThemeProvider } from '@/lib/theme-context'
import { HomeScreen } from '@/components/home-screen'

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  // Previously these ran strictly one after another (3 sequential round trips:
  // session -> prefs -> goals(+events)). Now the independent data fetches run
  // concurrently and reuse the already-resolved userId — no repeated auth calls.
  const today = new Date().toISOString().split('T')[0]
  const [prefs, goalsData, openSessions, eventsData, tasksData] = await Promise.all([
    getUserPreferences(session.user.id),
    getGoalsForDate(today),
    getActiveTimerSessions(today),
    getEventsForDateWithRecurring(today, session.user.id),
    getTasks(),
  ])

  return (
    <ThemeProvider
      initialColor={prefs.primaryColor}
      initialClockType={prefs.clockType}
    >
      <HomeScreen
        initialSessions={openSessions}
        initialEvents={eventsData}
        currentGoals={goalsData.map((goal: any) => ({
          id: goal.id,
          eventId: goal.eventId,
          goalTimeMinutes: goal.goalTimeMinutes,
          title: eventsData.find((event) => event.id === goal.eventId)?.title ?? 'Goal',
        }))}
        initialLayout={prefs.dashboardLayout}
        initialTasks={tasksData as any}
      />
    </ThemeProvider>
  )
}
