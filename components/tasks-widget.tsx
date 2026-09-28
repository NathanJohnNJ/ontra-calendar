'use client'

import { useState } from 'react'
import { Check, ExternalLink, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTask, createTaskSubtask, toggleTask } from '@/app/actions/calendar'

type Subtask = { id: string; title: string; description: string | null; priority: string; completed: boolean }
type Task = { id: string; title: string; description: string | null; links: string; notes: string | null; goalDate: string | null; goalDurationMinutes: number | null; repeatFrequency: string; daysOfWeek: string; completed: boolean; subtasks: Subtask[] }

function dueLabel(task: Task) {
  if (task.goalDate) return `Due ${new Date(`${task.goalDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
  if (task.goalDurationMinutes) return `${task.goalDurationMinutes} min goal`
  return 'No due date'
}

export function TasksWidget({ initialTasks = [] }: { initialTasks?: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [selected, setSelected] = useState<Task | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', links: '', notes: '', goalDate: '', goalDurationMinutes: '' })

  const addTask = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    try {
      const task = await createTask({ ...form, goalDurationMinutes: form.goalDurationMinutes ? Number(form.goalDurationMinutes) : undefined })
      const next = { ...task, subtasks: [] } as Task
      setTasks((current) => [next, ...current])
      setShowForm(false)
      setForm({ title: '', description: '', links: '', notes: '', goalDate: '', goalDurationMinutes: '' })
    } finally { setLoading(false) }
  }

  const updateCompletion = async (task: Task) => {
    await toggleTask(task.id, !task.completed)
    const next = { ...task, completed: !task.completed }
    setTasks((current) => current.map((item) => item.id === task.id ? next : item))
    if (selected?.id === task.id) setSelected(next)
  }

  return <>
    <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Tasks</h3><p className="text-xs text-muted-foreground">{tasks.filter((task) => !task.completed).length} remaining</p></div><Button size="sm" onClick={() => setShowForm(true)}><Plus data-icon="inline-start" /> Add task</Button></div>
    <div className="mt-4 flex flex-col gap-2">
      {tasks.length === 0 ? <p className="rounded-lg bg-muted/50 px-3 py-4 text-sm text-muted-foreground">No tasks yet. Add one to get started.</p> : tasks.map((task) => <div key={task.id} className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-start gap-3"><button type="button" aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'} onClick={() => updateCompletion(task)} className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border ${task.completed ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/50 text-transparent'}`}><Check aria-hidden="true" /></button><button type="button" className="min-w-0 flex-1 text-left" onClick={() => setSelected(task)}><div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><span className={task.completed ? 'font-medium text-muted-foreground line-through' : 'font-medium'}>{task.title}</span><span className="shrink-0 text-xs text-muted-foreground">{dueLabel(task)}</span></div><div className="mt-2 flex flex-col gap-1">{task.subtasks.slice(0, 3).map((subtask) => <span key={subtask.id} className={`truncate text-xs text-muted-foreground ${subtask.completed ? 'line-through' : ''}`}>• {subtask.title}</span>)}</div></button></div>
      </div>)}
    </div>

    {(selected || showForm) && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSelected(null); setShowForm(false) } }}>
      {selected ? <TaskDetails task={selected} onClose={() => setSelected(null)} onToggle={() => updateCompletion(selected)} onTaskChange={(task) => { setSelected(task); setTasks((current) => current.map((item) => item.id === task.id ? task : item)) }} /> : <form onSubmit={addTask} className="flex max-h-[90vh] w-full max-w-xl flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-card p-6"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Add task</h2><Button type="button" variant="ghost" size="icon" onClick={() => setShowForm(false)} aria-label="Close"><X /></Button></div><TaskFields form={form} setForm={setForm} /><Button type="submit" disabled={loading}>{loading ? 'Adding…' : 'Add task'}</Button></form>}
    </div>}
  </>
}

function TaskFields({ form, setForm }: { form: any; setForm: (value: any) => void }) { const update = (key: string, value: string) => setForm({ ...form, [key]: value }); return <><div><Label htmlFor="task-title">Title</Label><Input id="task-title" required value={form.title} onChange={(e) => update('title', e.target.value)} /></div><div><Label htmlFor="task-description">Description</Label><textarea id="task-description" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" /></div><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="goal-date">Due date</Label><Input id="goal-date" type="date" value={form.goalDate} onChange={(e) => update('goalDate', e.target.value)} /></div><div><Label htmlFor="goal-duration">Goal length (minutes)</Label><Input id="goal-duration" type="number" min="1" value={form.goalDurationMinutes} onChange={(e) => update('goalDurationMinutes', e.target.value)} /></div></div><div><Label htmlFor="task-links">Links</Label><textarea id="task-links" rows={2} placeholder="One URL per line" value={form.links} onChange={(e) => update('links', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" /></div><div><Label htmlFor="task-notes">Notes</Label><textarea id="task-notes" rows={2} value={form.notes} onChange={(e) => update('notes', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" /></div></> }

function TaskDetails({ task, onClose, onToggle, onTaskChange }: { task: Task; onClose: () => void; onToggle: () => void; onTaskChange: (task: Task) => void }) { const [subtask, setSubtask] = useState({ title: '', description: '', priority: 'med' }); const add = async (e: React.FormEvent) => { e.preventDefault(); if (!subtask.title.trim()) return; const created = await createTaskSubtask(task.id, subtask); onTaskChange({ ...task, subtasks: [...task.subtasks, created as Subtask] }); setSubtask({ title: '', description: '', priority: 'med' }) }; return <div className="flex max-h-[90vh] w-full max-w-xl flex-col gap-5 overflow-y-auto rounded-xl border border-border bg-card p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">{task.title}</h2><p className="text-sm text-muted-foreground">{dueLabel(task)}{task.completed ? ' · Completed' : ''}</p></div><Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X /></Button></div><p className="text-sm text-muted-foreground">{task.description || 'No description.'}</p>{task.links && <div className="flex flex-col gap-1 text-sm">{task.links.split('\n').filter(Boolean).map((link) => <a key={link} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary underline"><ExternalLink data-icon="inline-start" />{link}</a>)}</div>}{task.notes && <div><h3 className="text-sm font-medium">Notes</h3><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{task.notes}</p></div>}<div><h3 className="mb-2 text-sm font-medium">Subtasks</h3><div className="flex flex-col gap-2">{task.subtasks.map((item) => <div key={item.id} className="rounded-md bg-muted/50 px-3 py-2 text-sm"><div className="flex justify-between gap-3"><span>{item.title}</span><span className="text-xs uppercase text-muted-foreground">{item.priority}</span></div>{item.description && <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>}</div>)}</div><form onSubmit={add} className="mt-3 grid gap-2"><Input placeholder="Subtask title" value={subtask.title} onChange={(e) => setSubtask({ ...subtask, title: e.target.value })} /><Input placeholder="Description" value={subtask.description} onChange={(e) => setSubtask({ ...subtask, description: e.target.value })} /><select value={subtask.priority} onChange={(e) => setSubtask({ ...subtask, priority: e.target.value })} className="h-9 rounded-md border border-border bg-background px-3 text-sm"><option value="low">Low priority</option><option value="med">Medium priority</option><option value="high">High priority</option></select><Button type="submit" variant="outline">Add subtask</Button></form></div><Button type="button" onClick={onToggle}>{task.completed ? 'Mark incomplete' : 'Mark complete'}</Button></div> }
