import { useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { ArrowPathIcon, Bars3Icon } from '@heroicons/react/24/outline'

const PAGE_TITLES = {
  '/dashboard':  'Dashboard',
  '/personas':   'Persona Builder',
  '/birthright': 'Global Birthright Costs',
  '/employees':  'Employee Roster',
  '/upload':     'Upload Data',
}

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation()
  const { loading, refresh, refreshTCO } = useApp()

  const handleRefresh = () => {
    refresh()
    refreshTCO()
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 bg-white border-b border-gray-200 shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
          {PAGE_TITLES[pathname] ?? 'Showback'}
        </h1>
      </div>
      <button
        onClick={handleRefresh}
        className="btn-secondary"
        title="Refresh data"
      >
        <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Refresh</span>
      </button>
    </header>
  )
}
