import { useState } from 'react'
import { XMarkIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const pct = (part, total) => (total ? Math.round((part / total) * 100) : 0)

const SOURCE_STYLES = {
  Birthright: { bar: 'bg-violet-400', badge: 'bg-violet-100 text-violet-700' },
  Persona:    { bar: 'bg-brand-500',  badge: 'bg-brand-50 text-brand-700'   },
  Outlier:    { bar: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700'   },
}

function CostBar({ value, max, colorClass }) {
  const width = max ? Math.max(2, Math.round((value / max) * 100)) : 0
  return (
    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${width}%` }} />
    </div>
  )
}

function ItemRow({ item, maxTotal, onClick }) {
  const styles = SOURCE_STYLES[item.source_type] ?? SOURCE_STYLES.Outlier
  return (
    <button
      onClick={() => onClick(item)}
      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900 truncate">{item.name}</span>
          <span className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full ${styles.badge}`}>
            {item.source_type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CostBar value={item.annual_total} max={maxTotal} colorClass={styles.bar} />
          <span className="text-xs text-gray-400 shrink-0">{pct(item.annual_total, maxTotal)}%</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-gray-900">{fmt(item.annual_total)}</p>
        <p className="text-xs text-gray-400">{item.employee_count} emp</p>
      </div>
    </button>
  )
}

function ItemDetail({ item, categoryTotal, onBack }) {
  const styles = SOURCE_STYLES[item.source_type] ?? SOURCE_STYLES.Outlier

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Back to list
      </button>

      {/* Item header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-base font-semibold text-gray-900">{item.name}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.badge}`}>
            {item.source_type}
          </span>
        </div>
        {item.vendor && <p className="text-sm text-gray-500">{item.vendor}</p>}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Annual Total',    value: fmt(item.annual_total) },
          { label: 'Cost / Employee', value: fmt(item.cost_per) },
          { label: 'Employees',       value: item.employee_count },
        ].map(({ label, value }) => (
          <div key={label} className="bg-brand-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-base font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Share of category */}
      <div>
        <p className="text-xs text-gray-500 mb-1.5">Share of category spend</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${styles.bar}`}
              style={{ width: `${pct(item.annual_total, categoryTotal)}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-gray-700 shrink-0">
            {pct(item.annual_total, categoryTotal)}%
          </span>
        </div>
      </div>

      {/* Source breakdown */}
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Allocation</p>
        </div>
        <div className="px-4 py-3 space-y-2">
          {item.source_type === 'Birthright' && (
            <p className="text-sm text-gray-700">
              This is a <span className="font-semibold">birthright item</span> — it is assigned to
              every employee on day one ({item.employee_count} total).
              The {fmt(item.cost_per)}/yr per-employee cost is multiplied across the full headcount.
            </p>
          )}
          {item.source_type === 'Persona' && (
            <p className="text-sm text-gray-700">
              This tool is part of the <span className="font-semibold">{item.source_label}</span> persona.
              All {item.employee_count} employees assigned to that persona receive it at
              {' '}{fmt(item.cost_per)}/yr each.
            </p>
          )}
          {item.source_type === 'Outlier' && (
            <p className="text-sm text-gray-700">
              This is an <span className="font-semibold">individual outlier adjustment</span> —
              not part of any standard persona bundle. It has been explicitly approved for
              {' '}{item.employee_count} {item.employee_count === 1 ? 'employee' : 'employees'} at
              {' '}{fmt(item.cost_per)}/yr each. Review on the employee detail rows in the
              dashboard to see who holds this license and why.
            </p>
          )}
        </div>
      </div>

      {/* Cost-per-employee context */}
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost context</p>
        </div>
        <div className="px-4 divide-y divide-gray-50">
          {[
            { label: 'Annual per employee', value: fmt(item.cost_per) },
            { label: 'Monthly per employee', value: fmt(Math.round(item.cost_per / 12)) },
            { label: 'Total annual across all holders', value: fmt(item.annual_total) },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2.5">
              <span className="text-sm text-gray-600">{label}</span>
              <span className="text-sm font-semibold text-gray-900">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CategoryDrillPanel({ category, items = [], categoryTotal, onClose }) {
  const [selectedItem, setSelectedItem] = useState(null)

  if (!category) return null

  const maxTotal = items[0]?.annual_total ?? 1  // items are pre-sorted descending

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[480px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
            <p className="text-sm text-gray-500">
              {fmt(categoryTotal)} total · {items.length} line item{items.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          {selectedItem ? (
            <ItemDetail
              item={selectedItem}
              categoryTotal={categoryTotal}
              onBack={() => setSelectedItem(null)}
            />
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-gray-400 px-3 mb-3">
                Click any item to see how it's allocated across your workforce.
              </p>
              {items.map((item) => (
                <ItemRow
                  key={item.name}
                  item={item}
                  maxTotal={maxTotal}
                  onClick={setSelectedItem}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
