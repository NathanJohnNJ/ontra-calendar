'use client'

import { useState } from 'react'
import { Check, ChevronDown, ChevronRight, Link as LinkIcon, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTask, createTaskSubtask, toggleTask, toggleTaskSubtask } from '@/app/actions/calendar'

type Subtask = { id: string; title: string; description: string | null; priority: string; completed: boolean }
type Task = { id: string; title: string; description: string | null; links: string; notes: string | null; goalDate: string | null; goalDurationMinutes: number | null; repeatFrequency: string; daysOfWeek: string; completed: boolean; subtasks: Subtask[] }

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function TasksWidget({ initialTasks = [] }: { initialTasks?: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', links: '', notes: '', goalDate: '', goalDurationMinutes: '', repeatFrequency: 'once', daysOfWeek: [] as number[] })
  const [subtask, setSubtask] = useState({ title: '', description: '', priority: 'med' })

  const addTask = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    try {
      const task = await createTask({ ...form, goalDurationMinutes: form.goalDurationMinutes ? Number(form.goalDurationMinutes) : undefined })
      setTasks((current) => [{ ...task, subtasks: [] } as Task, ...current])
      setForm({ title: '', description: '', links: '', notes: '', goalDate: '', goalDurationMinutes: '', repeatFrequency: 'once', daysOfWeek: [] })
      setShowForm(false)
    } finally { setLoading(false) }
  }

  const addSubtask = async (taskId: string) => {
    if (!subtask.title.trim()) return
    const created = await createTaskSubtask(taskId, subtask)
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, subtasks: [...task.subtasks, created as Subtask] } : task))
    setSubtask({ title: '', description: '', priority: 'med' })
  }

  return <>
    <div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold">Tasks</h3><p className="text-xs text-muted-foreground">{tasks.filter((task) => !task.completed).length} remaining</p></div><Button size="sm" onClick={() => setShowForm(true)}><Plus data-icon="inline-start" /> Add task</Button></div>
    <div className="mt-4 flex flex-col gap-2">{tasks.length === 0 ? <p className="rounded-lg bg-muted/50 px-3 py-4 text-sm text-muted-foreground">No tasks yet. Add one to turn your goals into progress.</p> : tasks.map((task) => <div key={task.id} className="rounded-lg border border-border p-3"><div className="flex items-start gap-2"><button aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'} onClick={async () => { await toggleTask(task.id, !task.completed); setTasks((current) => current.map((item) => item.id === task.id ? { ...item, completed: !item.completed } : item)) }} className={`mt-0.5 rounded-full border p-1 ${task.completed ? 'bg-primary text-primary-foreground' : 'text-transparent'}`}><Check aria-hidden="true" /></button><button className="flex flex-1 items-center gap-1 text-left" onClick={() => setExpanded(expanded === task.id ? null : task.id)}>{expanded === task.id ? <ChevronDown /> : <ChevronRight />}<span className={task.completed ? 'text-muted-foreground line-through' : 'font-medium'}>{task.title}</span></button>{(task.goalDate || task.goalDurationMinutes) && <span className="text-xs text-muted-foreground">{task.goalDate ? `Due ${task.goalDate}` : `${task.goalDurationMinutes} min`}</span>}</div>{expanded === task.id && <div className="ml-9 mt-3 flex flex-col gap-3 text-sm"><p className="text-muted-foreground">{task.description || 'No description yet.'}</p>{task.notes && <p><span className="font-medium">Notes:</span> {task.notes}</p>}{task.links && <div className="flex items-center gap-1 text-primary"><LinkIcon /> {task.links.split('\n').map((link) => <a key={link} href={link} target="_blank" rel="noreferrer" className="underline">{link}</a>)}</div>}<div className="flex flex-col gap-2"><p className="font-medium">Subtasks</p>{task.subtasks.map((item) => <label key={item.id} className="flex items-start gap-2"><input type="checkbox" checked={item.completed} onChange={async () => { await toggleTaskSubtask(item.id, !item.completed); setTasks((current) => current.map((parent) => parent.id === task.id ? { ...parent, subtasks: parent.subtasks.map((child) => child.id === item.id ? { ...child, completed: !child.completed } : child) } : parent)) }} /><span className={item.completed ? 'line-through text-muted-foreground' : ''}>{item.title} <span className="text-xs text-muted-foreground">({item.priority})</span></span></label>)}<div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><div><Label htmlFor={`subtask-${task.id}`}>New subtask</Label><Input id={`subtask-${task.id}`} value={subtask.title} onChange={(event) => setSubtask({ ...subtask, title: event.target.value })} placeholder="Title" /></div><Input aria-label="Subtask description" value={subtask.description} onChange={(event) => setSubtask({ ...subtask, description: event.target.value })} placeholder="Description" /><select aria-label="Subtask priority" value={subtask.priority} onChange={(event) => setSubtask({ ...subtask, priority: event.target.value })} className="h-8 rounded-lg border border-border bg-background px-2"><option value="low">Low</option><option value="med">Med</option><option value="high">High</option></select><Button size="sm" onClick={() => addSubtask(task.id)}>Add</Button></div></div></div>}</div>)}</div>
    {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={addTask} className="flex max-h-[90vh] w-full max-w-xl flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-card p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Add task</h2><p className="text-sm text-muted-foreground">Capture the next concrete step.</p></div><Button type="button" variant="ghost" size="icon" onClick={() => setShowForm(false)} aria-label="Close"><X /></Button></div><div><Label htmlFor="task-title">Title</Label><Input id="task-title" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What needs to get done?" /></div><div><Label htmlFor="task-description">Description</Label><textarea id="task-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2" /></div><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="goal-date">Goal date</Label><Input id="goal-date" type="date" value={form.goalDate} onChange={(event) => setForm({ ...form, goalDate: event.target.value })} /></div><div><Label htmlFor="goal-duration">Goal length (minutes)</Label><Input id="goal-duration" type="number" min="1" value={form.goalDurationMinutes} onChange={(event) => setForm({ ...form, goalDurationMinutes: event.target.value })} /></div></div><div><Label htmlFor="task-links">Links</Label><textarea id="task-links" value={form.links} onChange={(event) => setForm({ ...form, links: event.target.value })} placeholder="One URL per line" rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2" /></div><div><Label htmlFor="task-notes">Notes</Label><textarea id="task-notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2" /></div><div><Label htmlFor="task-repeat">Repeat</Label><select id="task-repeat" value={form.repeatFrequency} onChange={(event) => setForm({ ...form, repeatFrequency: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2"><option value="once">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="biweekly">Bi-weekly</option></select></div>{form.repeatFrequency !== 'once' && <div><Label>Days</Label><div className="mt-2 flex flex-wrap gap-2">{days.map((day, index) => <button key={day} type="button" onClick={() => setForm({ ...form, daysOfWeek: form.daysOfWeek.includes(index) ? form.daysOfWeek.filter((value) => value !== index) : [...form.daysOfWeek, index] })} className={`rounded-md px-2 py-1 text-xs ${form.daysOfWeek.includes(index) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{day}</button>)}</div></div>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create task'}</Button></div></form></div>}
  </>
}
