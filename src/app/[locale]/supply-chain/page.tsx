import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getRepos, getCompanies, createTargetsRepo } from '@/lib/repositories'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, AlertTriangle, ArrowRight } from 'lucide-react'
import MonthlyChart from '@/components/modules/supply-chain/MonthlyChart'
import type { MonthlyChartDataPoint, CompanySeries } from '@/components/modules/supply-chain/MonthlyChart'

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_ABBR_ZH = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const CHART_YEARS = ['2025', '2026']

export default async function SupplyChainPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('supplyChain')

  const today = new Date('2026-03-01')
  const currentYM = today.toISOString().slice(0, 7) // '2026-03'

  // Load data
  const [companies, targets] = await Promise.all([
    getCompanies(),
    createTargetsRepo().getTargets(),
  ])

  const companyData = await Promise.all(
    companies.map(async (company) => {
      const { financeRepo, salesRepo } = getRepos(company.id)
      const [finance, sales] = await Promise.all([financeRepo.getAll(), salesRepo.getAll()])
      return { company, finance, sales }
    })
  )

  // ── KPI calculations ────────────────────────────────────────────────────────
  const totalInvoiced = companyData.reduce(
    (sum, { finance }) => sum + finance.invoices.reduce((s, inv) => s + inv.total, 0),
    0
  )

  const totalSalesAmount = companyData.reduce(
    (sum, { sales }) => sum + sales.orders.reduce((s, order) => s + order.total, 0),
    0
  )

  const totalAR = companyData.reduce(
    (sum, { finance }) =>
      sum +
      finance.invoices
        .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
        .reduce((s, inv) => s + inv.total, 0),
    0
  )

  const totalAP = companyData.reduce(
    (sum, { finance }) =>
      sum +
      finance.expenses
        .filter((exp) => exp.status === 'pending' || exp.status === 'approved')
        .reduce((s, exp) => s + exp.amount, 0),
    0
  )

  const quotaPct = (totalInvoiced / targets.annualInvoiceQuota) * 100
  const quotaGap = targets.annualInvoiceQuota - totalInvoiced

  // ── Per-company stats ───────────────────────────────────────────────────────
  const perCompany = companyData.map(({ company, finance, sales }) => {
    const compTarget = targets.companies[company.id]
    const achieved = finance.invoices.reduce((s, inv) => s + inv.total, 0)
    const ar = finance.invoices
      .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((s, inv) => s + inv.total, 0)
    const ap = finance.expenses
      .filter((exp) => exp.status === 'pending' || exp.status === 'approved')
      .reduce((s, exp) => s + exp.amount, 0)
    const salesAmount = sales.orders.reduce((s, order) => s + order.total, 0)
    // Monthly threshold and current-month invoiced
    const monthlyThreshold = compTarget ? Math.round(compTarget.annualQuota / 12) : 0
    const monthInvoiced = finance.invoices
      .filter((inv) => inv.issueDate.startsWith(currentYM))
      .reduce((s, inv) => s + inv.total, 0)
    const monthRemaining = Math.max(0, monthlyThreshold - monthInvoiced)
    const monthPct = monthlyThreshold > 0 ? (monthInvoiced / monthlyThreshold) * 100 : 0
    return { company, achieved, ar, ap, compTarget, salesAmount, monthlyThreshold, monthInvoiced, monthRemaining, monthPct }
  })

  // ── Monthly chart data — 24 months (Jan 2025 – Dec 2026) ──
  const invoicesByMonth: Record<string, Record<string, number>> = {}
  companyData.forEach(({ company, finance }) => {
    invoicesByMonth[company.id] = {}
    finance.invoices.forEach((inv) => {
      const ym = inv.issueDate.slice(0, 7)
      invoicesByMonth[company.id][ym] = (invoicesByMonth[company.id][ym] ?? 0) + inv.total
    })
  })

  const COMPANY_COLORS: Record<string, { line: string; ceiling: string }> = {
    'project-creek': { line: '#3b82f6', ceiling: '#93c5fd' },
    'creek-global':  { line: '#10b981', ceiling: '#6ee7b7' },
  }

  const companySeries: CompanySeries[] = companies.map((c) => {
    const compTarget = targets.companies[c.id]
    const colors = COMPANY_COLORS[c.id] ?? { line: '#6b7280', ceiling: '#9ca3af' }
    return {
      id: c.id,
      name: c.name,
      color: colors.line,
      ceilingColor: colors.ceiling,
      annualCeiling: Math.round((compTarget?.annualQuota ?? 0) / 12),
    }
  })

  const isZh = locale === 'zh-CN'
  const monthLabels = isZh ? MONTH_ABBR_ZH : MONTH_ABBR

  // Build 24-month monthly (non-cumulative) data
  const chartData: MonthlyChartDataPoint[] = CHART_YEARS.flatMap((year) =>
    MONTH_ABBR.map((_, mi) => {
      const ym = `${year}-${String(mi + 1).padStart(2, '0')}`
      const isPast = ym <= currentYM
      const label = isZh
        ? `${year.slice(2)}年${monthLabels[mi]}`
        : `${monthLabels[mi]} '${year.slice(2)}`
      const point: MonthlyChartDataPoint = { month: label }
      companySeries.forEach((c) => {
        point[c.id] = isPast ? Math.round(invoicesByMonth[c.id]?.[ym] ?? 0) : null
      })
      return point
    })
  )

  // ── Overdue collections ─────────────────────────────────────────────────────
  type OverdueRow = {
    number: string
    customerName: string
    total: number
    dueDate: string
    overdueDays: number
    companyName: string
    responsible: string
  }

  const overdueRows: OverdueRow[] = []
  companyData.forEach(({ company, finance }) => {
    const compTarget = targets.companies[company.id]
    const responsible = compTarget?.collectionResponsible?.name ?? '—'
    finance.invoices
      .filter((inv) => inv.status === 'overdue')
      .forEach((inv) => {
        const due = new Date(inv.dueDate)
        const overdueDays = Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86400000))
        overdueRows.push({
          number: inv.number,
          customerName: inv.customerName,
          total: inv.total,
          dueDate: inv.dueDate,
          overdueDays,
          companyName: company.name,
          responsible,
        })
      })
  })
  overdueRows.sort((a, b) => b.overdueDays - a.overdueDays)

  // ── Threshold alerts ─────────────────────────────────────────────────────
  const THRESHOLD_WARN_PCT = 75
  const thresholdAlerts = perCompany
    .filter(({ monthPct }) => monthPct >= THRESHOLD_WARN_PCT)
    .map(({ company, monthlyThreshold, monthInvoiced, monthRemaining, monthPct }) => ({
      companyId: company.id,
      companyName: company.name,
      monthlyThreshold,
      invoiced: monthInvoiced,
      remaining: monthRemaining,
      pct: monthPct,
      critical: monthPct >= 90,
    }))

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('description')}</p>
        </div>

        {/* Row 1 — 6 KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <KpiCard label={t('kpi.totalInvoiced')} value={formatCurrency(totalInvoiced)} />
          <KpiCard label={t('kpi.salesAmount')} value={formatCurrency(totalSalesAmount)} />
          <KpiCard label={t('kpi.ar')} value={formatCurrency(totalAR)} highlight={totalAR > 0 ? 'warn' : 'ok'} />
          <KpiCard label={t('kpi.ap')} value={formatCurrency(totalAP)} />
          <KpiCard
            label={t('kpi.quotaPct')}
            value={`${quotaPct.toFixed(1)}%`}
            highlight={quotaPct >= 100 ? 'ok' : quotaPct >= 70 ? 'neutral' : 'warn'}
          />
          <KpiCard
            label={t('kpi.quotaGap')}
            value={formatCurrency(Math.max(0, quotaGap))}
            highlight={quotaGap <= 0 ? 'ok' : 'warn'}
          />
        </div>

        {/* Row 2 — Alerts panel */}
        {overdueRows.length > 0 || thresholdAlerts.length > 0 ? (
          <div className="mb-6 rounded-xl overflow-hidden border border-red-200 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-3 bg-red-50 border-b border-red-200">
              <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
              <span className="font-semibold text-red-800 text-sm">{t('alerts.title')}</span>
              <span className="ml-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 border border-red-200">
                {overdueRows.length + thresholdAlerts.length}
              </span>
            </div>

            {/* Threshold warning rows */}
            {thresholdAlerts.map((alert) => (
              <div key={alert.companyId} className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 border-b border-gray-100 last:border-0 ${alert.critical ? 'bg-red-50' : 'bg-amber-50'}`}>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border whitespace-nowrap ${alert.critical ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                  ⚠ {t('alerts.sectionThreshold')}
                </span>
                <span className="text-sm text-gray-800">
                  <span className="font-semibold">{alert.companyName}</span>
                  {' — '}{alert.pct.toFixed(1)}% {t('alerts.thresholdReached')}
                </span>
                <span className="text-sm text-gray-500 ml-auto">
                  {formatCurrency(alert.invoiced)} / {formatCurrency(alert.monthlyThreshold)}
                </span>
                <span className={`text-sm font-medium whitespace-nowrap ${alert.critical ? 'text-red-700' : 'text-amber-700'}`}>
                  {formatCurrency(alert.remaining)} {t('alerts.remaining')}
                </span>
              </div>
            ))}

            {/* AR overdue rows */}
            {overdueRows.map((row) => (
              <div key={row.number} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 bg-white border-b border-gray-100 last:border-0">
                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 border border-red-200 whitespace-nowrap">
                  ⚡ {t('alerts.sectionAr')}
                </span>
                <span className="font-mono text-xs text-gray-400">{row.number}</span>
                <span className="text-sm font-semibold text-gray-900">{row.customerName}</span>
                <span className="text-xs text-gray-400">{row.companyName}</span>
                <span className="text-sm font-semibold text-gray-900 ml-auto">{formatCurrency(row.total)}</span>
                <span className="text-xs font-medium text-red-600 whitespace-nowrap">{row.overdueDays} {t('alerts.daysOverdue')}</span>
                <span className="text-xs text-gray-400">{row.responsible}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-6 flex items-center gap-2 px-5 py-3 bg-green-50 rounded-xl border border-green-200 text-sm text-green-700 font-medium">
            <span>✓</span>
            <span>{t('alerts.noAlerts')}</span>
          </div>
        )}

        {/* Row 3 — Per-company detail cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {perCompany.map(({ company, achieved, ar, ap, compTarget, salesAmount, monthlyThreshold, monthInvoiced, monthRemaining, monthPct }) => (
            <Link
              key={company.id}
              href={`/companies/${company.id}/dashboard` as `/companies/${string}/dashboard`}
              className="block bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 text-sm">{company.name}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 capitalize">{company.industry}</span>
                  <ArrowRight size={14} className="text-gray-300" />
                </div>
              </div>

              {compTarget && (() => {
                const barColor = monthPct >= 90 ? 'bg-red-500' : monthPct >= 70 ? 'bg-amber-400' : 'bg-blue-500'
                const pctColor = monthPct >= 90 ? 'text-red-600 font-semibold' : monthPct >= 70 ? 'text-amber-600 font-semibold' : 'text-gray-500'
                return (
                  <>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{t('perCompany.monthlyThreshold')}: {formatCurrency(monthlyThreshold)}</span>
                      <span className={pctColor}>
                        {monthPct >= 90 && '⚠️ '}{monthPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                      <div
                        className={`${barColor} h-2 rounded-full transition-all`}
                        style={{ width: `${Math.min(monthPct, 100).toFixed(1)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mb-3">
                      <span className="text-gray-400">{t('perCompany.monthRemaining')}: {formatCurrency(monthRemaining)}</span>
                      <span className="text-gray-400">{t('perCompany.monthInvoiced')}: {formatCurrency(monthInvoiced)}</span>
                    </div>
                  </>
                )
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-amber-50 px-3 py-2">
                  <p className="text-xs text-amber-600">{t('perCompany.ar')}</p>
                  <p className="text-sm font-semibold text-amber-900">{formatCurrency(ar)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-400">{t('perCompany.ap')}</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(ap)}</p>
                </div>
                <div className="rounded-lg bg-blue-50 px-3 py-2">
                  <p className="text-xs text-blue-600">{t('perCompany.totalInvoiced')}</p>
                  <p className="text-sm font-semibold text-blue-900">{formatCurrency(achieved)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-400">{t('perCompany.salesAmount')}</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(salesAmount)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Row 4 — Monthly chart */}
        <div className="mb-6">
          <MonthlyChart data={chartData} companies={companySeries} mode="monthly" />
        </div>
      </div>
    </div>
  )
}

// ── Helper component ──────────────────────────────────────────────────────────
type Highlight = 'ok' | 'warn' | 'neutral' | undefined

function KpiCard({
  label,
  value,
  unit,
  highlight,
}: {
  label: string
  value: string
  unit?: string
  highlight?: Highlight
}) {
  const bgColor =
    highlight === 'ok'
      ? 'bg-green-50 border-green-100'
      : highlight === 'warn'
        ? 'bg-amber-50 border-amber-100'
        : 'bg-white border-gray-200'

  const valueColor =
    highlight === 'ok'
      ? 'text-green-800'
      : highlight === 'warn'
        ? 'text-amber-800'
        : 'text-gray-900'

  const Icon =
    highlight === 'ok' ? TrendingUp : highlight === 'warn' ? TrendingDown : null

  return (
    <div className={`rounded-xl border shadow-sm p-4 ${bgColor}`}>
      <p className="text-xs text-gray-400 mb-1 leading-tight">{label}</p>
      <div className="flex items-end gap-1">
        <p className={`text-lg font-bold leading-tight ${valueColor}`}>{value}</p>
        {unit && <span className="text-xs text-gray-400 mb-0.5">{unit}</span>}
      </div>
      {Icon && (
        <Icon
          size={12}
          className={`mt-1 ${highlight === 'ok' ? 'text-green-500' : 'text-amber-500'}`}
        />
      )}
    </div>
  )
}
