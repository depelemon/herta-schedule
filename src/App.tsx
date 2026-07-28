import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import PageBackground from './components/PageBackground'
import { useStore } from './store/useStore'

export default function App() {
  const initFromFile = useStore((s) => s.initFromFile)

  useEffect(() => {
    void initFromFile()
    // Remove any API keys stored by the (now-removed) music feature
    localStorage.removeItem('hertaschedule:apikeys')
    try {
      const raw = localStorage.getItem('hertaschedule:settings')
      if (raw) {
        const s = JSON.parse(raw)
        if ('youtubeApiKey' in s) {
          delete s.youtubeApiKey
          localStorage.setItem('hertaschedule:settings', JSON.stringify(s))
        }
      }
    } catch {}
  }, [initFromFile])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <PageBackground />
      <main className="relative z-10 flex-1 overflow-y-auto px-8 py-7">
        <Outlet />
      </main>
    </div>
  )
}
