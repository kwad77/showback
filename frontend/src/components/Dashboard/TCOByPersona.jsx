import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-1">{label}</p>
      <p className="text-gray-600">Total: {fmt(d.total_annual)}</p>
      <p className="text-gray-500">{d.employee_count} employees</p>
      <p className="text-gray-400">Avg: {fmt(d.avg_per_employee)} / person</p>
    </div>
  )
}

export default function TCOByPersona({ data = [], onPersonaClick }) {
  if (!data.length) {
    return (
      <div className="card flex items-center justify-center h-64 text-gray-400 text-sm">
        No persona data yet — create personas and assign employees.
      </div>
    )
  }

  const chartData = data.map((d) => ({ ...d, name: d.persona_name }))

  const handleBarClick = (chartPayload) => {
    const personaName = chartPayload?.activePayload?.[0]?.payload?.persona_name
    if (personaName) onPersonaClick?.(personaName)
  }

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">TCO by Persona</h3>
        <p className="text-xs text-gray-400 mt-0.5">Click a bar to drill down into that persona</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ left: 8, right: 16, bottom: 16 }} onClick={handleBarClick} style={{ cursor: 'pointer' }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f3ff' }} />
          <Bar dataKey="total_annual" radius={[4, 4, 0, 0]} cursor="pointer">
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
