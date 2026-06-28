import { create } from 'zustand'

const LS_KEY = 'hertaschedule:settings'

export const DEFAULT_BANNER = '/hertabanner.png'
export const DEFAULT_BG = '/hertabg.jpeg'
export const DEFAULT_SIDEBAR = '/hertaside.gif'

export interface AppSettings {
  bannerSrc: string | null   // null = use DEFAULT_BANNER
  bgSrc: string | null       // null = use DEFAULT_BG
  sidebarSrc: string | null  // null = use DEFAULT_SIDEBAR
}

interface SettingsStore extends AppSettings {
  setBannerSrc: (src: string | null) => void
  setBgSrc: (src: string | null) => void
  setSidebarSrc: (src: string | null) => void
}

const fallback: AppSettings = { bannerSrc: null, bgSrc: null, sidebarSrc: null }

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

function save(s: AppSettings): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s))
  } catch {
    // quota exceeded — change is live for this session but won't persist
  }
}

export const useSettings = create<SettingsStore>((set) => {
  const commit = (patch: Partial<AppSettings>) =>
    set((s) => {
      const next: AppSettings = {
        bannerSrc: patch.bannerSrc !== undefined ? patch.bannerSrc : s.bannerSrc,
        bgSrc: patch.bgSrc !== undefined ? patch.bgSrc : s.bgSrc,
        sidebarSrc: patch.sidebarSrc !== undefined ? patch.sidebarSrc : s.sidebarSrc,
      }
      save(next)
      return next
    })

  return {
    ...load(),
    setBannerSrc: (src) => commit({ bannerSrc: src }),
    setBgSrc: (src) => commit({ bgSrc: src }),
    setSidebarSrc: (src) => commit({ sidebarSrc: src }),
  }
})
