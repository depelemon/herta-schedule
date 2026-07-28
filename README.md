# HertaSchedule

A personal study scheduler, themed after Herta from Honkai: Star Rail. Runs as a local React web app in Chrome/Edge — no backend required.

## Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Routing | React Router v6 (hash router) |
| State | Zustand |
| Styling | Tailwind CSS |
| Date logic | date-fns v4 |
| Icons | lucide-react |
| Persistence | File System Access API → `depeschedule.json` + localStorage fallback |

## Getting Started

```bash
npm install
npm run dev       # http://localhost:5173
```

Or use the launcher, which starts the dev server and opens it in your default browser:

```bash
npm start
# or: bash start.sh
```

Other scripts:

```bash
npm run build     # production build → dist/
npm run preview   # preview the production build
```

Requires Chrome or Edge for the "Link data file" feature (File System Access API).

## Pages

- **Today** (`/today`) — today's schedule blocks with due to-dos and quick-add.
- **Schedule** (`/schedule`) — weekly Mon–Sun grid with draw/move/resize editing and a "Generate Schedule" helper.
- **Courses** (`/courses`) — manage courses and their date-scoped to-dos.
- **Settings** (`/settings`) — customize the banner, background, and sidebar images.

## Data Model

```ts
Course       { id, name, code?, color }
ScheduleBlock { id, courseId, day: 0-6 (Mon=0), start: "12:00", end: "13:00", location? }
Todo         { id, courseId, title, date: "2026-06-28", done, notes? }
```

App state is auto-saved to `localStorage`, and optionally to a linked `depeschedule.json` file for backup/sync (e.g. via Google Drive). Export/Import buttons are available as a manual fallback.

## Project Structure

```
src/
  components/   — CourseBadge, DatePicker, CourseSelect, Modal, Sidebar, PageBackground
  lib/          — time helpers, schedule generator
  pages/        — TodayPage, SchedulePage, CoursePage, SettingsPage
  store/        — Zustand stores + persistence (file system / localStorage / import-export)
  types.ts      — Course, ScheduleBlock, Todo, AppData
public/         — default banner, background, and sidebar art
```

See [handoff.md](handoff.md) for the detailed session-by-session change log.
