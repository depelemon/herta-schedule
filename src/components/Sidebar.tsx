import { NavLink } from 'react-router-dom'
import { Sun, CalendarDays, BookOpen, Link2, Link2Off, Download, Upload } from 'lucide-react'
import { useStore } from '../store/useStore'

const nav = [
  { to: '/today', label: 'Today', icon: Sun },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/courses', label: 'Courses', icon: BookOpen },
]

export default function Sidebar() {
  const { linkedFileName, fileSupported, linkFile, unlinkFile, exportData, importData } =
    useStore()

  return (
    <aside className="flex w-60 flex-col gap-6 border-r border-white/10 bg-plum-900/40 p-5">
      <div className="px-1">
        <h1 className="text-xl font-bold tracking-tight">
          Depe<span className="text-lilac-400">Schedule</span>
        </h1>
        <p className="mt-1 text-xs text-lavender-300/50">kuru kuru~ ✦</p>
      </div>

      <nav className="flex flex-col gap-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-lilac-500/20 text-lavender-100 shadow-glow'
                  : 'text-lavender-300/70 hover:bg-white/5 hover:text-lavender-100'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-2 text-xs">
        {fileSupported ? (
          linkedFileName ? (
            <button
              onClick={unlinkFile}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-lavender-300/70 hover:bg-white/5"
              title={`Linked to ${linkedFileName}`}
            >
              <Link2 size={14} className="text-lilac-400" />
              <span className="truncate">{linkedFileName}</span>
              <Link2Off size={14} className="ml-auto opacity-60" />
            </button>
          ) : (
            <button
              onClick={linkFile}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-lavender-300/70 hover:bg-white/5"
            >
              <Link2 size={14} />
              Link data file
            </button>
          )
        ) : null}

        <div className="flex gap-2">
          <button
            onClick={exportData}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 px-2 py-1.5 text-lavender-300/70 hover:bg-white/5"
          >
            <Download size={13} /> Export
          </button>
          <button
            onClick={importData}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 px-2 py-1.5 text-lavender-300/70 hover:bg-white/5"
          >
            <Upload size={13} /> Import
          </button>
        </div>
      </div>
    </aside>
  )
}
