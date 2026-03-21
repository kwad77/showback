import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

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

export default function TCOByDepartment({ data = [], onDepartmentClick }) {
  if (!data.length) {
    return (
      <div className="card flex items-center justify-center h-64 text-gray-400 text-sm">
        No department data yet — add employees with departments assigned.
      </div>
    )
  }

  const chartData = [...data]
    .sort((a, b) => b.total_annual - a.total_annual)
    .slice(0, 12)
    .map((d) => ({ ...d, name: d.department }))

  const handleBarClick = (barData) => {
    if (barData?.department) onDepartmentClick?.(barData.department)
  }

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">TCO by Department</h3>
        <p className="text-xs text-gray-400 mt-0.5">Click a bar to filter the employee table by department</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 12 }} style={{ cursor: 'pointer' }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          <XAxis
            type="number"
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={80}
            tick={{ fontSize: 10 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f3ff' }} />
          <Bar
            dataKey="total_annual"
            fill="#6366f1"
            radius={[0, 4, 4, 0]}
            cursor="pointer"
            onClick={handleBarClick}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
