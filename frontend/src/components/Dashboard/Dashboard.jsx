import React, { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import SummaryCards from './SummaryCards.jsx'
import TCOByCategory from './TCOByCategory.jsx'
import TCOByDepartment from './TCOByDepartment.jsx'
import TCOByPersona from './TCOByPersona.jsx'
import ExportPDF from '../Reports/ExportPDF.jsx'
import PersonaDetailPanel from '../PersonaDetail/PersonaDetailPanel.jsx'
import CategoryDrillPanel from '../CategoryDrill/CategoryDrillPanel.jsx'
import EmployeeRowExpand from './EmployeeRowExpand.jsx'
import { XMarkIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export default function Dashboard() {
  const {
    tcoSummary,
    refreshTCO,
    demoMode,
    enableDemo,
    personaDetails,
    employeeLineItems,
  } = useApp()

  const [selectedPersona,   setSelectedPersona]   = useState(null)
  const [selectedCategory,  setSelectedCategory]  = useState(null)
  const [deptFilter,        setDeptFilter]         = useState(null)
  const [expandedEmployee,  setExpandedEmployee]   = useState(null)
  const [bannerDismissed,   setBannerDismissed]    = useState(false)

  useEffect(() => {
    refreshTCO()
  }, [refreshTCO])

  const filteredEmployees = tcoSummary?.employee_details
    ? deptFilter
      ? tcoSummary.employee_details.filter((e) => e.department === deptFilter)
      : tcoSummary.employee_details
    : []

  const handleEmployeeRowClick = (employeeId) => {
    setExpandedEmployee((prev) => (prev === employeeId ? null : employeeId))
  }

  const handleDeptClick = (dept) => {
    setDeptFilter((prev) => (prev === dept ? null : dept))
    setExpandedEmployee(null)
  }

  return (
    <div className="space-y-6">
      {/* Demo mode banner */}
      {!bannerDismissed && (
        <div className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${demoMode ? 'bg-amber-50 border-amber-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center gap-2 text-sm">
            <span className={`font-semibold ${demoMode ? 'text-amber-800' : 'text-yellow-800'}`}>
              {demoMode
                ? 'Demo Mode — showing sample data.'
                : 'No live data detected.'}
            </span>
            <span className={demoMode ? 'text-amber-700' : 'text-yellow-700'}>
              {demoMode
                ? 'Connect the backend to see live figures.'
                : 'Load the demo dataset to explore the dashboard.'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!demoMode && (
              <button
                onClick={enableDemo}
                className="btn-primary text-xs px-3 py-1.5"
              >
                Load Demo Data
              </button>
            )}
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss banner"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">TCO Overview</h2>
          <p className="text-sm text-gray-500">Total technology cost of ownership across all employees and domains.</p>
        </div>
        <ExportPDF summary={tcoSummary} />
      </div>

      {/* KPI cards */}
      <SummaryCards summary={tcoSummary} />

      {/* Charts — 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TCOByCategory
          data={tcoSummary?.by_category ?? []}
          onCategoryClick={tcoSummary?.by_category_detail ? setSelectedCategory : undefined}
        />
        <TCOByPersona
          data={tcoSummary?.by_persona ?? []}
          onPersonaClick={(personaName) => setSelectedPersona(personaName)}
        />
      </div>

      {/* Full-width department breakdown */}
      <TCOByDepartment
        data={tcoSummary?.by_domain ?? []}
        onDepartmentClick={handleDeptClick}
      />

      {/* Employee detail table */}
      {tcoSummary?.employee_details?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Employee Cost Detail</h3>
            {deptFilter && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-brand-50 text-brand-700 rounded-full px-3 py-1">
                {deptFilter}
                <button
                  onClick={() => setDeptFilter(null)}
                  className="ml-0.5 text-brand-500 hover:text-brand-700 transition-colors"
                  aria-label="Clear department filter"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Employee</th>
                  <th className="hidden sm:table-cell text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Department</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Persona</th>
                  <th className="hidden lg:table-cell text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Birthright</th>
                  <th className="hidden lg:table-cell text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Persona Cost</th>
                  <th className="hidden md:table-cell text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <span className="flex items-center gap-1">
                      Outliers
                      <QuestionMarkCircleIcon
                        className="w-3.5 h-3.5 text-gray-400 cursor-help"
                        title="Individually approved tools outside this employee's standard role bundle — e.g. a Bloomberg Terminal for one analyst, or a specialised licence approved by their manager."
                      />
                    </span>
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEmployees.map((emp) => (
                  <React.Fragment key={emp.employee_id}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer select-none"
                      onClick={() => handleEmployeeRowClick(emp.employee_id)}
                    >
                      <td className="py-2.5 px-3 font-medium text-gray-900">{emp.employee_name}</td>
                      <td className="hidden sm:table-cell py-2.5 px-3 text-gray-500">{emp.department ?? '—'}</td>
                      <td className="py-2.5 px-3">
                        <span className="badge bg-brand-50 text-brand-700 whitespace-nowrap">{emp.persona_name}</span>
                      </td>
                      <td className="hidden lg:table-cell py-2.5 px-3 text-gray-600">{fmt(emp.birthright_annual)}</td>
                      <td className="hidden lg:table-cell py-2.5 px-3 text-gray-600">{fmt(emp.persona_annual)}</td>
                      <td className="hidden md:table-cell py-2.5 px-3 text-amber-600">{fmt(emp.outlier_annual)}</td>
                      <td className="py-2.5 px-3 font-semibold text-gray-900 whitespace-nowrap">{fmt(emp.total_annual)}</td>
                    </tr>
                    {expandedEmployee === emp.employee_id && (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <EmployeeRowExpand
                            employee={emp}
                            lineItems={employeeLineItems?.[emp.employee_id]}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Persona detail slide-over */}
      <PersonaDetailPanel
        persona={personaDetails?.[selectedPersona]}
        personaName={selectedPersona}
        onClose={() => setSelectedPersona(null)}
      />

      {/* Category drill-down slide-over */}
      <CategoryDrillPanel
        category={selectedCategory}
        items={tcoSummary?.by_category_detail?.[selectedCategory] ?? []}
        categoryTotal={
          tcoSummary?.by_category?.find((c) => c.category === selectedCategory)?.total_annual ?? 0
        }
        onClose={() => setSelectedCategory(null)}
      />
    </div>
  )
}
