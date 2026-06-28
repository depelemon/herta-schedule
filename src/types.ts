// 0 = Monday ... 6 = Sunday
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface Course {
  id: string
  name: string
  code?: string
  color: string // accent hex used across all pages
}

export interface ScheduleBlock {
  id: string
  courseId: string
  day: DayOfWeek
  start: string // "12:00"
  end: string // "13:00"
  location?: string
}

export interface Todo {
  id: string
  courseId: string
  title: string
  date: string // ISO "2026-06-28"
  done: boolean
  notes?: string
}

export interface AppData {
  version: number
  courses: Course[]
  blocks: ScheduleBlock[]
  todos: Todo[]
}

export const CURRENT_VERSION = 1

export const emptyData = (): AppData => ({
  version: CURRENT_VERSION,
  courses: [],
  blocks: [],
  todos: [],
})

// Palette offered when creating a course
export const COURSE_COLORS = [
  '#a982db',
  '#c3a6e8',
  '#8db6f0',
  '#7fd1c4',
  '#e0a3d6',
  '#f0b67f',
  '#e88f8f',
  '#9fd485',
]
