import { Target } from 'lucide-react'

type CurrentGoal = { id: string; title: string; goalTimeMinutes: number }

export function CurrentGoalsWidget({ goals }: { goals: CurrentGoal[] }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2"><Target className="text-primary" aria-hidden="true" /><h3 className="text-sm font-semibold">Current goals</h3></div>
      {goals.length ? <div className="flex min-h-0 flex-col gap-2 overflow-auto">{goals.slice(0, 5).map((goal) => <div key={goal.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2"><span className="truncate text-sm">{goal.title}</span><span className="shrink-0 text-xs text-muted-foreground">{goal.goalTimeMinutes} min</span></div>)}</div> : <p className="text-sm text-muted-foreground">No current goals.</p>}
    </div>
  )
}

export type { CurrentGoal }
