'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { useTranslations } from 'next-intl'

interface MonthlyData {
  month: string
  [companyId: string]: number | string
}

interface Company {
  id: string
  name: string
  color: string
}

interface Props {
  data: MonthlyData[]
  companies: Company[]
}

const COLORS: Record<string, string> = {
  'project-creek': '#3b82f6',
  'creek-global': '#10b981',
}

function formatYAxis(value: number) {
  if (value >= 1000000) return `¥¥{(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `¥¥{(value / 1000).toFixed(0)}K`
  return `¥¥{value}`
}

function formatTooltip(value: number | undefined) {
  if (value == null) return '¥0'
  return `¥¥{value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function MonthlyRevenueChart({ data, companies }: Props) {
  const t = useTranslations('companies')

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-5">{t('monthlyRevenueTitle')}</h2>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={60} />
          <Tooltip
            formatter={(value, name) => [formatTooltip(value as number | undefined), name as string]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
          {companies.map((c) => (
            <Line
              key={c.id}
              type="monotone"
              dataKey={c.id}
              name={c.name}
              stroke={COLORS[c.id] ?? '#6b7280'}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
