import { useEffect, useRef, useState } from 'react'
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
} from 'date-fns'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

interface Props {
  value: string // ISO "yyyy-MM-dd"
  onChange: (v: string) => void
}

export default function DatePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<Date>(() => parseISO(value))
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setView(parseISO(value))
  }, [value])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selectedDate = parseISO(value)
  const days = eachDayOfInterval({ start: startOfMonth(view), end: endOfMonth(view) })
  const firstDow = (getDay(startOfMonth(view)) + 6) % 7

  const select = (d: Date) => {
    onChange(format(d, 'yyyy-MM-dd'))
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center gap-2 text-left"
      >
        <CalendarDays size={14} className="shrink-0 text-lilac-400" />
        <span>{format(selectedDate, 'EEE, MMM d, yyyy')}</span>
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 w-72 rounded-2xl border border-white/10 bg-plum-900 p-4 shadow-glow"
          style={{ boxShadow: '0 8px 32px -4px rgba(20, 15, 31, 0.9), 0 0 24px -6px rgba(169, 130, 219, 0.35)' }}
        >
          {/* Month nav */}
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setView(subMonths(view, 1))}
              className="rounded-lg p-1 text-lavender-300/70 hover:bg-white/5 hover:text-lavender-100"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-lavender-100">
              {format(view, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setView(addMonths(view, 1))}
              className="rounded-lg p-1 text-lavender-300/70 hover:bg-white/5 hover:text-lavender-100"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="mb-1 grid grid-cols-7 text-center">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="py-1 text-[11px] font-medium text-lavender-300/40">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {Array.from({ length: firstDow }, (_, i) => (
              <div key={`e${i}`} />
            ))}
            {days.map((d) => {
              const iso = format(d, 'yyyy-MM-dd')
              const selected = isSameDay(d, selectedDate)
              const today = isToday(d)
              return (
                <button
                  key={iso}
                  onClick={() => select(d)}
                  className={[
                    'flex h-8 w-full items-center justify-center rounded-lg text-sm transition-colors',
                    selected
                      ? 'bg-lilac-500 text-plum-950 font-semibold shadow-glow'
                      : today
                        ? 'border border-lilac-500/50 text-lilac-300 hover:bg-white/5'
                        : 'text-lavender-200 hover:bg-white/8',
                  ].join(' ')}
                >
                  {format(d, 'd')}
                </button>
              )
            })}
          </div>

          <div className="mt-3 border-t border-white/8 pt-2.5">
            <button
              onClick={() => select(new Date())}
              className="text-xs text-lilac-400 hover:text-lilac-300"
            >
              Jump to today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
