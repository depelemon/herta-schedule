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

export const OTHER_COURSE_ID = '__other__'

// Palette offered when creating a course (purple, blue, teal, pink, gold, rose, green, indigo, lavender, coral)
export const COURSE_COLORS = [
  '#a982db', // lilac
  '#c3a6e8', // pale lilac
  '#9080e0', // indigo
  '#8db6f0', // sky blue
  '#4dd4be', // teal
  '#7fd4a8', // mint
  '#f0c868', // gold
  '#f5a870', // peach
  '#e87898', // rose
  '#e0a3d6', // pink
  '#9fd485', // sage green
  '#f0a8c0', // blush
]
