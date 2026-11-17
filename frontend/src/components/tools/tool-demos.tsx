'use client'

import { useId, useState } from 'react'
import type { ToolKey } from '@/components/home/content'
import { BrushBar, Paper, SketchButton, Stamp, Vine } from '@/components/sketch'
import { cn } from '@/lib/utils'

/*
 * Interactive demos for the six planning tools. They run entirely in the browser:
 * the figures are examples, nothing is sent and nothing is saved.
 */

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

function ExampleNote({ children }: { children?: React.ReactNode }) {
  return <p className="text-ink-soft mb-4 text-[0.88rem]">{children ?? 'Example data. Nothing here is sent or saved.'}</p>
}

const notice = 'sk-hand text-blue mt-3 text-[1.15rem] font-bold'
const rowLine = 'border-line border-b-[1.5px] border-dashed'

/* ------------------------------ Budget ------------------------------ */
const BUDGET_CATEGORIES: Array<[string, number]> = [
  ['Venue', 30],
  ['Catering', 28],
  ['Decor', 12],
  ['Photography', 10],
  ['Entertainment', 6],
  ['Makeup', 4],
  ['Planner', 4],
  ['Mehndi', 3],
  ['Miscellaneous', 3],
]

function BudgetDemo() {
  const id = useId()
  const [total, setTotal] = useState(800000)
  const [pct, setPct] = useState(BUDGET_CATEGORIES.map(([, p]) => p))
  const sum = pct.reduce((a, b) => a + b, 0)
  const left = 100 - sum
  return (
    <Paper className="px-6 py-5">
      <ExampleNote>Example split. Drag the sliders to try your own.</ExampleNote>
      <div className="sk-field max-w-[280px]">
        <label htmlFor={`${id}-total`}>Total budget (INR)</label>
        <input id={`${id}-total`} type="number" min={0} step={10000} value={total} onChange={(e) => setTotal(Math.max(0, Number(e.target.value) || 0))} />
      </div>
      {BUDGET_CATEGORIES.map(([name], i) => (
        <div key={name} className={cn(rowLine, 'grid grid-cols-[130px_1fr_92px_46px] items-center gap-3 py-[7px] max-sm:grid-cols-[84px_1fr_78px] max-sm:gap-2')}>
          <span>{name}</span>
          <input
            type="range"
            min={0}
            max={60}
            value={pct[i]}
            aria-label={`${name} share`}
            className="accent-blue w-full"
            onChange={(e) => setPct((p) => p.map((v, j) => (j === i ? Number(e.target.value) : v)))}
          />
          <b className="text-right tabular-nums">{inr((total * pct[i]) / 100)}</b>
          <span className="text-ink-soft text-right tabular-nums max-sm:hidden">{pct[i]}%</span>
        </div>
      ))}
      <p className={notice} role="status" aria-live="polite">
        {sum === 100 ? (
          'Allocated 100%. Every rupee has a home.'
        ) : sum < 100 ? (
          <>
            Allocated {sum}%. <b>{left}%</b> ({inr((total * left) / 100)}) is still unplanned.
          </>
        ) : (
          `Over by ${sum - 100}%. Lower a share to balance.`
        )}
      </p>
    </Paper>
  )
}

/* ----------------------------- Checklist ---------------------------- */
const CHECKLIST: Array<[string, string]> = [
  ['Set a date and a rough budget', '12 months before'],
  ['Shortlist and visit venues', '10 months before'],
  ['Book venue and photographer', '9 months before'],
  ['Choose a planner or coordinator', '9 months before'],
  ['Book caterer and decorator', '6 months before'],
  ['Send save-the-date messages', '5 months before'],
  ['Book makeup and mehndi artists', '4 months before'],
  ['Finalise guest list', '3 months before'],
  ['Send digital invites', '2 months before'],
  ['Menu tasting and decor walkthrough', '1 month before'],
  ['Confirm every vendor and timing', '1 week before'],
  ['Pack the day-of kit', '1 day before'],
]

function ChecklistDemo() {
  const id = useId()
  const [done, setDone] = useState<Record<string, boolean>>({ '0': true, '1': true })
  const [custom, setCustom] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const items = [
    ...CHECKLIST.map(([t, when], i) => ({ key: String(i), title: t, when })),
    ...custom.map((t, i) => ({ key: `c${i}`, title: t, when: 'Added by you' })),
  ]
  const count = items.filter((x) => done[x.key]).length
  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const v = draft.trim()
    if (!v) return
    setCustom((c) => [...c, v])
    setDraft('')
  }
  return (
    <Paper className="max-w-[760px] px-6 py-5">
      <ExampleNote>Example wedding checklist. Tick tasks off or add your own.</ExampleNote>
      <div className="flex justify-between font-bold">
        Progress
        <span>
          {count} of {items.length}
        </span>
      </div>
      <BrushBar value={items.length ? (count / items.length) * 100 : 0} tone="green" className="mb-4" />
      <ul className="grid gap-2.5">
        {items.map((x) => (
          <li key={x.key}>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input type="checkbox" className="sk-check" checked={!!done[x.key]} onChange={(e) => setDone((d) => ({ ...d, [x.key]: e.target.checked }))} />
              <span className={done[x.key] ? 'text-ink-soft line-through decoration-blue-wash decoration-[3px]' : ''}>
                {x.title} <small className="text-ink-soft">· {x.when}</small>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="sk-field !m-0 min-w-[200px] flex-1">
          <label htmlFor={`${id}-task`}>Add your own task</label>
          <input id={`${id}-task`} placeholder="e.g. Book the band" value={draft} onChange={(e) => setDraft(e.target.value)} />
        </div>
        <SketchButton type="submit" size="sm">
          Add
        </SketchButton>
      </form>
    </Paper>
  )
}

/* ----------------------------- Timeline ----------------------------- */
const SEGMENTS: Record<string, Array<[string, number]>> = {
  Wedding: [['Guests arrive', 30], ['Baraat and welcome', 45], ['Ceremony', 75], ['Family photos', 45], ['Lunch', 90], ['Speeches and toasts', 30], ['Dance floor opens', 120]],
  Birthday: [['Guests arrive', 30], ['Games and music', 60], ['Cake cutting', 20], ['Lunch', 60], ['Return gifts and goodbyes', 20]],
  Gala: [['Registration and welcome drinks', 45], ['Opening remarks', 20], ['Dinner service', 90], ['Awards and performances', 60], ['Networking and close', 45]],
}

function fmtTime(m: number) {
  let h = Math.floor(m / 60) % 24
  const mm = m % 60
  const ap = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${mm < 10 ? '0' : ''}${mm} ${ap}`
}

function TimelineDemo() {
  const id = useId()
  const [start, setStart] = useState('10:00')
  const [kind, setKind] = useState('Wedding')
  const [hh, mm] = start.split(':')
  const base = (Number(hh) || 0) * 60 + (Number(mm) || 0)
  const rows = SEGMENTS[kind].map(([label, mins], i, all) => {
    const offset = all.slice(0, i).reduce((a, [, x]) => a + x, 0)
    return { time: fmtTime(base + offset), label, mins }
  })
  const end = fmtTime(base + SEGMENTS[kind].reduce((a, [, x]) => a + x, 0))
  const item = 'relative before:absolute before:top-[5px] before:-left-[31px] before:size-4 before:rounded-[50%_46%_52%_48%] before:bg-blue before:content-[""]'
  return (
    <Paper className="max-w-[680px] px-6 py-5">
      <ExampleNote>Example schedule. Pick a start time and event type.</ExampleNote>
      <div className="mb-3.5 flex flex-wrap items-end gap-4">
        <div className="sk-field !m-0">
          <label htmlFor={`${id}-t`}>Start time</label>
          <input id={`${id}-t`} type="time" value={start} onChange={(e) => setStart(e.target.value || '10:00')} />
        </div>
        <div className="sk-field !m-0">
          <label htmlFor={`${id}-k`}>Event type</label>
          <select id={`${id}-k`} value={kind} onChange={(e) => setKind(e.target.value)}>
            {Object.keys(SEGMENTS).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="relative mt-2.5 grid gap-5 pl-8 before:absolute before:top-2 before:bottom-2 before:left-[9px] before:border-l-[3px] before:border-dotted before:border-ink-soft before:content-['']" aria-live="polite">
        {rows.map((r, i) => (
          <div key={`${r.label}-${i}`} className={item}>
            <b className="block">{r.time}</b>
            {r.label} <span className="text-ink-soft text-[0.9rem]">· {r.mins} min</span>
          </div>
        ))}
        <div className={item}>
          <b className="block">{end}</b>
          Wrap up <span className="text-ink-soft text-[0.9rem]">· end of day</span>
        </div>
      </div>
    </Paper>
  )
}

/* ---------------------------- Guest list ---------------------------- */
type Guest = { id: number; name: string; group: string; table: number; status: 0 | 1 | 2 }
const STATUS = ['Pending', 'Confirmed', 'Declined'] as const
const STATUS_TONE = ['wait', 'ok', 'late'] as const
const GROUPS = ['Bride side', 'Groom side', 'Family', 'Friends']

const SAMPLE_GUESTS: Guest[] = [
  { id: 1, name: 'Anaya Rao', group: 'Bride side', table: 1, status: 1 },
  { id: 2, name: 'Rohan Mehta', group: 'Groom side', table: 2, status: 0 },
  { id: 3, name: 'Sunita Devi', group: 'Family', table: 1, status: 1 },
  { id: 4, name: 'Imran Qureshi', group: 'Friends', table: 4, status: 2 },
  { id: 5, name: 'Leela Nair', group: 'Friends', table: 4, status: 0 },
]

function GuestDemo() {
  const id = useId()
  const [guests, setGuests] = useState<Guest[]>(SAMPLE_GUESTS)
  const [name, setName] = useState('')
  const [group, setGroup] = useState(GROUPS[0])
  const [table, setTable] = useState(1)
  const [nextId, setNextId] = useState(6)
  const counts = [0, 0, 0]
  guests.forEach((g) => counts[g.status]++)
  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    setGuests((g) => [...g, { id: nextId, name: n, group, table: table || 1, status: 0 }])
    setNextId((x) => x + 1)
    setName('')
  }
  return (
    <Paper className="max-w-[820px] px-6 py-5">
      <ExampleNote>Example guests. Add, change status or remove them to try it.</ExampleNote>
      <div className="mb-3 flex flex-wrap gap-2.5" aria-live="polite">
        <Stamp tone="ok">{counts[1]} confirmed</Stamp>
        <Stamp tone="wait">{counts[0]} pending</Stamp>
        <Stamp tone="late">{counts[2]} declined</Stamp>
      </div>
      <div>
        {guests.length === 0 ? <p className="text-ink-soft py-3">No guests yet. Add one below.</p> : null}
        {guests.map((g) => (
          <div key={g.id} className={cn(rowLine, 'grid grid-cols-[1fr_auto_auto] items-center gap-2.5 py-2')}>
            <span>
              <b>{g.name}</b>
              <br />
              <small className="text-ink-soft">
                {g.group} · Table {g.table}
              </small>
            </span>
            <button
              type="button"
              className={cn('sk-stamp cursor-pointer bg-transparent', STATUS_TONE[g.status] === 'wait' && 'sk-stamp--wait', STATUS_TONE[g.status] === 'late' && 'sk-stamp--late')}
              aria-label={`Change RSVP status for ${g.name}, currently ${STATUS[g.status]}`}
              onClick={() => setGuests((all) => all.map((x) => (x.id === g.id ? { ...x, status: ((x.status + 1) % 3) as 0 | 1 | 2 } : x)))}
            >
              {STATUS[g.status]}
            </button>
            <button type="button" className="text-ink-soft hover:text-rose cursor-pointer px-1.5" aria-label={`Remove ${g.name}`} onClick={() => setGuests((all) => all.filter((x) => x.id !== g.id))}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={add} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="sk-field !m-0 min-w-[150px] flex-1">
          <label htmlFor={`${id}-n`}>Guest name</label>
          <input id={`${id}-n`} required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="sk-field !m-0">
          <label htmlFor={`${id}-g`}>Group</label>
          <select id={`${id}-g`} value={group} onChange={(e) => setGroup(e.target.value)}>
            {GROUPS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>
        <div className="sk-field !m-0 w-20">
          <label htmlFor={`${id}-t`}>Table</label>
          <input id={`${id}-t`} type="number" min={1} value={table} onChange={(e) => setTable(Number(e.target.value))} />
        </div>
        <SketchButton type="submit" size="sm">
          Add guest
        </SketchButton>
      </form>
    </Paper>
  )
}

/* ------------------------------- RSVP ------------------------------- */
function RsvpDemo() {
  const [guests, setGuests] = useState<Guest[]>(SAMPLE_GUESTS)
  const [msg, setMsg] = useState('')
  const counts = [0, 0, 0]
  guests.forEach((g) => counts[g.status]++)
  const n = guests.length || 1
  const rows: Array<[string, number, 'green' | 'gold' | 'blue']> = [
    ['Confirmed', counts[1], 'green'],
    ['Pending', counts[0], 'gold'],
    ['Declined', counts[2], 'blue'],
  ]
  const remind = () => {
    setMsg(counts[0] ? `Reminders drafted for ${counts[0]} pending guests. Example only, nothing was sent.` : 'Everyone has replied.')
  }
  const reply = (id: number) => {
    setGuests((all) => all.map((g) => (g.id === id ? { ...g, status: 1 } : g)))
    setMsg('')
  }
  return (
    <Paper className="max-w-[640px] px-6 py-5">
      <ExampleNote>Example responses for five sample guests. Nothing is sent.</ExampleNote>
      {rows.map(([label, c, tone]) => (
        <div key={label} className="mb-3.5">
          <div className="flex justify-between font-bold">
            <span>{label}</span>
            <span>
              {c} of {guests.length}
            </span>
          </div>
          <BrushBar value={(c / n) * 100} tone={tone} />
        </div>
      ))}
      {counts[0] > 0 ? (
        <p className="text-ink-soft mb-3 text-[0.88rem]">
          Pending: {guests.filter((g) => g.status === 0).map((g) => g.name).join(', ')}.{' '}
          <button type="button" className="text-blue cursor-pointer underline" onClick={() => reply(guests.find((g) => g.status === 0)!.id)}>
            Mark next as replied
          </button>
        </p>
      ) : null}
      <SketchButton onClick={remind}>Send reminders to pending guests</SketchButton>
      <p className={notice} role="status" aria-live="polite">
        {msg}
      </p>
    </Paper>
  )
}

/* ------------------------------ Invite ------------------------------ */
const SWATCHES: Array<[string, string]> = [
  ['Blue', 'var(--blue)'],
  ['Sage', 'var(--leaf-deep)'],
  ['Gold', '#b97800'],
]

function InviteDemo() {
  const id = useId()
  const [a, setA] = useState('Aarav')
  const [b, setB] = useState('Meera')
  const [d, setD] = useState('Saturday, 28 November 2026')
  const [v, setV] = useState('Lotus Garden Hall, Jaipur')
  const [color, setColor] = useState(0)
  const vine = 'M0 190C60 170 110 130 150 80C180 40 230 20 290 12'
  const small = 'text-ink-soft text-[0.72rem] font-bold tracking-[0.2em] uppercase'
  return (
    <div className="grid grid-cols-[1fr_340px] items-start gap-8 max-[900px]:grid-cols-1">
      <Paper className="p-[22px]">
        <ExampleNote>Example invitation. Edit the details and watch it change.</ExampleNote>
        <div className="sk-field">
          <label htmlFor={`${id}-a`}>First name</label>
          <input id={`${id}-a`} value={a} onChange={(e) => setA(e.target.value)} />
        </div>
        <div className="sk-field">
          <label htmlFor={`${id}-b`}>Second name</label>
          <input id={`${id}-b`} value={b} onChange={(e) => setB(e.target.value)} />
        </div>
        <div className="sk-field">
          <label htmlFor={`${id}-d`}>Date</label>
          <input id={`${id}-d`} value={d} onChange={(e) => setD(e.target.value)} />
        </div>
        <div className="sk-field">
          <label htmlFor={`${id}-v`}>Venue</label>
          <input id={`${id}-v`} value={v} onChange={(e) => setV(e.target.value)} />
        </div>
        <div className="mb-2 text-[0.88rem] font-bold">Colour</div>
        <div className="flex gap-2.5" role="group" aria-label="Invitation colour">
          {SWATCHES.map(([label, c], i) => (
            <button
              key={label}
              type="button"
              aria-pressed={color === i}
              aria-label={label}
              onClick={() => setColor(i)}
              className={cn('border-ink size-[30px] cursor-pointer rounded-full border-2 p-0', color === i && 'outline-gold outline-[3px] outline-offset-[3px] outline-dashed')}
              style={{ background: c }}
            />
          ))}
        </div>
      </Paper>
      <div
        className="bg-card border-ink relative mx-auto grid aspect-[3/4] w-full max-w-[340px] place-content-center gap-3 overflow-hidden rounded-[var(--hand2)] border-2 px-7 py-[34px] text-center max-[900px]:max-w-[300px]"
        style={{ ['--inv' as string]: SWATCHES[color][1] }}
        aria-label="Invitation preview"
      >
        <Vine d={vine} seed={61} n={10} className="pointer-events-none absolute -top-5 -left-[30px] w-[210px] opacity-90" />
        <Vine d={vine} seed={62} n={10} className="pointer-events-none absolute -right-[30px] -bottom-5 w-[210px] rotate-180 opacity-90" />
        <small className={small}>Together with their families</small>
        <div className="font-display text-[2.3rem] leading-[1.05] font-bold break-words italic" style={{ color: 'var(--inv)' }}>
          {a}
        </div>
        <div className="sk-hand text-gold text-[1.8rem] font-bold">&amp;</div>
        <div className="font-display text-[2.3rem] leading-[1.05] font-bold break-words italic" style={{ color: 'var(--inv)' }}>
          {b}
        </div>
        <small className={small}>invite you to celebrate</small>
        <b className="font-display text-[1.1rem]">{d}</b>
        <span className="text-ink-soft">{v}</span>
      </div>
    </div>
  )
}

/** The working demo for one tool. Runs only in the browser; nothing is sent or saved. */
export function ToolDemo({ tool }: { tool: ToolKey }) {
  switch (tool) {
    case 'budget':
      return <BudgetDemo />
    case 'checklist':
      return <ChecklistDemo />
    case 'timeline':
      return <TimelineDemo />
    case 'guests':
      return <GuestDemo />
    case 'rsvp':
      return <RsvpDemo />
    case 'invite':
      return <InviteDemo />
  }
}
