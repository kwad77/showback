import { useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

const PAGE_TITLES = {
  '/dashboard':  'Dashboard',
  '/personas':   'Persona Builder',
  '/birthright': 'Global Birthright Costs',
  '/employees':  'Employee Roster',
  '/upload':     'Upload Data',
}

export default function Header() {
  const { pathname } = useLocation()
  const { loading, refresh, refreshTCO } = useApp()

  const handleRefresh = () => {
    refresh()
    refreshTCO()
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0">
      <h1 className="text-xl font-semibold text-gray-900">
        {PAGE_TITLES[pathname] ?? 'Showback'}
      </h1>
      <button
        onClick={handleRefresh}
        className="btn-secondary"
        title="Refresh data"
      >
        <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </header>
  )
}
