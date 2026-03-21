import { useState } from 'react'
import { PlusIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline'
import { useApp } from '../../context/AppContext.jsx'
import { personas as personasApi } from '../../services/api.js'
import PersonaCard from './PersonaCard.jsx'
import PersonaEditor from './PersonaEditor.jsx'

export default function PersonaBuilder() {
  const { personas, employees: _employees, refresh, demoMode } = useApp()

  // Build a quick employee-count-per-persona map from tcoSummary or just 0
  const { tcoSummary } = useApp()
  const empCountByPersona = Object.fromEntries(
    (tcoSummary?.by_persona ?? []).map((p) => [p.persona_id, p.employee_count])
  )

  const [editTarget, setEditTarget]   = useState(null)   // persona object or 'new'
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]       = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const handleSaved = () => {
    setEditTarget(null)
    refresh()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await personasApi.remove(deleteTarget.id)
      setDeleteTarget(null)
      refresh()
    } catch (err) {
      setDeleteError(err.response?.data?.detail ?? err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Demo integration banner */}
      {demoMode && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-start gap-3">
          <CloudArrowDownIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-800">Role-based tool bundles — syncs with your identity provider</p>
            <p className="text-blue-700 mt-0.5">
              Each persona is a <strong>standard tool bundle for a job role</strong>. Assign a persona to an employee
              and they inherit every tool in that bundle. When a tool price changes, update the persona once —
              everyone in that role reprices automatically.
              In production, persona assignment can sync from Azure AD groups or your HRIS job codes.
              A connector stub is ready in <code className="font-mono text-xs bg-blue-100 px-1 rounded">backend/app/services/data_connector.py</code>.
            </p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {personas.length} persona{personas.length !== 1 ? 's' : ''} defined.
            Each persona is a bundle of software licences and hardware assigned to a group of employees.
          </p>
        </div>
        <button onClick={() => setEditTarget('new')} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          New Persona
        </button>
      </div>

      {/* Grid */}
      {personas.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <p className="text-gray-500 mb-4">No personas yet.</p>
          <button onClick={() => setEditTarget('new')} className="btn-primary">
            <PlusIcon className="w-4 h-4" />
            Create your first persona
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {personas.map((p) => (
            <PersonaCard
              key={p.id}
              persona={p}
              employeeCount={empCountByPersona[p.id] ?? 0}
              onEdit={(persona) => setEditTarget(persona)}
              onDelete={(persona) => setDeleteTarget(persona)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {editTarget && (
        <PersonaEditor
          persona={editTarget === 'new' ? null : editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Persona</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
              Employees assigned to this persona will become unassigned.
            </p>
            {deleteError && (
              <p className="text-sm text-red-600 mb-3">{deleteError}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
