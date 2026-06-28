import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import { useStore } from './store/useStore'

export default function App() {
  const initFromFile = useStore((s) => s.initFromFile)

  useEffect(() => {
    void initFromFile()
  }, [initFromFile])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-8 py-7">
        <Outlet />
      </main>
    </div>
  )
}
