import { useMemo, useState } from 'react'
import { Plus, Trash2, MapPin } from 'lucide-react'
import { useStore } from '../store/useStore'
import { type ScheduleBlock, type DayOfWeek } from '../types'
import { DAY_LABELS, toMinutes } from '../lib/time'
import Modal from '../components/Modal'

const START_HOUR = 6
const END_HOUR = 23
const PX_PER_HOUR = 56

export default function SchedulePage() {
  const { courses, blocks } = useStore()
  const [modal, setModal] = useState<{ open: boolean; block?: ScheduleBlock; day?: DayOfWeek }>({
    open: false,
  })

  const hours = useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i),
    [],
  )
  const gridHeight = (END_HOUR - START_HOUR) * PX_PER_HOUR

  const courseById = useMemo(
    () => Object.fromEntries(courses.map((c) => [c.id, c])),
    [courses],
  )

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schedule</h1>
          <p className="text-sm text-lavender-300/60">Your weekly recurring timetable.</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({ open: true })}>
          <Plus size={16} /> Add block
        </button>
      </header>

      <div className="glass overflow-x-auto p-4">
        <div className="grid min-w-[760px] grid-cols-[56px_repeat(7,1fr)]">
          {/* header row */}
          <div />
          {DAY_LABELS.map((d) => (
            <div key={d} className="pb-3 text-center text-sm font-semibold text-lavender-200">
              {d}
            </div>
          ))}

          {/* time gutter */}
          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((h, i) => (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] text-lavender-300/40"
                style={{ top: i * PX_PER_HOUR }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* day columns */}
          {DAY_LABELS.map((_, dayIdx) => (
            <DayColumn
              key={dayIdx}
              day={dayIdx as DayOfWeek}
              height={gridHeight}
              hours={hours}
              blocks={blocks.filter((b) => b.day === dayIdx)}
              courseById={courseById}
              onAddAt={(day) => setModal({ open: true, day })}
              onOpen={(block) => setModal({ open: true, block })}
            />
          ))}
        </div>
      </div>

      <BlockModal
        state={modal}
        onClose={() => setModal({ open: false })}
      />
    </div>
  )
}

function DayColumn({
  day,
  height,
  hours,
  blocks,
  courseById,
  onAddAt,
  onOpen,
}: {
  day: DayOfWeek
  height: number
  hours: number[]
  blocks: ScheduleBlock[]
  courseById: Record<string, { name: string; code?: string; color: string }>
  onAddAt: (day: DayOfWeek) => void
  onOpen: (block: ScheduleBlock) => void
}) {
  return (
    <div
      className="relative border-l border-white/5"
      style={{ height }}
      onDoubleClick={() => onAddAt(day)}
    >
      {/* hour gridlines */}
      {hours.map((h, i) => (
        <div
          key={h}
          className="absolute inset-x-0 border-t border-white/5"
          style={{ top: i * PX_PER_HOUR }}
        />
      ))}

      {blocks.map((b) => {
        const course = courseById[b.courseId]
        const top = ((toMinutes(b.start) - START_HOUR * 60) / 60) * PX_PER_HOUR
        const h = ((toMinutes(b.end) - toMinutes(b.start)) / 60) * PX_PER_HOUR
        const color = course?.color ?? '#a982db'
        return (
          <button
            key={b.id}
            onClick={() => onOpen(b)}
            className="absolute inset-x-1 overflow-hidden rounded-lg border px-2 py-1 text-left transition-transform hover:scale-[1.02]"
            style={{
              top,
              height: Math.max(h, 22),
              backgroundColor: `${color}22`,
              borderColor: `${color}66`,
              borderLeft: `3px solid ${color}`,
            }}
          >
            <div className="truncate text-xs font-semibold text-lavender-100">
              {course?.code || course?.name || 'Unknown'}
            </div>
            <div className="truncate text-[10px] text-lavender-300/60">
              {b.start}–{b.end}
            </div>
            {b.location && h > 44 && (
              <div className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-lavender-300/50">
                <MapPin size={9} /> {b.location}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

function BlockModal({
  state,
  onClose,
}: {
  state: { open: boolean; block?: ScheduleBlock; day?: DayOfWeek }
  onClose: () => void
}) {
  const { courses, addCourse, addBlock, addBlockOnDays, updateBlock, deleteBlock } = useStore()
  const editing = state.block

  const [courseId, setCourseId] = useState('')
  const [days, setDays] = useState<DayOfWeek[]>([])
  const [start, setStart] = useState('12:00')
  const [end, setEnd] = useState('13:00')
  const [location, setLocation] = useState('')
  const [newCourseName, setNewCourseName] = useState('')

  // initialize when modal opens
  const key = `${state.open}-${editing?.id ?? 'new'}-${state.day ?? ''}`
  useMemo(() => {
    if (!state.open) return
    if (editing) {
      setCourseId(editing.courseId)
      setDays([editing.day])
      setStart(editing.start)
      setEnd(editing.end)
      setLocation(editing.location ?? '')
    } else {
      setCourseId(courses[0]?.id ?? '')
      setDays(state.day !== undefined ? [state.day] : [])
      setStart('12:00')
      setEnd('13:00')
      setLocation('')
    }
    setNewCourseName('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const toggleDay = (d: DayOfWeek) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))

  const valid =
    (courseId || newCourseName.trim()) &&
    days.length > 0 &&
    toMinutes(end) > toMinutes(start)

  const save = () => {
    let cid = courseId
    if (!cid && newCourseName.trim()) {
      cid = addCourse(newCourseName.trim(), newCourseName.trim()).id
    }
    if (!cid) return

    if (editing) {
      updateBlock(editing.id, { courseId: cid, day: days[0], start, end, location: location || undefined })
    } else {
      const base = { courseId: cid, start, end, location: location || undefined }
      if (days.length === 1) addBlock({ ...base, day: days[0] })
      else addBlockOnDays(base, days)
    }
    onClose()
  }

  return (
    <Modal
      open={state.open}
      title={editing ? 'Edit block' : 'Add schedule block'}
      onClose={onClose}
      footer={
        <>
          {editing && (
            <button
              className="btn-ghost mr-auto text-red-300"
              onClick={() => {
                deleteBlock(editing.id)
                onClose()
              }}
            >
              <Trash2 size={15} /> Delete
            </button>
          )}
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={!valid} onClick={save}>
            Save
          </button>
        </>
      }
    >
      <div>
        <label className="label">Course</label>
        {courses.length > 0 ? (
          <select
            className="input"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">+ New course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code ? `${c.code} · ` : ''}
                {c.name}
              </option>
            ))}
          </select>
        ) : null}
        {(courses.length === 0 || courseId === '') && (
          <input
            className="input mt-2"
            placeholder="New course name (e.g. SDA)"
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
          />
        )}
      </div>

      <div>
        <label className="label">{editing ? 'Day' : 'Day(s)'}</label>
        <div className="flex gap-1.5">
          {DAY_LABELS.map((d, i) => {
            const active = days.includes(i as DayOfWeek)
            return (
              <button
                key={d}
                onClick={() => (editing ? setDays([i as DayOfWeek]) : toggleDay(i as DayOfWeek))}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-lilac-500 text-plum-950'
                    : 'border border-white/10 text-lavender-300/70 hover:bg-white/5'
                }`}
              >
                {d}
              </button>
            )
          })}
        </div>
        {!editing && (
          <p className="mt-1.5 text-[11px] text-lavender-300/40">
            Pick multiple days to repeat this block across the week.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Start</label>
          <input
            type="time"
            className="input"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div>
          <label className="label">End</label>
          <input
            type="time"
            className="input"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>
      {toMinutes(end) <= toMinutes(start) && (
        <p className="-mt-1 text-[11px] text-red-300/80">End time must be after start.</p>
      )}

      <div>
        <label className="label">Location (optional)</label>
        <input
          className="input"
          placeholder="e.g. Room 2.3"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
    </Modal>
  )
}
