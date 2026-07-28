import type { Course, ScheduleBlock, DayOfWeek } from '../types'
import { fromMinutes, toMinutes } from './time'

const uid = () => Math.random().toString(36).slice(2, 10)

// 9 predefined (day, start) slots that spread evenly across Mon–Fri.
// 9 slots × 2 hours = 18 hours/week. No slot starts before 10:00.
const SPREAD: Array<[DayOfWeek, string]> = [
  [0, '10:00'], // Mon morning
  [2, '10:00'], // Wed morning
  [4, '10:00'], // Fri morning
  [1, '14:00'], // Tue afternoon
  [3, '14:00'], // Thu afternoon
  [0, '14:00'], // Mon afternoon
  [2, '14:00'], // Wed afternoon
  [1, '10:00'], // Tue morning
  [3, '10:00'], // Thu morning
]

const SESSION_MINUTES = 120 // 2-hour blocks

export function generateSchedule(courses: Course[]): ScheduleBlock[] {
  if (courses.length === 0) return []
  return SPREAD.map(([day, start], i) => ({
    id: uid(),
    courseId: courses[i % courses.length].id,
    day,
    start,
    end: fromMinutes(toMinutes(start) + SESSION_MINUTES),
  }))
}
