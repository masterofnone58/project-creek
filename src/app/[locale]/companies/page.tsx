import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getCompanies, getRepos, createTargetsRepo } from '@/lib/repositories'
import { Building2, ArrowRight } from 'lucide-react'
import { MonthlyRevenueChart } from '@/components/modules/companies/MonthlyRevenueChart'

const INDUSTRY_COLORS: Record<string, string> = {
  Manufacturing: 'bg-blue-50 text-blue-700 border-blue-200',
  Trading: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const CHART_YEARS = ['2025', '2026']
// 24 labels: "Jan '25" … "Dec '26"
const CHART_MONTHS = CHART_YEARS.flatMap((y) =>
  MONTH_LABELS.map((m) => `${m} '${y.slice(2)}`)
)

function fmt(n: number) {
  return '¥' + n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function rateColor(rate: number) {
  if (rate >= 1) return 'text-emerald-600 font-semibold'
  if (rate >= 0.8) return 'text-amber-600 font-semibold'
  return 'text-red-600 font-semibold'
}

export default async function CompaniesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('companies')

  const companies = await getCompanies()
  const targetsRepo = createTargetsRepo()
  const targets = await targetsRepo.getTargets()

  const CURRENT_YEAR = targets.year.toString()
  const HISTORY_YEARS = Object.keys(targets.history ?? {}).sort()
  const ALL_YEARS = [...HISTORY_YEARS, CURRENT_YEAR]

  const companySummaries = await Promise.all(
    companies.map(async (company) => {
      const { financeRepo, hrRepo } = getRepos(company.id)
      const [finance, hr] = await Promise.all([financeRepo.getAll(), hrRepo.getAll()])

      // Compute invoiced total per year
      const invoicedByYear: Record<string, number> = {}
      for (const inv of finance.invoices) {
        const year = inv.issueDate.split('-')[0]
        invoicedByYear[year] = (invoicedByYear[year] ?? 0) + inv.total
      }

      // Compute monthly invoice totals keyed by "YYYY-MM"
      const monthlyByYM: Record<string, number> = {}
      for (const inv of finance.invoices) {
        const ym = inv.issueDate.slice(0, 7) // "YYYY-MM"
        monthlyByYM[ym] = (monthlyByYM[ym] ?? 0) + inv.total
      }

      const revenue = Object.values(invoicedByYear).reduce((a, b) => a + b, 0)
      const activeEmployees = hr.employees.filter((e) => e.status === 'active').length
      const invoiceQuota = targets.companies[company.id]?.annualQuota ?? 0

      return { ...company, revenue, activeEmployees, invoiceQuota, invoicedByYear, monthlyByYM }
    })
  )

  // Build quota rows: per company, per year: { invoiced, quota, rate }
  const quotaRows = companySummaries.map((company) => {
    const years = ALL_YEARS.map((year) => {
      const invoiced = company.invoicedByYear[year] ?? 0
      const quota =
        year === CURRENT_YEAR
          ? (targets.companies[company.id]?.annualQuota ?? 0)
          : (targets.history?.[year]?.companies?.[company.id]?.annualQuota ?? 0)
      const rate = quota > 0 ? invoiced / quota : 0
      return { year, invoiced, quota, rate }
    })
    return { id: company.id, name: company.name, years }
  })

  // Build 24-month chart data (Jan 2025 – Dec 2026)
  const chartData = CHART_YEARS.flatMap((year, yi) =>
    MONTH_LABELS.map((_, mi) => {
      const ym = `${year}-${String(mi + 1).padStart(2, '0')}`
      const row: { month: string; [key: string]: number | string } = {
        month: CHART_MONTHS[yi * 12 + mi],
      }
      for (const c of companySummaries) {
        row[c.id] = c.monthlyByYM[ym] ?? 0
      }
      return row
    })
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('description')}</p>
        </div>

        {/* Company cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {companySummaries.map((company) => (
            <div
              key={company.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Building2 size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900 text-base">{company.name}</h2>
                      <span
                        className={`inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full border font-medium ${
                          INDUSTRY_COLORS[company.industry] ?? 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        {company.industry}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-sm text-gray-500">{company.description}</p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-xs text-gray-400">{t('revenue')}</p>
                    <p className="text-sm font-semibold text-gray-900">{fmt(company.revenue)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-xs text-gray-400">{t('employees')}</p>
                    <p className="text-sm font-semibold text-gray-900">{company.activeEmployees}</p>
                  </div>
                  <div className="col-span-2 rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-xs text-gray-400">{t('invoiceQuota')}</p>
                    <p className="text-sm font-semibold text-gray-900">{fmt(company.invoiceQuota)}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100">
                <Link
                  href={`/companies/${company.id}/dashboard` as `/companies/${string}/dashboard`}
                  className="flex items-center justify-between text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {t('openDashboard')}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Quota vs Invoiced table */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">{t('quotaTableTitle')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('quotaTableCompany')}
                  </th>
                  {ALL_YEARS.map((year) => (
                    <>
                      <th key={`${year}-inv`} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {year} {t('quotaTableInvoiced')}
                      </th>
                      <th key={`${year}-quota`} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {year} {t('quotaTableQuota')}
                      </th>
                      <th key={`${year}-rate`} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {year} {t('quotaTableRate')}
                      </th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotaRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{row.name}</td>
                    {row.years.map((y) => (
                      <>
                        <td key={`${y.year}-inv`} className="px-4 py-4 text-right text-gray-700">{fmt(y.invoiced)}</td>
                        <td key={`${y.year}-quota`} className="px-4 py-4 text-right text-gray-500">{fmt(y.quota)}</td>
                        <td key={`${y.year}-rate`} className={`px-4 py-4 text-right ${rateColor(y.rate)}`}>
                          {(y.rate * 100).toFixed(1)}%
                        </td>
                      </>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly revenue chart */}
        <div className="mt-8">
          <MonthlyRevenueChart
            data={chartData}
            companies={companies.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
          />
        </div>
      </div>
    </div>
  )
}
