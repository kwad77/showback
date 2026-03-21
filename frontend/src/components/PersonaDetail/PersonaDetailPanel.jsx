import { useState } from 'react'
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { MOCK_EMPLOYEE_LINE_ITEMS } from '../../data/mockData'

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const BIRTHRIGHT_ANNUAL = 912

function KPICard({ label, value }) {
  return (
    <div className="bg-brand-50 rounded-lg p-3 flex flex-col gap-0.5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  )
}

function EmployeeRow({ emp }) {
  const [expanded, setExpanded] = useState(false)
  const lineItems = MOCK_EMPLOYEE_LINE_ITEMS[emp.employee_id]
  const ChevronIcon = expanded ? ChevronDownIcon : ChevronRightIcon

  return (
    <>
      <div
        className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${emp.has_outliers ? 'bg-amber-50 hover:bg-amber-100' : ''}`}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronIcon className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-sm font-medium text-gray-900 truncate">{emp.employee_name}</span>
          <span className="text-xs text-gray-400 shrink-0">{emp.department}</span>
          {emp.has_outliers && (
            <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 shrink-0" title="Has outlier adjustments" />
          )}
        </div>
        <span className="text-sm font-semibold text-gray-900 shrink-0 ml-2">{fmt(emp.total_annual)}</span>
      </div>

      {expanded && lineItems && emp.has_outliers && lineItems.outlier_items.length > 0 && (
        <div className="ml-6 mb-1 border-l-2 border-amber-300 pl-3 space-y-1">
          {lineItems.outlier_items.map((item) => (
            <div key={item.name} className="flex items-start justify-between gap-2 py-1">
              <div>
                <p className="text-xs font-medium text-amber-700">{item.name}</p>
                {item.reason && (
                  <p className="text-xs text-amber-500 mt-0.5">{item.reason}</p>
                )}
              </div>
              <span className="text-xs font-semibold text-amber-700 shrink-0">{fmt(item.annual_cost)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default function PersonaDetailPanel({ persona, personaName, onClose }) {
  if (!persona) return null

  const {
    color,
    cost_objects,
    employees,
    outlier_count,
    outlier_avg,
  } = persona

  // Derive the persona name from cost objects or fall back
  // We actually receive the persona object directly — find name via prop chain
  // We compute totals from employees list
  const totalAnnual    = employees.reduce((s, e) => s + e.total_annual, 0)
  const avgPerEmployee = employees.length ? Math.round(totalAnnual / employees.length) : 0
  const outlierRate    = employees.length ? Math.round((outlier_count / employees.length) * 100) : 0
  const personaCostTotal = cost_objects.reduce((s, i) => s + i.annual_cost, 0)

  const outlierEmployees = employees.filter(e => e.has_outliers)
  const totalOutlierAdj  = outlierEmployees.reduce((s, e) => s + e.outlier_annual, 0)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:max-w-[520px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <h2 className="text-lg font-semibold text-gray-900">
              {personaName ?? 'Persona Detail'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3">
            <KPICard label="Employees" value={employees.length} />
            <KPICard label="Total Annual" value={fmt(totalAnnual)} />
            <KPICard label="Avg per Employee" value={fmt(avgPerEmployee)} />
            <KPICard label="Outlier Rate" value={`${outlierRate}%`} />
          </div>

          {/* Cost breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Cost Breakdown</h3>
            <div className="space-y-2">
              {[
                { label: 'Birthright', amount: BIRTHRIGHT_ANNUAL * employees.length, color: 'bg-violet-400' },
                { label: 'Persona',    amount: personaCostTotal * employees.length,  color: 'bg-brand-500' },
                { label: 'Outliers',   amount: totalOutlierAdj,                      color: 'bg-amber-400' },
              ].map(({ label, amount, color: barColor }) => {
                const pct = totalAnnual ? Math.round((amount / totalAnnual) * 100) : 0
                return (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-20 text-right shrink-0">{fmt(amount)}</span>
                    <span className="text-xs text-gray-400 w-8 text-right shrink-0">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Persona cost objects table */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Persona Cost Objects</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Name', 'Vendor', 'Category', 'Annual Cost', '% of Persona'].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cost_objects.map((item) => (
                    <tr key={item.name} className="hover:bg-gray-50">
                      <td className="py-2 px-2 font-medium text-gray-900">{item.name}</td>
                      <td className="py-2 px-2 text-gray-500">{item.vendor}</td>
                      <td className="py-2 px-2">
                        <span className="badge bg-brand-50 text-brand-700">{item.category}</span>
                      </td>
                      <td className="py-2 px-2 text-gray-700">{fmt(item.annual_cost)}</td>
                      <td className="py-2 px-2 text-gray-500">
                        {personaCostTotal ? Math.round((item.annual_cost / personaCostTotal) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Employees section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Employees</h3>
            {outlier_count > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Outliers</strong> are tools approved for specific employees that fall outside this persona's standard bundle —
                  think a Bloomberg Terminal for one analyst, or a specialised licence a manager signed off on.{' '}
                  {outlier_count} {outlier_count === 1 ? 'person in this persona has' : 'people in this persona have'} them,
                  adding {fmt(totalOutlierAdj)} in total (avg {fmt(outlier_avg)} each).
                  Expand a row below to see the details.
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {employees.map((emp) => (
                <EmployeeRow key={emp.employee_id} emp={emp} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
