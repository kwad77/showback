import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { personas as personasApi } from '../../services/api.js'
import { useApp } from '../../context/AppContext.jsx'
import CostObjectSelector from './CostObjectSelector.jsx'

const PRESET_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16',
]

const ICONS = ['user', 'code', 'chart-bar', 'briefcase', 'cog', 'academic-cap', 'device-mobile', 'server']

export default function PersonaEditor({ persona, onClose, onSaved }) {
  const { costObjects } = useApp()
  const isEdit = Boolean(persona)

  const [name, setName]           = useState(persona?.name ?? '')
  const [description, setDesc]    = useState(persona?.description ?? '')
  const [color, setColor]         = useState(persona?.color ?? '#6366f1')
  const [icon, setIcon]           = useState(persona?.icon ?? 'user')
  const [selectedIds, setSelected]= useState(
    persona?.cost_objects?.map((co) => co.id) ?? []
  )
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)

  const toggleId = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const annualTotal = costObjects
    .filter((co) => selectedIds.includes(co.id))
    .reduce((sum, co) => sum + (co.frequency === 'Monthly' ? co.cost * 12 : co.cost), 0)

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError(null)
    try {
      const payload = { name: name.trim(), description, color, icon, cost_object_ids: selectedIds }
      if (isEdit) {
        await personasApi.update(persona.id, payload)
      } else {
        await personasApi.create(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              {isEdit ? `Edit Persona — ${persona.name}` : 'New Persona'}
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="label">Persona Name *</label>
              <input
                className="input"
                placeholder="e.g. Developer, Sales, HR"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <label className="label">Description</label>
              <textarea
                className="input resize-none"
                rows={2}
                placeholder="Brief description of this persona's technology needs…"
                value={description}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>

            {/* Color + Icon */}
            <div className="flex gap-6">
              <div>
                <label className="label">Colour</label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        borderColor: color === c ? '#1e1b4b' : 'transparent',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Cost Object Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Cost Objects</label>
                <span className="text-sm text-emerald-600 font-medium">
                  Base: ${annualTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr
                </span>
              </div>
              {costObjects.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg">
                  No cost objects yet — upload a file or create them in the Reports API.
                </p>
              ) : (
                <CostObjectSelector
                  allCostObjects={costObjects}
                  selectedIds={selectedIds}
                  onToggle={toggleId}
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Persona'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
