import { useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import SummaryCards from './SummaryCards.jsx'
import TCOByCategory from './TCOByCategory.jsx'
import TCOByDepartment from './TCOByDepartment.jsx'
import TCOByPersona from './TCOByPersona.jsx'
import ExportPDF from '../Reports/ExportPDF.jsx'

export default function Dashboard() {
  const { tcoSummary, refreshTCO } = useApp()

  useEffect(() => {
    refreshTCO()
  }, [refreshTCO])

  return (
    <div className="space-y-6">
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
        <TCOByCategory  data={tcoSummary?.by_category  ?? []} />
        <TCOByPersona   data={tcoSummary?.by_persona   ?? []} />
      </div>

      {/* Full-width department breakdown */}
      <TCOByDepartment data={tcoSummary?.by_domain ?? []} />

      {/* Employee detail table */}
      {tcoSummary?.employee_details?.length > 0 && (
        <div className="card overflow-hidden">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Employee Cost Detail</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Employee', 'Department', 'Persona', 'Birthright', 'Persona Cost', 'Outliers', 'Total Annual'].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tcoSummary.employee_details.map((emp) => (
                  <tr key={emp.employee_id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium text-gray-900">{emp.employee_name}</td>
                    <td className="py-2.5 px-3 text-gray-500">{emp.department ?? '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className="badge bg-brand-50 text-brand-700">{emp.persona_name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">${emp.birthright_annual.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-gray-600">${emp.persona_annual.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-amber-600">${emp.outlier_annual.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-semibold text-gray-900">${emp.total_annual.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
