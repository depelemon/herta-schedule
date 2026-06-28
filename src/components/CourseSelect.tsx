import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { Course } from '../types'
import { OTHER_COURSE_ID } from '../types'

const OTHER_COLOR = '#6b7280'

interface Props {
  courses: Course[]
  value: string
  onChange: (v: string) => void
}

function getLabel(courses: Course[], value: string): { name: string; color: string } {
  if (value === OTHER_COURSE_ID) return { name: 'Other', color: OTHER_COLOR }
  const c = courses.find((c) => c.id === value)
  return c
    ? { name: c.code ? `${c.code} · ${c.name}` : c.name, color: c.color }
    : { name: 'Select a course', color: '#a982db' }
}

export default function CourseSelect({ courses, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { name, color } = getLabel(courses, value)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const select = (id: string) => {
    onChange(id)
    setOpen(false)
  }

  const options: Array<{ id: string; name: string; color: string; sub?: string }> = [
    ...courses.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      sub: c.code,
    })),
    { id: OTHER_COURSE_ID, name: 'Other', color: OTHER_COLOR },
  ]

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex w-full items-center gap-2.5 text-left"
      >
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
        />
        <span className="flex-1 truncate">{name}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-lavender-300/50 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-2xl border border-white/10 bg-plum-900 py-1 shadow-glow"
          style={{ boxShadow: '0 8px 32px -4px rgba(20, 15, 31, 0.9), 0 0 24px -6px rgba(169, 130, 219, 0.3)' }}
        >
          {options.map((opt) => {
            const isSelected = opt.id === value
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => select(opt.id)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                  isSelected
                    ? 'bg-lilac-500/15 text-lavender-100'
                    : 'text-lavender-200 hover:bg-white/5'
                }`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{
                    backgroundColor: opt.color,
                    boxShadow: `0 0 6px ${opt.color}`,
                  }}
                />
                <span className="flex-1 text-left">
                  {opt.sub && (
                    <span className="mr-1 text-lavender-300/50">{opt.sub} ·</span>
                  )}
                  {opt.name}
                </span>
                {isSelected && (
                  <Check size={14} className="shrink-0 text-lilac-400" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
