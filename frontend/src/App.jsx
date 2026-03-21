import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar.jsx'
import Header from './components/layout/Header.jsx'
import Dashboard from './components/Dashboard/Dashboard.jsx'
import PersonaBuilder from './components/PersonaBuilder/PersonaBuilder.jsx'
import BirthrightManager from './components/Birthright/BirthrightManager.jsx'
import EmployeeList from './components/Employees/EmployeeList.jsx'
import FileUploader from './components/FileUploader/FileUploader.jsx'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/personas" element={<PersonaBuilder />} />
            <Route path="/birthright" element={<BirthrightManager />} />
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/upload" element={<FileUploader />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
