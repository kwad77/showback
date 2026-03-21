import { useState } from 'react'
import { PlusIcon, TrashIcon, ShieldCheckIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline'
import { birthright as birthrightApi } from '../../services/api.js'
import { useApp } from '../../context/AppContext.jsx'
import clsx from 'clsx'

const fmt = (co) => {
  const annual = co.frequency === 'Monthly' ? co.cost * 12 : co.cost
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(annual)
}

const CATEGORY_COLORS = {
  HW:      'bg-blue-100 text-blue-700',
  SW:      'bg-purple-100 text-purple-700',
  Network: 'bg-green-100 text-green-700',
  Mobile:  'bg-orange-100 text-orange-700',
}

export default function BirthrightManager() {
  const { birthright, costObjects, refresh, tcoSummary, demoMode } = useApp()
  const [adding, setAdding]     = useState(false)
  const [selectedCO, setSelected] = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)

  // Cost objects not yet in birthright
  const birthrightCOIds = new Set(birthright.map((b) => b.cost_object_id))
  const available = costObjects.filter((co) => !birthrightCOIds.has(co.id))

  const totalBirthrightAnnual = birthright.reduce(
    (sum, b) => sum + (b.cost_object?.frequency === 'Monthly' ? b.cost_object.cost * 12 : b.cost_object?.cost ?? 0),
    0,
  )

  const handleAdd = async () => {
    if (!selectedCO) return
    setSaving(true); setError(null)
    try {
      await birthrightApi.add({ cost_object_id: Number(selectedCO), is_active: true })
      setAdding(false); setSelected(''); refresh()
    } catch (err) {
      setError(err.response?.data?.detail ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id, current) => {
    try {
      await birthrightApi.toggle(id, !current)
      refresh()
    } catch { /* ignore */ }
  }

  const handleRemove = async (id) => {
    try {
      await birthrightApi.remove(id)
      refresh()
    } catch { /* ignore */ }
  }

  const empCount = tcoSummary?.total_employees ?? 0

  return (
    <div className="max-w-3xl space-y-6">
      {/* Demo integration banner */}
      {demoMode && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-start gap-3">
          <CloudArrowDownIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-800">What is a Birthright item?</p>
            <p className="text-blue-700 mt-0.5">
              Birthright items are tools <strong>every employee gets on day one</strong>, regardless of role —
              email, single sign-on, endpoint security, and VPN. They form your fixed-cost floor:
              the minimum you spend per person before any role-specific tools are counted.
              In production, this list can sync from your ITAM system (e.g. ServiceNow).
              A connector stub is ready in <code className="font-mono text-xs bg-blue-100 px-1 rounded">backend/app/services/data_connector.py</code>.
            </p>
          </div>
        </div>
      )}

      {/* Summary banner */}
      <div className="card bg-violet-50 border-violet-200 flex items-center gap-4">
        <ShieldCheckIcon className="w-8 h-8 text-violet-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-violet-900">Global Birthright Cost</p>
          <p className="text-2xl font-bold text-violet-700">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalBirthrightAnnual)}
            <span className="text-sm font-normal text-violet-500 ml-1">/ employee / year</span>
          </p>
          {empCount > 0 && (
            <p className="text-xs text-violet-500 mt-0.5">
              Total fleet cost: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalBirthrightAnnual * empCount)} across {empCount} employees
            </p>
          )}
        </div>
      </div>

      {/* Add birthright */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Birthright Items</h3>
          <button onClick={() => setAdding(!adding)} className="btn-secondary text-xs py-1.5">
            <PlusIcon className="w-3.5 h-3.5" />
            Add Item
          </button>
        </div>

        {adding && (
          <div className="rounded-lg border border-gray-200 p-3 bg-gray-50 space-y-2">
            <select
              className="input text-sm"
              value={selectedCO}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">— select a cost object —</option>
              {available.map((co) => (
                <option key={co.id} value={co.id}>
                  {co.name} ({co.category}) — {fmt(co)}/yr
                </option>
              ))}
            </select>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={saving || !selectedCO} className="btn-primary text-xs py-1.5">
                {saving ? 'Adding…' : 'Add to Birthright'}
              </button>
              <button onClick={() => { setAdding(false); setError(null) }} className="btn-secondary text-xs py-1.5">
                Cancel
              </button>
            </div>
          </div>
        )}

        {birthright.length === 0 && !adding ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            No birthright costs defined. Add cost objects that apply to every employee.
          </p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {birthright.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(b.id, b.is_active)}
                    className={clsx(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                      b.is_active ? 'bg-brand-600' : 'bg-gray-200',
                    )}
                  >
                    <span className={clsx(
                      'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                      b.is_active ? 'translate-x-4' : 'translate-x-1',
                    )} />
                  </button>
                  <div>
                    <p className={clsx('text-sm font-medium', !b.is_active && 'text-gray-400 line-through')}>
                      {b.cost_object?.name}
                    </p>
                    <p className="text-xs text-gray-400">{b.cost_object?.vendor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={clsx('badge', CATEGORY_COLORS[b.cost_object?.category] ?? 'bg-gray-100 text-gray-600')}>
                    {b.cost_object?.category}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {b.cost_object ? fmt(b.cost_object) : '—'}/yr
                  </span>
                  <button
                    onClick={() => handleRemove(b.id)}
                    className="p-1 rounded text-gray-300 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
