import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Plus, MapPin, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import { DAY_LABELS_LONG, todayDow, toMinutes, isoToday } from '../lib/time'
import { TodoRow } from './CoursePage'
import type { Course, DayOfWeek, ScheduleBlock, Todo } from '../types'
import { useSettings, DEFAULT_BANNER } from '../store/useSettings'

const GREETINGS = [
  'Madam Herta is a peerless gem. Madam Herta is an unrivaled genius. Madam Herta is an inimitable beauty.',
]

export default function TodayPage() {
  const { courses, blocks, todos, addTodo, toggleTodo, deleteTodo } = useStore()
  const bannerSrc = useSettings((s) => s.bannerSrc)
  const [offset, setOffset] = useState(0)

  const realDow = todayDow()
  const viewDay = (((realDow + offset) % 7 + 7) % 7) as DayOfWeek
  const isPreview = offset !== 0

  const viewDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return d
  }, [offset])

  const viewIso = useMemo(() => isoToday(viewDate), [viewDate])
  const greeting = useMemo(() => GREETINGS[new Date().getDate() % GREETINGS.length], [])

  const courseById = useMemo(
    () => Object.fromEntries(courses.map((c) => [c.id, c])),
    [courses],
  )

  const viewBlocks = useMemo(
    () =>
      blocks
        .filter((b) => b.day === viewDay)
        .sort((a, b) => toMinutes(a.start) - toMinutes(b.start)),
    [blocks, viewDay],
  )

  const viewTodos = useMemo(
    () => todos.filter((t) => t.date === viewIso),
    [todos, viewIso],
  )

  const viewCourseIds = useMemo(() => {
    const seen = new Set<string>()
    const ordered: string[] = []
    for (const b of viewBlocks) {
      if (!seen.has(b.courseId)) { seen.add(b.courseId); ordered.push(b.courseId) }
    }
    for (const t of viewTodos) {
      if (!seen.has(t.courseId)) { seen.add(t.courseId); ordered.push(t.courseId) }
    }
    return ordered
  }, [viewBlocks, viewTodos])

  const openCount = viewTodos.filter((t) => !t.done).length

  return (
    <div className="mx-auto max-w-3xl">
      {/* Banner */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-white/10" style={{ height: 200 }}>
        <img
          src={bannerSrc ?? DEFAULT_BANNER}
          alt="banner"
          className="h-full w-full object-cover transition-[filter] duration-500"
          style={{ filter: isPreview ? 'grayscale(1) brightness(0.65)' : 'none' }}
          draggable={false}
        />

        {/* Gradient + text */}
        <div
          className="absolute inset-0 flex flex-col justify-end p-6"
          style={{
            background:
              'linear-gradient(to top, rgba(20,15,31,0.97) 0%, rgba(20,15,31,0.75) 40%, rgba(20,15,31,0.2) 100%)',
          }}
        >
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-lilac-400 drop-shadow">
            <Sparkles size={12} /> {greeting}
          </p>
          <h1
            className="mt-1 text-4xl font-bold text-lavender-100 flex items-baseline gap-2"
            style={{ textShadow: '0 2px 12px rgba(20,15,31,0.9)' }}
          >
            {DAY_LABELS_LONG[viewDay]}
            {isPreview && (
              <span className="text-xl font-normal text-lavender-300/60">(Preview)</span>
            )}
          </h1>
          <p
            className="mt-0.5 text-sm font-medium text-lavender-200/90"
            style={{ textShadow: '0 1px 6px rgba(20,15,31,0.8)' }}
          >
            {format(viewDate, 'MMMM d, yyyy')} ·{' '}
            {viewBlocks.length} {viewBlocks.length === 1 ? 'class' : 'classes'} · {openCount}{' '}
            to-do{openCount === 1 ? '' : 's'} left
          </p>
        </div>

        {/* Prev day */}
        <button
          onClick={() => setOffset((o) => o - 1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          aria-label="Previous day"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Next day */}
        <button
          onClick={() => setOffset((o) => o + 1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          aria-label="Next day"
        >
          <ChevronRight size={18} />
        </button>

        {/* Back to today pill */}
        {isPreview && (
          <button
            onClick={() => setOffset(0)}
            className="absolute bottom-3 right-16 rounded-full bg-lilac-500/80 px-3 py-1 text-xs font-semibold text-plum-950 backdrop-blur-sm transition-colors hover:bg-lilac-400"
          >
            Today
          </button>
        )}
      </div>

      {/* Content */}
      {viewCourseIds.length === 0 ? (
        <div className="glass flex flex-col items-center gap-2 py-20 text-center text-lavender-300/50">
          <Sparkles size={32} className="text-lilac-400/50" />
          <p>
            {isPreview
              ? 'Nothing scheduled for this day.'
              : 'Nothing scheduled today. A perfect day to get ahead.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {viewCourseIds.map((cid) => {
            const course = courseById[cid]
            if (!course) return null
            const courseBlocks = viewBlocks.filter((b) => b.courseId === cid)
            const courseTodos = viewTodos
              .filter((t) => t.courseId === cid)
              .sort((a, b) => Number(a.done) - Number(b.done))
            return (
              <CourseCard
                key={cid}
                course={course}
                blocks={courseBlocks}
                todos={courseTodos}
                onAdd={(title) => addTodo({ courseId: cid, title, date: viewIso })}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function CourseCard({
  course,
  blocks,
  todos,
  onAdd,
  onToggle,
  onDelete,
}: {
  course: Course
  blocks: ScheduleBlock[]
  todos: Todo[]
  onAdd: (title: string) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')

  const submit = () => {
    if (title.trim()) onAdd(title.trim())
    setTitle('')
    setAdding(false)
  }

  return (
    <div className="glass overflow-hidden" style={{ borderLeft: `3px solid ${course.color}` }}>
      <div className="flex items-center gap-3 px-5 pt-4">
        <span
          className="h-3.5 w-3.5 rounded-full"
          style={{ backgroundColor: course.color, boxShadow: `0 0 10px ${course.color}` }}
        />
        <h2 className="text-base font-semibold">{course.name}</h2>
        <div className="ml-auto flex items-center gap-3 text-xs text-lavender-300/60">
          {blocks.map((b) => (
            <span key={b.id} className="flex items-center gap-1.5">
              {b.start}–{b.end}
              {b.location && (
                <span className="flex items-center gap-0.5 text-lavender-300/40">
                  <MapPin size={10} /> {b.location}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="px-3 pb-3 pt-2">
        {todos.length === 0 && !adding && (
          <p className="px-2 py-1.5 text-sm text-lavender-300/40">No to-dos for this day.</p>
        )}
        {todos.map((t) => (
          <TodoRow key={t.id} todo={t} onToggle={onToggle} onDelete={onDelete} />
        ))}

        {adding ? (
          <div className="flex gap-2 px-2 py-1.5">
            <input
              className="input flex-1"
              autoFocus
              placeholder="What needs doing?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
                if (e.key === 'Escape') { setAdding(false); setTitle('') }
              }}
              onBlur={submit}
            />
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-lavender-300/50 hover:text-lavender-100"
          >
            <Plus size={13} /> Add to-do
          </button>
        )}
      </div>
    </div>
  )
}
