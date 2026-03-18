'use client'

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useTranslations } from 'next-intl'

export interface CompanySeries {
  id: string
  name: string
  color: string
  ceilingColor: string
  annualCeiling: number
}

export interface MonthlyChartDataPoint {
  month: string
  [key: string]: number | string | null
}

interface Props {
  data: MonthlyChartDataPoint[]
  companies: CompanySeries[]
  mode?: 'cumulative' | 'monthly'
}

function formatM(value: number) {
  if (value >= 1000000) return `¥${(value / 1000000).toFixed(2)}M`
  if (value >= 1000) return `¥${(value / 1000).toFixed(0)}K`
  return `¥${value}`
}

export default function MonthlyChart({ data, companies, mode = 'cumulative' }: Props) {
  const t = useTranslations('supplyChain.chart')

  const nameMap: Record<string, string> = {}
  companies.forEach((c) => { nameMap[c.id] = c.name })

  const maxCeiling = Math.max(...companies.map((c) => c.annualCeiling))

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-1">{t('title')}</h2>
      <p className="text-xs text-gray-400 mb-4">{t('subtitle')}</p>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            interval={mode === 'monthly' ? 1 : 0}
          />
          <YAxis
            tickFormatter={formatM}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            width={60}
            domain={[0, Math.ceil(maxCeiling * 1.1)]}
          />
          <Tooltip
            formatter={(value, name) => [
              typeof value === 'number' ? `¥${value.toLocaleString('en-US')}` : '—',
              nameMap[String(name)] ?? String(name),
            ]}
            labelStyle={{ fontWeight: 600 }}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
          />
          <Legend
            formatter={(value) => nameMap[value] ?? value}
            wrapperStyle={{ fontSize: 12 }}
          />

          {mode === 'monthly'
            ? companies.map((c) => (
                <Bar
                  key={c.id}
                  dataKey={c.id}
                  name={c.id}
                  fill={c.color}
                  radius={[2, 2, 0, 0]}
                  maxBarSize={18}
                />
              ))
            : companies.map((c) => (
                <Line
                  key={c.id}
                  dataKey={c.id}
                  name={c.id}
                  type="monotone"
                  stroke={c.color}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: c.color }}
                  activeDot={{ r: 5 }}
                />
              ))}

          {companies.map((c) => (
              <ReferenceLine
                key={`${c.id}-ceiling`}
                y={c.annualCeiling}
                stroke={c.ceilingColor}
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{
                  value: `${c.name.split(' ')[0]} ${t('ceiling')}`,
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: c.ceilingColor,
                }}
              />
            ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
