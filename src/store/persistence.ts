import { type AppData, emptyData, CURRENT_VERSION } from '../types'

const LS_KEY = 'depeschedule:data'
const IDB_NAME = 'depeschedule'
const IDB_STORE = 'handles'
const HANDLE_KEY = 'dataFile'

// --- File System Access API types (loosely typed; not in all TS lib versions) ---
type FileHandle = {
  createWritable: () => Promise<{
    write: (data: string) => Promise<void>
    close: () => Promise<void>
  }>
  getFile: () => Promise<File>
  queryPermission?: (opts: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>
  requestPermission?: (opts: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>
  name: string
}

export const supportsFileSystem = () =>
  typeof (window as any).showSaveFilePicker === 'function'

// ---------- localStorage (always-on cache / fallback) ----------
export function loadLocal(): AppData {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return emptyData()
    return migrate(JSON.parse(raw))
  } catch {
    return emptyData()
  }
}

export function saveLocal(data: AppData): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
  } catch {
    /* quota / private mode — ignore */
  }
}

function migrate(data: AppData): AppData {
  return { ...emptyData(), ...data, version: CURRENT_VERSION }
}

// ---------- IndexedDB: persist the chosen file handle across reloads ----------
function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openIdb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openIdb()
  const result = await new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly')
    const req = tx.objectStore(IDB_STORE).get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  })
  db.close()
  return result
}

async function idbDelete(key: string): Promise<void> {
  const db = await openIdb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

// ---------- Linked data file ----------
let linkedHandle: FileHandle | null = null

export function getLinkedFileName(): string | null {
  return linkedHandle?.name ?? null
}

async function verifyPermission(handle: FileHandle, write: boolean): Promise<boolean> {
  const opts = { mode: write ? ('readwrite' as const) : ('read' as const) }
  if ((await handle.queryPermission?.(opts)) === 'granted') return true
  if ((await handle.requestPermission?.(opts)) === 'granted') return true
  return false
}

/** Pick (or create) a JSON file and bind it. Returns its current contents if any. */
export async function linkFile(initial: AppData): Promise<AppData | null> {
  const w = window as any
  let handle: FileHandle
  try {
    handle = await w.showSaveFilePicker({
      suggestedName: 'depeschedule.json',
      types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
    })
  } catch {
    return null // user cancelled
  }
  linkedHandle = handle
  await idbSet(HANDLE_KEY, handle)

  // If the file already has content, prefer it; otherwise write initial.
  const file = await handle.getFile()
  const text = (await file.text()).trim()
  if (text) {
    try {
      const data = migrate(JSON.parse(text))
      return data
    } catch {
      /* malformed — fall through to overwrite with initial */
    }
  }
  await writeFile(initial)
  return initial
}

/** Re-bind a previously linked file on startup. Returns its contents or null. */
export async function restoreLinkedFile(): Promise<AppData | null> {
  if (!supportsFileSystem()) return null
  const handle = await idbGet<FileHandle>(HANDLE_KEY)
  if (!handle) return null
  if (!(await verifyPermission(handle, true))) return null
  linkedHandle = handle
  try {
    const file = await handle.getFile()
    const text = (await file.text()).trim()
    return text ? migrate(JSON.parse(text)) : emptyData()
  } catch {
    return null
  }
}

export async function writeFile(data: AppData): Promise<void> {
  if (!linkedHandle) return
  const writable = await linkedHandle.createWritable()
  await writable.write(JSON.stringify(data, null, 2))
  await writable.close()
}

export async function unlinkFile(): Promise<void> {
  linkedHandle = null
  await idbDelete(HANDLE_KEY)
}

// ---------- Manual export / import (fallback & backup) ----------
export function exportJson(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'depeschedule.json'
  a.click()
  URL.revokeObjectURL(url)
}

export function importJson(): Promise<AppData | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      try {
        resolve(migrate(JSON.parse(await file.text())))
      } catch {
        resolve(null)
      }
    }
    input.click()
  })
}
