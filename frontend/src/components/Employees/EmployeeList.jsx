import { useState, useEffect, useCallback } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline'
import { employees as employeesApi } from '../../services/api.js'
import { useApp } from '../../context/AppContext.jsx'
import { MOCK_EMPLOYEES } from '../../data/mockData.js'
import clsx from 'clsx'

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

function EmployeeModal({ employee, personas, onClose, onSaved }) {
  const isEdit = Boolean(employee)
  const [form, setForm] = useState({
    name: employee?.name ?? '',
    email: employee?.email ?? '',
    department: employee?.department ?? '',
    location: employee?.location ?? '',
    persona_id: employee?.persona_id ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true); setError(null)
    try {
      const payload = {
        ...form,
        persona_id: form.persona_id ? Number(form.persona_id) : null,
        email: form.email || null,
        department: form.department || null,
        location: form.location || null,
      }
      if (isEdit) await employeesApi.update(employee.id, payload)
      else await employeesApi.create(payload)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
        <h3 className="text-lg font-semibold">{isEdit ? 'Edit Employee' : 'Add Employee'}</h3>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{error}</p>}
        {[
          { key: 'name', label: 'Full Name *', placeholder: 'Jane Smith' },
          { key: 'email', label: 'Email', placeholder: 'jane@company.com' },
          { key: 'department', label: 'Department', placeholder: 'Engineering' },
          { key: 'location', label: 'Location', placeholder: 'New York, NY' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="label">{label}</label>
            <input
              className="input"
              placeholder={placeholder}
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
            />
          </div>
        ))}
        <div>
          <label className="label">Persona</label>
          <select className="input" value={form.persona_id} onChange={(e) => set('persona_id', e.target.value)}>
            <option value="">— Unassigned —</option>
            {personas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : isEdit ? 'Save' : 'Add Employee'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EmployeeList() {
  const { personas, tcoSummary, refreshTCO, demoMode } = useApp()
  const [employees, setEmployees] = useState([])
  const [search, setSearch]       = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [personaFilter, setPersonaFilter] = useState('')
  const [modalTarget, setModalTarget] = useState(null)  // null | 'new' | employee object
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    if (demoMode) {
      setEmployees(MOCK_EMPLOYEES)
      return
    }
    try {
      const data = await employeesApi.list()
      setEmployees(data)
    } catch { /* silently fail — API unreachable */ }
  }, [demoMode])

  useEffect(() => { load() }, [load])

  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))].sort()

  const filtered = employees.filter((e) => {
    const matchSearch = !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.email ?? '').toLowerCase().includes(search.toLowerCase())
    const matchDept = !deptFilter || e.department === deptFilter
    const matchPersona = !personaFilter || String(e.persona_id) === personaFilter
    return matchSearch && matchDept && matchPersona
  })

  // Build TCO lookup by employee_id
  const tcoByEmployee = Object.fromEntries(
    (tcoSummary?.employee_details ?? []).map((d) => [d.employee_id, d.total_annual])
  )

  const handleSaved = () => {
    setModalTarget(null)
    load()
    refreshTCO()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await employeesApi.remove(deleteTarget.id)
    setDeleteTarget(null)
    load()
    refreshTCO()
  }

  return (
    <div className="space-y-4">
      {/* Demo integration banner */}
      {demoMode && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-start gap-3">
          <CloudArrowDownIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-800">Active Directory &amp; HRIS sync available</p>
            <p className="text-blue-700 mt-0.5">
              In production, this roster syncs automatically from Azure AD, Okta, or your HRIS (Workday, BambooHR).
              New hires appear on day one; departures are flagged for license reclamation.
              A connector stub is ready in <code className="font-mono text-xs bg-blue-100 px-1 rounded">backend/app/services/data_connector.py</code>.
            </p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="input pl-8 text-sm"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input text-sm w-40" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="input text-sm w-40" value={personaFilter} onChange={(e) => setPersonaFilter(e.target.value)}>
          <option value="">All Personas</option>
          {personas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={() => setModalTarget('new')} className="btn-primary shrink-0">
          <PlusIcon className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {['Name', 'Email', 'Department', 'Persona', 'Annual TCO', ''].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                    {employees.length === 0
                      ? 'No employees yet — add one manually or upload a roster.'
                      : 'No employees match your filters.'}
                  </td>
                </tr>
              )}
              {filtered.map((emp) => {
                const persona = personas.find((p) => p.id === emp.persona_id)
                return (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{emp.name}</td>
                    <td className="py-3 px-4 text-gray-500">{emp.email ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-500">{emp.department ?? '—'}</td>
                    <td className="py-3 px-4">
                      {persona ? (
                        <span
                          className="badge text-white text-xs"
                          style={{ backgroundColor: persona.color }}
                        >
                          {persona.name}
                        </span>
                      ) : (
                        <span className="badge bg-gray-100 text-gray-500">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {tcoByEmployee[emp.id] != null ? fmt(tcoByEmployee[emp.id]) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => setModalTarget(emp)}
                          className="p-1.5 rounded text-gray-400 hover:text-brand-600 hover:bg-brand-50"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(emp)}
                          className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
          {filtered.length} of {employees.length} employees
        </div>
      </div>

      {/* Modal */}
      {modalTarget && (
        <EmployeeModal
          employee={modalTarget === 'new' ? null : modalTarget}
          personas={personas}
          onClose={() => setModalTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Remove Employee</h3>
            <p className="text-sm text-gray-600 mb-4">
              Remove <strong>{deleteTarget.name}</strong> and all their outlier adjustments?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn-danger">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
