import type { Course } from '../types'

export default function CourseBadge({
  course,
  size = 'md',
}: {
  course: Course
  size?: 'sm' | 'md'
}) {
  const dot = size === 'sm' ? 8 : 10
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-block rounded-full"
        style={{ width: dot, height: dot, backgroundColor: course.color, boxShadow: `0 0 8px ${course.color}` }}
      />
      <span className={size === 'sm' ? 'text-sm' : ''}>
        {course.code ? `${course.code} · ` : ''}
        {course.name}
      </span>
    </span>
  )
}
