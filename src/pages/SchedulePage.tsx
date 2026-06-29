import { useCallback, useMemo, useRef, useState } from 'react'
import { Pencil, Lock, Plus, MapPin, Trash2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { type DayOfWeek, type ScheduleBlock, OTHER_COURSE_ID } from '../types'
import { DAY_LABELS, toMinutes, fromMinutes } from '../lib/time'
import Modal from '../components/Modal'
import CourseSelect from '../components/CourseSelect'

// ── Grid constants ─────────────────────────────────────────────────────────────
const START_HOUR = 8
const END_HOUR = 23
const PX_PER_HOUR = 64
const SNAP_MIN = 15

const GRID_H = (END_HOUR - START_HOUR) * PX_PER_HOUR

function snap(min: number) {
  return Math.round(min / SNAP_MIN) * SNAP_MIN
}
function clamp(min: number) {
  return Math.max(START_HOUR * 60, Math.min(END_HOUR * 60, min))
}
function toTop(min: number) {
  return ((min - START_HOUR * 60) / 60) * PX_PER_HOUR
}
function toHeight(startMin: number, endMin: number) {
  return Math.max(((endMin - startMin) / 60) * PX_PER_HOUR, 20)
}

// ── Types ──────────────────────────────────────────────────────────────────────
type DrawDrag = { type: 'draw'; day: DayOfWeek; anchorMin: number; mouseMin: number }
type MoveDrag = {
  type: 'move'
  blockId: string
  day: DayOfWeek
  mouseMin: number
  durationMin: number
  offsetMin: number
}
type ResizeDrag = { type: 'resize'; blockId: string; day: DayOfWeek; startMin: number; endMin: number }
type DragState = DrawDrag | MoveDrag | ResizeDrag

type ModalState =
  | null
  | { mode: 'draw'; day: DayOfWeek; start: string; end: string }
  | { mode: 'add' }
  | { mode: 'edit'; block: ScheduleBlock }

// ── Overlay block (absolute positioned over the full days area) ────────────────
interface OverlayBlock {
  day: DayOfWeek
  startMin: number
  endMin: number
  courseId: string
  isPreview: boolean
}

// ── Helper: get the course color ───────────────────────────────────────────────
const OTHER_COLOR = '#6b7280'

// ── Main component ─────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const { courses, blocks, addBlock, addBlockOnDays, updateBlock, deleteBlock } = useStore()
  const [editMode, setEditMode] = useState(false)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const daysRef = useRef<HTMLDivElement>(null)

  const hours = useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i),
    [],
  )

  const courseById = useMemo(
    () => Object.fromEntries(courses.map((c) => [c.id, c])),
    [courses],
  )

  // ── coordinate helpers ───────────────────────────────────────────────────────
  const getTimeAndDay = useCallback(
    (clientX: number, clientY: number): { day: DayOfWeek; min: number } => {
      const rect = daysRef.current!.getBoundingClientRect()
      const relX = Math.max(0, clientX - rect.left)
      const relY = clientY - rect.top
      const dayW = rect.width / 7
      const day = Math.max(0, Math.min(6, Math.floor(relX / dayW))) as DayOfWeek
      const min = clamp(snap((relY / PX_PER_HOUR) * 60 + START_HOUR * 60))
      return { day, min }
    },
    [],
  )

  // ── compute what to show in the overlay during drag ──────────────────────────
  const overlay = useMemo((): OverlayBlock | null => {
    if (!drag) return null
    if (drag.type === 'draw') {
      const startMin = clamp(Math.min(drag.anchorMin, drag.mouseMin))
      const endMin = clamp(Math.max(drag.anchorMin + SNAP_MIN, drag.mouseMin))
      return { day: drag.day, startMin, endMin, courseId: '', isPreview: true }
    }
    if (drag.type === 'move') {
      const startMin = clamp(snap(drag.mouseMin - drag.offsetMin))
      const endMin = Math.min(END_HOUR * 60, startMin + drag.durationMin)
      return { day: drag.day, startMin, endMin, courseId: drag.blockId, isPreview: false }
    }
    return null
  }, [drag])

  // which block ID is being dragged (to hide from column)
  const hiddenBlockId =
    drag?.type === 'move' ? drag.blockId : null

  // ── draw ─────────────────────────────────────────────────────────────────────
  const handleDaysMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!editMode) return
      const target = e.target as HTMLElement
      if (target.closest('[data-block]')) return

      e.preventDefault()
      const { day, min } = getTimeAndDay(e.clientX, e.clientY)
      setDrag({ type: 'draw', day, anchorMin: min, mouseMin: min })
      document.body.classList.add('dragging')

      const onMove = (me: MouseEvent) => {
        const { min: cur } = getTimeAndDay(me.clientX, me.clientY)
        setDrag((prev) => (prev?.type === 'draw' ? { ...prev, mouseMin: cur } : prev))
      }
      const onUp = (me: MouseEvent) => {
        document.body.classList.remove('dragging')
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        const { min: cur } = getTimeAndDay(me.clientX, me.clientY)
        setDrag((prev) => {
          if (prev?.type !== 'draw') return null
          const startMin = clamp(Math.min(prev.anchorMin, cur))
          const endMin = clamp(Math.max(prev.anchorMin + SNAP_MIN, cur))
          if (endMin - startMin >= SNAP_MIN) {
            setModal({ mode: 'draw', day: prev.day, start: fromMinutes(startMin), end: fromMinutes(endMin) })
          }
          return null
        })
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [editMode, getTimeAndDay],
  )

  // ── move ─────────────────────────────────────────────────────────────────────
  const handleMoveStart = useCallback(
    (e: React.MouseEvent, block: ScheduleBlock) => {
      if (!editMode) return
      e.stopPropagation()
      e.preventDefault()
      const { day, min } = getTimeAndDay(e.clientX, e.clientY)
      const blockStartMin = toMinutes(block.start)
      const durationMin = toMinutes(block.end) - blockStartMin
      const offsetMin = min - blockStartMin
      let moved = false
      const startX = e.clientX
      const startY = e.clientY

      setDrag({ type: 'move', blockId: block.id, day, mouseMin: min, durationMin, offsetMin })
      document.body.classList.add('dragging')

      const onMove = (me: MouseEvent) => {
        if (!moved && (Math.abs(me.clientX - startX) > 4 || Math.abs(me.clientY - startY) > 4)) {
          moved = true
        }
        const { day: curDay, min: curMin } = getTimeAndDay(me.clientX, me.clientY)
        setDrag((prev) =>
          prev?.type === 'move' ? { ...prev, day: curDay, mouseMin: curMin } : prev,
        )
      }
      const onUp = () => {
        document.body.classList.remove('dragging')
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        setDrag((prev) => {
          if (prev?.type === 'move') {
            if (moved) {
              const startMin = clamp(snap(prev.mouseMin - prev.offsetMin))
              const endMin = Math.min(END_HOUR * 60, startMin + prev.durationMin)
              updateBlock(prev.blockId, {
                day: prev.day,
                start: fromMinutes(startMin),
                end: fromMinutes(endMin),
              })
            } else {
              setModal({ mode: 'edit', block })
            }
          }
          return null
        })
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [editMode, getTimeAndDay, updateBlock],
  )

  // ── resize ───────────────────────────────────────────────────────────────────
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, block: ScheduleBlock) => {
      if (!editMode) return
      e.stopPropagation()
      e.preventDefault()
      const startMin = toMinutes(block.start)
      setDrag({ type: 'resize', blockId: block.id, day: block.day, startMin, endMin: toMinutes(block.end) })
      document.body.classList.add('dragging')

      const onMove = (me: MouseEvent) => {
        const { min: cur } = getTimeAndDay(me.clientX, me.clientY)
        const newEnd = clamp(Math.max(startMin + SNAP_MIN, cur))
        setDrag((prev) => (prev?.type === 'resize' ? { ...prev, endMin: newEnd } : prev))
      }
      const onUp = () => {
        document.body.classList.remove('dragging')
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        setDrag((prev) => {
          if (prev?.type === 'resize') {
            updateBlock(prev.blockId, { end: fromMinutes(prev.endMin) })
          }
          return null
        })
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [editMode, getTimeAndDay, updateBlock],
  )

  // ── save from modal ───────────────────────────────────────────────────────────
  const handleSave = useCallback(
    (courseId: string, location: string, extra?: { days?: DayOfWeek[]; start?: string; end?: string }) => {
      if (!modal) return
      if (modal.mode === 'draw') {
        addBlock({ courseId, day: modal.day, start: modal.start, end: modal.end, location: location || undefined })
      } else if (modal.mode === 'add' && extra?.days && extra.start && extra.end) {
        if (extra.days.length === 1) {
          addBlock({ courseId, day: extra.days[0], start: extra.start, end: extra.end, location: location || undefined })
        } else {
          addBlockOnDays({ courseId, start: extra.start, end: extra.end, location: location || undefined }, extra.days)
        }
      } else if (modal.mode === 'edit') {
        updateBlock(modal.block.id, { courseId, location: location || undefined })
      }
      setModal(null)
    },
    [modal, addBlock, addBlockOnDays, updateBlock],
  )

  // ── overlay block color ───────────────────────────────────────────────────────
  const overlayColor = useMemo(() => {
    if (!overlay) return '#a982db'
    if (overlay.isPreview) return '#a982db' // draw preview = lilac
    const block = blocks.find((b) => b.id === overlay.courseId)
    if (!block) return '#a982db'
    if (block.courseId === OTHER_COURSE_ID) return OTHER_COLOR
    return courseById[block.courseId]?.color ?? '#a982db'
  }, [overlay, blocks, courseById])

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schedule</h1>
          <p className="text-sm text-lavender-300/60">Your weekly recurring timetable.</p>
        </div>
        <div className="flex items-center gap-2">
          {editMode && (
            <button className="btn-primary" onClick={() => setModal({ mode: 'add' })}>
              <Plus size={16} /> Add block
            </button>
          )}
          <button
            className="btn-primary"
            onClick={() => setEditMode((e) => !e)}
            title={editMode ? 'Done editing' : 'Enter edit mode'}
          >
            {editMode ? <Lock size={16} /> : <Pencil size={16} />}
            {editMode ? 'Finish' : 'Edit'}
          </button>
        </div>
      </header>

      {editMode && (
        <p className="mb-4 text-xs text-lavender-300/50">
          ✦ Draw a block by clicking &amp; dragging on a day column · Drag a block to move it · Drag its bottom edge to resize · Click a block to edit
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur-sm">
        <div className="min-w-[700px]">
          {/* Day headers */}
          <div className="mb-2 grid grid-cols-[56px_repeat(7,1fr)]">
            <div />
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="pb-1 text-center text-xs font-semibold uppercase tracking-wider text-lavender-300/60"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="flex">
            {/* Time gutter */}
            <div className="relative w-14 shrink-0" style={{ height: GRID_H }}>
              {hours.map((h, i) => (
                <div
                  key={h}
                  className="absolute right-2 -translate-y-1/2 text-[10px] text-lavender-300/55"
                  style={{ top: i * PX_PER_HOUR }}
                >
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Days area — drag source */}
            <div
              ref={daysRef}
              className="relative flex-1 grid grid-cols-7 select-none"
              style={{ height: GRID_H }}
              onMouseDown={handleDaysMouseDown}
            >
              {/* Hour grid lines (full width) */}
              {hours.map((h, i) => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-t"
                  style={{ top: i * PX_PER_HOUR, borderColor: 'rgba(255,255,255,0.13)' }}
                />
              ))}

              {/* Day columns */}
              {DAY_LABELS.map((_, dayIdx) => {
                const dayBlocks = blocks.filter(
                  (b) => b.day === dayIdx && b.id !== hiddenBlockId,
                )
                const resizeEndMin =
                  drag?.type === 'resize' && drag.day === dayIdx ? drag.endMin : null

                return (
                  <div
                    key={dayIdx}
                    className="relative"
                    style={{ borderLeft: '1px solid rgba(255,255,255,0.12)', background: dayIdx % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)' }}
                  >
                    {dayBlocks.map((b) => {
                      const isResizing = drag?.type === 'resize' && drag.blockId === b.id
                      const startMin = toMinutes(b.start)
                      const endMin = isResizing && resizeEndMin !== null ? resizeEndMin : toMinutes(b.end)
                      const color =
                        b.courseId === OTHER_COURSE_ID
                          ? OTHER_COLOR
                          : courseById[b.courseId]?.color ?? '#a982db'
                      const course = courseById[b.courseId]

                      return (
                        <div
                          key={b.id}
                          data-block
                          className={`absolute inset-x-0.5 overflow-hidden rounded-lg border ${editMode ? 'cursor-grab' : 'cursor-default'}`}
                          style={{
                            top: toTop(startMin),
                            height: toHeight(startMin, endMin),
                            backgroundColor: `${color}20`,
                            borderColor: `${color}55`,
                            borderLeft: `3px solid ${color}`,
                          }}
                          onMouseDown={(e) => handleMoveStart(e, b)}
                        >
                          <div className="px-1.5 pt-1">
                            <div className="truncate text-[11px] font-semibold leading-tight text-lavender-100">
                              {b.courseId === OTHER_COURSE_ID
                                ? 'Other'
                                : course?.code || course?.name || '?'}
                            </div>
                            <div className="truncate text-[10px] text-lavender-300/55">
                              {b.start}–{b.end}
                            </div>
                            {b.location && (
                              <div className="mt-0.5 flex items-center gap-0.5 truncate text-[9px] text-lavender-300/40">
                                <MapPin size={8} /> {b.location}
                              </div>
                            )}
                          </div>
                          {/* Resize handle */}
                          {editMode && (
                            <div
                              data-block
                              className="absolute inset-x-0 bottom-0 h-2.5 cursor-s-resize"
                              style={{ background: `linear-gradient(to top, ${color}44, transparent)` }}
                              onMouseDown={(e) => handleResizeStart(e, b)}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              {/* Drag overlay (draw preview + move ghost) */}
              {overlay && (
                <div
                  className="pointer-events-none absolute rounded-lg border-2"
                  style={{
                    left: `${(overlay.day / 7) * 100}%`,
                    width: `${(1 / 7) * 100}%`,
                    top: toTop(overlay.startMin),
                    height: toHeight(overlay.startMin, overlay.endMin),
                    backgroundColor: overlay.isPreview ? 'rgba(169,130,219,0.25)' : `${overlayColor}30`,
                    borderColor: overlay.isPreview ? '#a982db' : overlayColor,
                    borderStyle: overlay.isPreview ? 'dashed' : 'solid',
                    padding: '0 2px',
                  }}
                >
                  {!overlay.isPreview && (() => {
                    const block = blocks.find((b) => b.id === overlay.courseId)
                    const course = block ? courseById[block.courseId] : null
                    return (
                      <div className="truncate text-[11px] font-semibold pt-1 px-1 text-lavender-100">
                        {block?.courseId === OTHER_COURSE_ID ? 'Other' : course?.code || course?.name || '?'}
                      </div>
                    )
                  })()}
                  {overlay.isPreview && (
                    <div className="text-[10px] text-lilac-300 pt-1 px-1">
                      {fromMinutes(overlay.startMin)}–{fromMinutes(overlay.endMin)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal && (
        <BlockModal
          key={modal.mode + (modal.mode === 'edit' ? modal.block.id : '')}
          modal={modal}
          courses={courses}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={
            modal.mode === 'edit'
              ? () => {
                  deleteBlock(modal.block.id)
                  setModal(null)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}

// ── Block modal (draw / add / edit) ───────────────────────────────────────────
import type { Course } from '../types'

function BlockModal({
  modal,
  courses,
  onClose,
  onSave,
  onDelete,
}: {
  modal: NonNullable<ModalState>
  courses: Course[]
  onClose: () => void
  onSave: (courseId: string, location: string, extra?: { days?: DayOfWeek[]; start?: string; end?: string }) => void
  onDelete?: () => void
}) {
  const firstCourseId = courses[0]?.id ?? OTHER_COURSE_ID
  const initCourseId =
    modal.mode === 'edit'
      ? modal.block.courseId
      : firstCourseId

  const [courseId, setCourseId] = useState(initCourseId)
  const [location, setLocation] = useState(modal.mode === 'edit' ? (modal.block.location ?? '') : '')

  // "add" mode only
  const [days, setDays] = useState<DayOfWeek[]>([])
  const [start, setStart] = useState('12:00')
  const [end, setEnd] = useState('13:00')

  const toggleDay = (d: DayOfWeek) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))

  const isAdd = modal.mode === 'add'
  const addValid = !isAdd || (days.length > 0 && toMinutes(end) > toMinutes(start))

  const title =
    modal.mode === 'draw'
      ? 'New block'
      : modal.mode === 'add'
        ? 'Add block'
        : 'Edit block'

  const save = () => {
    if (isAdd) {
      onSave(courseId, location, { days, start, end })
    } else {
      onSave(courseId, location)
    }
  }

  return (
    <Modal
      open
      title={title}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <button className="btn-ghost mr-auto text-rose-300" onClick={onDelete}>
              <Trash2 size={15} /> Delete
            </button>
          )}
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!addValid} onClick={save}>
            Save
          </button>
        </>
      }
    >
      {/* Show time info for draw / edit modes */}
      {modal.mode === 'draw' && (
        <div className="rounded-xl border border-teal-400/20 bg-teal-500/5 px-3 py-2 text-sm text-teal-300">
          {DAY_LABELS[modal.day]} · {modal.start} – {modal.end}
        </div>
      )}
      {modal.mode === 'edit' && (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-lavender-300/70">
          {DAY_LABELS[modal.block.day]} · {modal.block.start} – {modal.block.end}
          <span className="ml-2 text-[11px] text-lavender-300/40">(drag to move / resize)</span>
        </div>
      )}

      {/* Course picker */}
      <div>
        <label className="label">Course</label>
        <CourseSelect courses={courses} value={courseId} onChange={setCourseId} />
      </div>

      {/* Day + time pickers (add mode only) */}
      {isAdd && (
        <>
          <div>
            <label className="label">Day(s)</label>
            <div className="flex gap-1.5">
              {DAY_LABELS.map((d, i) => {
                const active = days.includes(i as DayOfWeek)
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(i as DayOfWeek)}
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start</label>
              <input type="time" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label className="label">End</label>
              <input type="time" className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          {toMinutes(end) <= toMinutes(start) && (
            <p className="-mt-1 text-[11px] text-rose-300/80">End must be after start.</p>
          )}
        </>
      )}

      {/* Location */}
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
