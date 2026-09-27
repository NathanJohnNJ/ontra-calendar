import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getUserPreferences, getGoalsForDate, getActiveTimerSessions } from '@/app/actions/calendar'
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
  const [prefs, goalsData, openSessions] = await Promise.all([
    getUserPreferences(session.user.id),
    getGoalsForDate(today),
    getActiveTimerSessions(today),
  ])

  return (
    <ThemeProvider
      initialColor={prefs.primaryColor}
      initialClockType={prefs.clockType}
    >
      <HomeScreen
        initialGoals={goalsData.map((goal: any) => ({
          id: goal.id,
          eventId: goal.eventId,
          goalTimeMinutes: goal.goalTimeMinutes,
        }))}
        initialSessions={openSessions}
        initialLayout={prefs.dashboardLayout}
      />
    </ThemeProvider>
  )
}
