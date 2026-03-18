import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import { getRepos } from '@/lib/repositories'
import { formatCurrency } from '@/lib/utils'

interface Props {
  params: Promise<{ company: string }>
}

export default async function DashboardPage({ params }: Props) {
  const { company } = await params
  const t = await getTranslations('dashboard')
  const { financeRepo, salesRepo, inventoryRepo, productionRepo, hrRepo } = getRepos(company)

  const [finance, sales, inventory, production, hr] = await Promise.all([
    financeRepo.getAll(),
    salesRepo.getAll(),
    inventoryRepo.getAll(),
    productionRepo.getAll(),
    hrRepo.getAll(),
  ])

  const totalRevenue = finance.invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0)

  const openInvoices = finance.invoices.filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
  const openInvoicesValue = openInvoices.reduce((sum, inv) => sum + inv.total, 0)
  const lowStockProducts = inventory.products.filter((p) => p.stockQuantity <= p.reorderLevel)
  const activeOrders = production.orders.filter((o) => o.status === 'in_progress')
  const activeEmployees = hr.employees.filter((e) => e.status === 'active')
  const openDeals = sales.deals.filter((d) => !['won', 'lost'].includes(d.stage))

  const kpis = [
    { label: t('kpi.revenue'), value: formatCurrency(totalRevenue), sub: t('kpi.revenueSub') },
    { label: t('kpi.outstanding'), value: formatCurrency(openInvoicesValue), sub: `${openInvoices.length}` },
    { label: t('kpi.openDeals'), value: openDeals.length.toString(), sub: t('kpi.openDealsSub') },
    { label: t('kpi.lowStock'), value: lowStockProducts.length.toString(), sub: t('kpi.lowStockSub') },
    { label: t('kpi.activeProduction'), value: activeOrders.length.toString(), sub: t('kpi.activeProductionSub') },
    { label: t('kpi.activeEmployees'), value: activeEmployees.length.toString(), sub: t('kpi.activeEmployeesSub', { count: hr.departments.length }) },
  ]

  return (
    <div>
      <Header title={t('title')} description={t('description')} />
      <div className="p-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-500">{kpi.label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{kpi.value}</p>
              <p className="mt-1 text-xs text-gray-400">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {lowStockProducts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-base font-semibold text-gray-900 mb-3">{t('lowStockAlerts')}</h2>
            <div className="rounded-lg bg-white border border-amber-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-amber-50">
                  <tr>
                    {(['product', 'sku', 'stock', 'reorderLevel'] as const).map((k) => (
                      <th key={k} className="px-4 py-3 text-left font-medium text-gray-600">
                        {t(`lowStockTable.${k}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lowStockProducts.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500">{p.sku}</td>
                      <td className="px-4 py-3 text-right text-red-600 font-medium">{p.stockQuantity}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{p.reorderLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
