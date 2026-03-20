import { PencilIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

const CATEGORY_COLORS = {
  HW:      'bg-blue-100 text-blue-700',
  SW:      'bg-purple-100 text-purple-700',
  Network: 'bg-green-100 text-green-700',
  Mobile:  'bg-orange-100 text-orange-700',
}

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export default function PersonaCard({ persona, employeeCount, onEdit, onDelete }) {
  const annualBase = persona.cost_objects.reduce(
    (sum, co) => sum + (co.frequency === 'Monthly' ? co.cost * 12 : co.cost),
    0,
  )

  return (
    <div className="card flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: persona.color }}
          >
            <UserIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{persona.name}</h3>
            {persona.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{persona.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(persona)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            title="Edit persona"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(persona)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete persona"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-400">Base Cost / Year</p>
          <p className="font-semibold text-gray-900">{fmt(annualBase)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Employees</p>
          <p className="font-semibold text-gray-900">{employeeCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Cost Objects</p>
          <p className="font-semibold text-gray-900">{persona.cost_objects.length}</p>
        </div>
      </div>

      {/* Cost object pills */}
      {persona.cost_objects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {persona.cost_objects.slice(0, 6).map((co) => (
            <span key={co.id} className={clsx('badge text-xs', CATEGORY_COLORS[co.category] ?? 'bg-gray-100 text-gray-600')}>
              {co.name}
            </span>
          ))}
          {persona.cost_objects.length > 6 && (
            <span className="badge bg-gray-100 text-gray-500">
              +{persona.cost_objects.length - 6} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}
