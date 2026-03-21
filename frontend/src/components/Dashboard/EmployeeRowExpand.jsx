import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

function ItemSection({ title, items, variant }) {
  if (!items || items.length === 0) return null

  const isOutlier = variant === 'outlier'

  return (
    <div className="flex-1 min-w-[180px]">
      <div className={`flex items-center gap-1.5 mb-1 ${isOutlier ? 'text-amber-700' : 'text-gray-700'}`}>
        {isOutlier && <ExclamationTriangleIcon className="w-3.5 h-3.5" />}
        <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
      </div>
      {isOutlier && (
        <p className="text-xs text-amber-500 mb-2">
          Tools approved for this person specifically — not part of their standard role bundle.
        </p>
      )}
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.name} className={`flex items-start justify-between gap-2 text-xs ${isOutlier ? 'text-amber-700' : 'text-gray-600'}`}>
            <div className="min-w-0">
              <span className={`font-medium ${isOutlier ? 'text-amber-800' : 'text-gray-800'}`}>
                {item.name}
              </span>
              {isOutlier && item.reason && (
                <p className="text-amber-500 mt-0.5 truncate">{item.reason}</p>
              )}
            </div>
            <span className={`font-semibold shrink-0 ${isOutlier ? 'text-amber-700' : 'text-gray-700'}`}>
              {fmt(item.annual_cost)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Expanded detail row for a single employee in the main table.
 * Rendered inside a <td colSpan={7}> by Dashboard.
 *
 * Props:
 *   employee  — employee_details row from tcoSummary
 *   lineItems — entry from MOCK_EMPLOYEE_LINE_ITEMS[employee.employee_id]
 */
export default function EmployeeRowExpand({ employee, lineItems }) {
  if (!lineItems) {
    return (
      <div className="px-4 py-3 text-xs text-gray-400 italic">
        No line-item detail available for this employee.
      </div>
    )
  }

  const { birthright_items, persona_items, outlier_items } = lineItems
  const hasOutliers = outlier_items && outlier_items.length > 0

  return (
    <div className={`px-6 py-4 flex flex-wrap gap-6 border-t ${hasOutliers ? 'bg-amber-50/50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
      <ItemSection title="Birthright Items" items={birthright_items} variant="birthright" />
      <ItemSection title="Persona Items"    items={persona_items}    variant="persona" />
      {hasOutliers && (
        <ItemSection title="Outlier Adjustments" items={outlier_items} variant="outlier" />
      )}
    </div>
  )
}
