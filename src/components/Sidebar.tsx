import { NavLink } from 'react-router-dom'
import { Sun, CalendarDays, BookOpen, Settings, Link2, Link2Off, Download, Upload } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useSettings, DEFAULT_SIDEBAR } from '../store/useSettings'

const nav = [
  { to: '/today', label: 'Today', icon: Sun },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const { linkedFileName, fileSupported, linkFile, unlinkFile, exportData, importData } =
    useStore()
  const sidebarSrc = useSettings((s) => s.sidebarSrc)

  return (
    <aside className="flex w-60 flex-shrink-0 flex-col border-r border-white/8 bg-plum-900/50">
      {/* Brand */}
      <div className="flex-shrink-0 px-5 pt-6 pb-3">
        <h1 className="text-xl font-bold tracking-tight">
          Herta<span className="text-lilac-400">Schedule</span>
        </h1>
        <p className="mt-0.5 text-[11px] text-lavender-300/40 tracking-widest uppercase">kuru kuru~</p>
      </div>

      {/* Character art — between title and nav, fixed small height */}
      <div className="mx-3 mb-3 flex-shrink-0 overflow-hidden rounded-xl border border-white/8 bg-plum-900/60"
           style={{ height: 160 }}>
        <img
          src={sidebarSrc ?? DEFAULT_SIDEBAR}
          alt="Herta"
          className="h-full w-full object-contain object-top"
          draggable={false}
        />
      </div>

      {/* Nav */}
      <nav className="flex-shrink-0 flex flex-col gap-0.5 px-3">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-lilac-500/15 text-lavender-100 shadow-glow border border-lilac-500/20'
                  : 'text-lavender-300/60 hover:bg-white/5 hover:text-lavender-100'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* File / data controls */}
      <div className="flex-shrink-0 px-3 pb-5 space-y-1.5 text-xs">
        {fileSupported ? (
          linkedFileName ? (
            <button
              onClick={unlinkFile}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-lavender-300/70 hover:bg-white/5"
              title={`Linked to ${linkedFileName}`}
            >
              <Link2 size={13} className="text-lilac-400" />
              <span className="truncate">{linkedFileName}</span>
              <Link2Off size={13} className="ml-auto opacity-50" />
            </button>
          ) : (
            <button
              onClick={linkFile}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-lavender-300/60 hover:bg-white/5"
            >
              <Link2 size={13} />
              Link data file
            </button>
          )
        ) : null}

        <div className="flex gap-1.5">
          <button
            onClick={exportData}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-lavender-300/60 hover:bg-white/5"
          >
            <Download size={12} /> Export
          </button>
          <button
            onClick={importData}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-lavender-300/60 hover:bg-white/5"
          >
            <Upload size={12} /> Import
          </button>
        </div>
      </div>
    </aside>
  )
}
