import { useMemo, useState } from 'react'
import { Plus, Trash2, BookOpen, Pencil, Check } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useStore } from '../store/useStore'
import { COURSE_COLORS, type Course, type Todo } from '../types'
import { isoToday } from '../lib/time'
import Modal from '../components/Modal'
import DatePicker from '../components/DatePicker'

export default function CoursePage() {
  const { courses, todos, addCourse, updateCourse, deleteCourse, addTodo, toggleTodo, deleteTodo } =
    useStore()

  const [selectedId, setSelectedId] = useState<string | null>(courses[0]?.id ?? null)
  const [courseModalOpen, setCourseModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  const selected = courses.find((c) => c.id === selectedId) ?? courses[0] ?? null

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="text-sm text-lavender-300/60">Plan what each course needs.</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingCourse(null)
            setCourseModalOpen(true)
          }}
        >
          <Plus size={16} /> New course
        </button>
      </header>

      {courses.length === 0 ? (
        <EmptyState onAdd={() => setCourseModalOpen(true)} />
      ) : (
        <div className="grid grid-cols-[260px_1fr] gap-6">
          {/* Course list */}
          <div className="space-y-2">
            {courses.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  selected?.id === c.id
                    ? 'border-lilac-500/40 bg-lilac-500/10'
                    : 'border-white/10 hover:bg-white/5'
                }`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color, boxShadow: `0 0 8px ${c.color}` }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.name}</span>
                  {c.code && (
                    <span className="block truncate text-xs text-lavender-300/50">{c.code}</span>
                  )}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingCourse(c)
                    setCourseModalOpen(true)
                  }}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Pencil size={14} className="text-lavender-300/60 hover:text-lavender-100" />
                </span>
              </button>
            ))}
          </div>

          {/* Selected course todos */}
          {selected && (
            <CourseTodos
              course={selected}
              todos={todos.filter((t) => t.courseId === selected.id)}
              onAdd={(title, date, notes) =>
                addTodo({ courseId: selected.id, title, date, notes })
              }
              onToggle={toggleTodo}
              onDelete={deleteTodo}
            />
          )}
        </div>
      )}

      <CourseModal
        open={courseModalOpen}
        course={editingCourse}
        onClose={() => setCourseModalOpen(false)}
        onSave={(name, code, color) => {
          if (editingCourse) {
            updateCourse(editingCourse.id, { name, code: code || undefined, color })
          } else {
            const c = addCourse(name, code, color)
            setSelectedId(c.id)
          }
          setCourseModalOpen(false)
        }}
        onDelete={
          editingCourse
            ? () => {
                deleteCourse(editingCourse.id)
                if (selectedId === editingCourse.id) setSelectedId(null)
                setCourseModalOpen(false)
              }
            : undefined
        }
      />
    </div>
  )
}

function CourseTodos({
  course,
  todos,
  onAdd,
  onToggle,
  onDelete,
}: {
  course: Course
  todos: Todo[]
  onAdd: (title: string, date: string, notes?: string) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(isoToday())

  // group by date, sorted ascending, undone first within group
  const groups = useMemo(() => {
    const map = new Map<string, Todo[]>()
    for (const t of todos) {
      const arr = map.get(t.date) ?? []
      arr.push(t)
      map.set(t.date, arr)
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, arr]) => [d, arr.sort((x, y) => Number(x.done) - Number(y.done))] as const)
  }, [todos])

  const submit = () => {
    if (!title.trim()) return
    onAdd(title.trim(), date)
    setTitle('')
  }

  return (
    <div className="glass p-5">
      <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
        <span
          className="h-4 w-4 rounded-full"
          style={{ backgroundColor: course.color, boxShadow: `0 0 10px ${course.color}` }}
        />
        <h2 className="text-lg font-semibold">{course.name}</h2>
        <span className="ml-auto text-xs text-lavender-300/50">
          {todos.filter((t) => !t.done).length} open · {todos.length} total
        </span>
      </div>

      {/* Add todo row */}
      <div className="mb-5 flex gap-2">
        <input
          className="input flex-1"
          placeholder="Add a to-do…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <div className="w-52 shrink-0">
          <DatePicker value={date} onChange={setDate} />
        </div>
        <button className="btn-primary" onClick={submit}>
          <Plus size={16} />
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="py-8 text-center text-sm text-lavender-300/40">
          No to-dos yet. Add the first thing you need to do.
        </p>
      ) : (
        <div className="space-y-5">
          {groups.map(([d, arr]) => (
            <div key={d}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-lavender-300/50">
                {format(parseISO(d), 'EEEE, MMM d')}
              </h3>
              <div className="space-y-1.5">
                {arr.map((t) => (
                  <TodoRow key={t.id} todo={t} onToggle={onToggle} onDelete={onDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function TodoRow({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5">
      <button
        onClick={() => onToggle(todo.id)}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
          todo.done
            ? 'border-lilac-500 bg-lilac-500 text-plum-950'
            : 'border-white/20 hover:border-lilac-400'
        }`}
      >
        {todo.done && <Check size={13} strokeWidth={3} />}
      </button>
      <span
        className={`flex-1 text-sm ${
          todo.done ? 'text-lavender-300/40 line-through' : 'text-lavender-100'
        }`}
      >
        {todo.title}
      </span>
      <button
        onClick={() => onDelete(todo.id)}
        className="opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Trash2 size={14} className="text-lavender-300/40 hover:text-rose-300" />
      </button>
    </div>
  )
}

function EmptyState(_: { onAdd: () => void }) {
  return (
    <div className="glass flex flex-col items-center justify-center gap-3 py-20 text-center">
      <BookOpen size={36} className="text-lilac-400/60" />
      <p className="text-lavender-300/60">No courses yet. Use the button above to add one.</p>
    </div>
  )
}

function CourseModal({
  open,
  course,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean
  course: Course | null
  onClose: () => void
  onSave: (name: string, code: string, color: string) => void
  onDelete?: () => void
}) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [color, setColor] = useState(COURSE_COLORS[0])

  // sync state when the modal opens for a (different) course
  const key = `${open}-${course?.id ?? 'new'}`
  useMemo(() => {
    if (open) {
      setName(course?.name ?? '')
      setCode(course?.code ?? '')
      setColor(course?.color ?? COURSE_COLORS[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return (
    <Modal
      open={open}
      title={course ? 'Edit course' : 'New course'}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <button className="btn-ghost mr-auto text-red-300" onClick={onDelete}>
              <Trash2 size={15} /> Delete
            </button>
          )}
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!name.trim()}
            onClick={() => onSave(name.trim(), code.trim(), color)}
          >
            Save
          </button>
        </>
      }
    >
      <div>
        <label className="label">Name</label>
        <input
          className="input"
          autoFocus
          placeholder="e.g. Struktur Data & Algoritma"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Code (optional)</label>
        <input
          className="input"
          placeholder="e.g. SDA"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Color</label>
        <div className="flex flex-wrap gap-2">
          {COURSE_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-7 w-7 rounded-full transition-transform ${
                color === c ? 'scale-110 ring-2 ring-white/70' : 'hover:scale-105'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </Modal>
  )
}
