import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getUserPreferences } from '@/app/actions/calendar'
import { ThemeProvider } from '@/lib/theme-context'
import { HomeScreen } from '@/components/home-screen'

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const prefs = await getUserPreferences()

  return (
    <ThemeProvider
      initialColor={prefs.primaryColor}
      initialClockType={prefs.clockType}
    >
      <HomeScreen />
    </ThemeProvider>
  )
}
