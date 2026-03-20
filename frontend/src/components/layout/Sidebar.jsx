import { NavLink } from 'react-router-dom'
import {
  ChartBarIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  UsersIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

const NAV = [
  { to: '/dashboard',  label: 'Dashboard',    icon: ChartBarIcon },
  { to: '/personas',   label: 'Personas',      icon: UserGroupIcon },
  { to: '/birthright', label: 'Birthright',    icon: ShieldCheckIcon },
  { to: '/employees',  label: 'Employees',     icon: UsersIcon },
  { to: '/upload',     label: 'Upload Data',   icon: ArrowUpTrayIcon },
]

export default function Sidebar() {
  return (
    <aside className="flex flex-col w-60 bg-gray-900 text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm">
          SB
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">Showback</p>
          <p className="text-xs text-gray-400">TCO Analyzer</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              )
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-800">
        <p className="text-xs text-gray-500">Employee TCO Analyzer v1.0</p>
      </div>
    </aside>
  )
}
