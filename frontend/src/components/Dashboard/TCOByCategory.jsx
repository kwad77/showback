import { useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector
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
      <p className="text-xs text-brand-600 mt-1">Click to drill down</p>
    </div>
  )
}

const renderActiveShape = (props) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, value,
  } = props
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#111827" className="text-sm font-semibold" fontSize={13} fontWeight={600}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#6b7280" fontSize={12}>
        {fmt(value)}
      </text>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  )
}

export default function TCOByCategory({ data = [], onCategoryClick }) {
  const [activeIndex, setActiveIndex] = useState(null)

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

  const handleClick = (_, index) => {
    if (onCategoryClick) onCategoryClick(chartData[index].name)
  }

  return (
    <div className="card">
      <div className="mb-1">
        <h3 className="text-base font-semibold text-gray-900">TCO by Category</h3>
        {onCategoryClick && (
          <p className="text-xs text-gray-400 mt-0.5">Click a slice to see which tools drive that spend</p>
        )}
      </div>
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
            cursor={onCategoryClick ? 'pointer' : 'default'}
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            onClick={handleClick}
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
