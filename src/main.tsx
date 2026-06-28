import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createHashRouter, Navigate } from 'react-router-dom'
import App from './App.tsx'
import TodayPage from './pages/TodayPage.tsx'
import SchedulePage from './pages/SchedulePage.tsx'
import CoursePage from './pages/CoursePage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import './index.css'

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/today" replace /> },
      { path: 'today', element: <TodayPage /> },
      { path: 'schedule', element: <SchedulePage /> },
      { path: 'courses', element: <CoursePage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
