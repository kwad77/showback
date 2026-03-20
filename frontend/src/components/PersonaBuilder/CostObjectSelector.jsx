import { useState } from 'react'
import { MagnifyingGlassIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

const CATEGORY_COLORS = {
  HW:      'bg-blue-100 text-blue-700',
  SW:      'bg-purple-100 text-purple-700',
  Network: 'bg-green-100 text-green-700',
  Mobile:  'bg-orange-100 text-orange-700',
}

const fmt = (co) => {
  const annual = co.frequency === 'Monthly' ? co.cost * 12 : co.cost
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(annual) + '/yr'
}

export default function CostObjectSelector({ allCostObjects, selectedIds, onToggle }) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const categories = ['All', 'HW', 'SW', 'Network', 'Mobile']

  const filtered = allCostObjects.filter((co) => {
    const matchSearch = co.name.toLowerCase().includes(search.toLowerCase()) ||
                        (co.vendor ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'All' || co.category === categoryFilter
    return matchSearch && matchCat
  })

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Search + filter bar */}
      <div className="p-3 bg-gray-50 border-b border-gray-200 space-y-2">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="input pl-8 py-1.5 text-sm"
            placeholder="Search cost objects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={clsx(
                'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                categoryFilter === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <ul className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
        {filtered.length === 0 && (
          <li className="py-8 text-center text-sm text-gray-400">
            No cost objects match your filter.
          </li>
        )}
        {filtered.map((co) => {
          const selected = selectedIds.includes(co.id)
          return (
            <li
              key={co.id}
              onClick={() => onToggle(co.id)}
              className={clsx(
                'flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-colors',
                selected ? 'bg-brand-50' : 'hover:bg-gray-50',
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={clsx(
                  'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                  selected
                    ? 'bg-brand-600 border-brand-600'
                    : 'border-gray-300',
                )}>
                  {selected && <CheckIcon className="w-3 h-3 text-white" />}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{co.name}</p>
                  {co.vendor && <p className="text-xs text-gray-400">{co.vendor}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className={clsx('badge', CATEGORY_COLORS[co.category] ?? 'bg-gray-100 text-gray-600')}>
                  {co.category}
                </span>
                <span className="text-gray-500 text-xs">{fmt(co)}</span>
              </div>
            </li>
          )
        })}
      </ul>

      {selectedIds.length > 0 && (
        <div className="px-4 py-2 bg-brand-50 border-t border-brand-100 text-xs text-brand-700 font-medium">
          {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  )
}
