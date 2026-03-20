import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { name, value, payload: p } = payload[0]
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900">{name}</p>
      <p className="text-gray-600">{fmt(value)}</p>
      <p className="text-gray-400">{p.percentage}%</p>
    </div>
  )
}

export default function TCOByCategory({ data = [] }) {
  const chartData = data.map((d) => ({
    name: d.category,
    value: d.total_annual,
    percentage: d.percentage,
  }))

  if (!chartData.length) {
    return (
      <div className="card flex items-center justify-center h-64 text-gray-400 text-sm">
        No category data yet — upload cost objects to see this chart.
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-base font-semibold text-gray-900 mb-4">TCO by Category</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
