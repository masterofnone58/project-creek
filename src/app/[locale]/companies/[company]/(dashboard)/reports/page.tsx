import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import { getRepos } from '@/lib/repositories'
import { formatCurrency } from '@/lib/utils'

interface Props {
  params: Promise<{ company: string }>
}

export default async function ReportsPage({ params }: Props) {
  const { company } = await params
  const t = await getTranslations('reports')
  const { financeRepo, salesRepo, inventoryRepo, productionRepo, hrRepo } = getRepos(company)

  const [finance, sales, inventory, production, hr] = await Promise.all([
    financeRepo.getAll(),
    salesRepo.getAll(),
    inventoryRepo.getAll(),
    productionRepo.getAll(),
    hrRepo.getAll(),
  ])

  const paidInvoices = finance.invoices.filter((i) => i.status === 'paid')
  const totalRevenue = paidInvoices.reduce((s, i) => s + i.total, 0)
  const totalExpenses = finance.expenses
    .filter((e) => ['paid', 'approved'].includes(e.status))
    .reduce((s, e) => s + e.amount, 0)
  const grossProfit = totalRevenue - totalExpenses

  const wonDeals = sales.deals.filter((d) => d.stage === 'won')
  const closedDeals = sales.deals.filter((d) => ['won', 'lost'].includes(d.stage))
  const winRate = closedDeals.length > 0 ? (wonDeals.length / closedDeals.length) * 100 : 0

  const completedOrders = production.orders.filter((o) => o.status === 'completed')

  const expenseByCategory = finance.expenses.reduce<Record<string, number>>((acc, exp) => {
    if (exp.status === 'paid' || exp.status === 'approved') {
      acc[exp.category] = (acc[exp.category] ?? 0) + exp.amount
    }
    return acc
  }, {})

  return (
    <div>
      <Header title={t('title')} description={t('description')} />
      <div className="p-8 space-y-8">
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t('financialSummary')}</h2>
          <div className="grid grid-cols-3 gap-5">
            <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">{t('totalRevenue')}</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-gray-400 mt-1">{t('paidInvoices', { count: paidInvoices.length })}</p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">{t('totalExpenses')}</p>
              <p className="mt-1 text-2xl font-bold text-red-500">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">{t('grossProfit')}</p>
              <p className={`mt-1 text-2xl font-bold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(grossProfit)}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t('expensesByCategory')}</h2>
          <div className="rounded-lg bg-white border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {(['category', 'amount', 'pct'] as const).map((k) => (
                    <th key={k} className={`px-4 py-3 font-medium text-gray-600 ${k === 'category' ? 'text-left' : 'text-right'}`}>
                      {t(`categoryTable.${k}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(expenseByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => (
                    <tr key={category}>
                      <td className="px-4 py-3 capitalize text-gray-900">{category}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(amount)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : '0'}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-5">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">{t('salesPerformance')}</h2>
            <div className="rounded-lg bg-white border border-gray-200 p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('salesStats.totalCustomers')}</span>
                <span className="font-medium">{sales.customers.filter((c) => c.type === 'customer').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('salesStats.dealsWon')}</span>
                <span className="font-medium text-green-600">{wonDeals.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('salesStats.winRate')}</span>
                <span className="font-medium">{winRate.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('salesStats.wonDealValue')}</span>
                <span className="font-medium">{formatCurrency(wonDeals.reduce((s, d) => s + d.value, 0))}</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">{t('operationsSummary')}</h2>
            <div className="rounded-lg bg-white border border-gray-200 p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('opsStats.productionOrders')}</span>
                <span className="font-medium">{production.orders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('opsStats.completedOrders')}</span>
                <span className="font-medium text-green-600">{completedOrders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('opsStats.totalSkus')}</span>
                <span className="font-medium">{inventory.products.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('opsStats.activeEmployees')}</span>
                <span className="font-medium">{hr.employees.filter((e) => e.status === 'active').length}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
