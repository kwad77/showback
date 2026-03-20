import { CurrencyDollarIcon, UsersIcon, ChartPieIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

function Card({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function SummaryCards({ summary }) {
  if (!summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card animate-pulse h-24 bg-gray-100" />
        ))}
      </div>
    )
  }

  const cards = [
    {
      icon: CurrencyDollarIcon,
      label: 'Total Annual TCO',
      value: fmt(summary.total_annual_tco),
      sub: `Across ${summary.total_employees} employees`,
      color: 'bg-brand-500',
    },
    {
      icon: UsersIcon,
      label: 'Avg Cost / Employee',
      value: fmt(summary.avg_tco_per_employee),
      sub: 'Per year',
      color: 'bg-emerald-500',
    },
    {
      icon: ChartPieIcon,
      label: 'Birthright Total',
      value: fmt(summary.birthright_total),
      sub: `${summary.total_employees ? Math.round(summary.birthright_total / summary.total_annual_tco * 100) : 0}% of TCO`,
      color: 'bg-violet-500',
    },
    {
      icon: ExclamationTriangleIcon,
      label: 'Outlier Adjustments',
      value: fmt(summary.outlier_total),
      sub: `${summary.total_employees ? Math.round(summary.outlier_total / summary.total_annual_tco * 100) : 0}% of TCO`,
      color: 'bg-amber-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => <Card key={c.label} {...c} />)}
    </div>
  )
}
