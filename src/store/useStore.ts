import { create } from 'zustand'
import {
  type AppData,
  type Course,
  type ScheduleBlock,
  type Todo,
  type DayOfWeek,
  COURSE_COLORS,
} from '../types'
import {
  loadLocal,
  saveLocal,
  writeFile,
  restoreLinkedFile,
  linkFile as linkFilePersist,
  unlinkFile as unlinkFilePersist,
  getLinkedFileName,
  exportJson,
  importJson,
  supportsFileSystem,
} from './persistence'

const uid = () => Math.random().toString(36).slice(2, 10)

interface State extends AppData {
  linkedFileName: string | null
  fileSupported: boolean

  // course actions
  addCourse: (name: string, code?: string, color?: string) => Course
  updateCourse: (id: string, patch: Partial<Omit<Course, 'id'>>) => void
  deleteCourse: (id: string) => void

  // schedule block actions
  addBlock: (b: Omit<ScheduleBlock, 'id'>) => void
  addBlockOnDays: (b: Omit<ScheduleBlock, 'id' | 'day'>, days: DayOfWeek[]) => void
  updateBlock: (id: string, patch: Partial<Omit<ScheduleBlock, 'id'>>) => void
  deleteBlock: (id: string) => void
  setBlocks: (blocks: ScheduleBlock[]) => void

  // todo actions
  addTodo: (t: Omit<Todo, 'id' | 'done'>) => void
  updateTodo: (id: string, patch: Partial<Omit<Todo, 'id'>>) => void
  toggleTodo: (id: string) => void
  deleteTodo: (id: string) => void

  // persistence
  linkFile: () => Promise<void>
  unlinkFile: () => Promise<void>
  exportData: () => void
  importData: () => Promise<void>
  initFromFile: () => Promise<void>
}

// Debounced write to the linked file.
let writeTimer: ReturnType<typeof setTimeout> | null = null
function persist(data: AppData) {
  saveLocal(data)
  if (writeTimer) clearTimeout(writeTimer)
  writeTimer = setTimeout(() => {
    void writeFile(data)
  }, 500)
}

function snapshot(s: AppData): AppData {
  return { version: s.version, courses: s.courses, blocks: s.blocks, todos: s.todos }
}

const initial = loadLocal()

export const useStore = create<State>((set, get) => {
  // Wrap a mutation: apply it, then persist the resulting snapshot.
  const commit = (updater: (s: State) => Partial<State>) => {
    set((s) => {
      const patch = updater(s)
      const next = { ...s, ...patch }
      persist(snapshot(next))
      return patch
    })
  }

  return {
    ...initial,
    linkedFileName: null,
    fileSupported: supportsFileSystem(),

    addCourse: (name, code, color) => {
      const course: Course = {
        id: uid(),
        name: name.trim(),
        code: code?.trim() || undefined,
        color: color ?? COURSE_COLORS[get().courses.length % COURSE_COLORS.length],
      }
      commit((s) => ({ courses: [...s.courses, course] }))
      return course
    },

    updateCourse: (id, patch) =>
      commit((s) => ({
        courses: s.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      })),

    deleteCourse: (id) =>
      commit((s) => ({
        courses: s.courses.filter((c) => c.id !== id),
        blocks: s.blocks.filter((b) => b.courseId !== id),
        todos: s.todos.filter((t) => t.courseId !== id),
      })),

    addBlock: (b) => commit((s) => ({ blocks: [...s.blocks, { ...b, id: uid() }] })),

    addBlockOnDays: (b, days) =>
      commit((s) => ({
        blocks: [...s.blocks, ...days.map((day) => ({ ...b, day, id: uid() }))],
      })),

    updateBlock: (id, patch) =>
      commit((s) => ({
        blocks: s.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      })),

    deleteBlock: (id) => commit((s) => ({ blocks: s.blocks.filter((b) => b.id !== id) })),

    setBlocks: (blocks) => commit(() => ({ blocks })),

    addTodo: (t) =>
      commit((s) => ({ todos: [...s.todos, { ...t, id: uid(), done: false }] })),

    updateTodo: (id, patch) =>
      commit((s) => ({
        todos: s.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      })),

    toggleTodo: (id) =>
      commit((s) => ({
        todos: s.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
      })),

    deleteTodo: (id) => commit((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),

    linkFile: async () => {
      const data = await linkFilePersist(snapshot(get()))
      if (data) {
        saveLocal(data)
        set({ ...data, linkedFileName: getLinkedFileName() })
      }
    },

    unlinkFile: async () => {
      await unlinkFilePersist()
      set({ linkedFileName: null })
    },

    exportData: () => exportJson(snapshot(get())),

    importData: async () => {
      const data = await importJson()
      if (data) {
        persist(data)
        set({ ...data })
      }
    },

    initFromFile: async () => {
      const data = await restoreLinkedFile()
      if (data) {
        saveLocal(data)
        set({ ...data, linkedFileName: getLinkedFileName() })
      }
    },
  }
})

// Convenience selectors
export const useCourse = (id: string | undefined) =>
  useStore((s) => s.courses.find((c) => c.id === id))
