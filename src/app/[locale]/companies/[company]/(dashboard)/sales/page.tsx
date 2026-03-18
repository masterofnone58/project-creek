import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import { getRepos } from '@/lib/repositories'
import { formatCurrency, formatDate } from '@/lib/utils'

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-600',
  qualified: 'bg-blue-100 text-blue-700',
  proposal: 'bg-purple-100 text-purple-700',
  negotiation: 'bg-yellow-100 text-yellow-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

interface Props {
  params: Promise<{ company: string }>
}

export default async function SalesPage({ params }: Props) {
  const { company } = await params
  const [t, ts] = await Promise.all([
    getTranslations('sales'),
    getTranslations('status'),
  ])
  const { salesRepo } = getRepos(company)
  const { customers, deals, orders } = await salesRepo.getAll()

  const activeCustomers = customers.filter((c) => c.type === 'customer').length
  const openDeals = deals.filter((d) => !['won', 'lost'].includes(d.stage))
  const pipelineValue = openDeals.reduce((s, d) => s + d.value * (d.probability / 100), 0)

  return (
    <div>
      <Header title={t('title')} description={t('description')} />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-3 gap-5">
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">{t('activeCustomers')}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{activeCustomers}</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">{t('openDeals')}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{openDeals.length}</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">{t('weightedPipeline')}</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{formatCurrency(pipelineValue)}</p>
          </div>
        </div>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t('dealsPipeline')}</h2>
          <div className="rounded-lg bg-white border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {(['deal', 'customer', 'stage', 'probability', 'value', 'assignedTo', 'closeDate'] as const).map((k) => (
                    <th key={k} className="px-4 py-3 text-left font-medium text-gray-600">
                      {t(`dealsTable.${k}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deals.map((deal) => (
                  <tr key={deal.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{deal.title}</td>
                    <td className="px-4 py-3 text-gray-700">{deal.customerName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_COLORS[deal.stage] ?? ''}`}>
                        {ts(deal.stage as Parameters<typeof ts>[0])}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{deal.probability}%</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(deal.value)}</td>
                    <td className="px-4 py-3 text-gray-500">{deal.assignedTo ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t('salesOrders')}</h2>
          <div className="rounded-lg bg-white border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {(['orderNo', 'customer', 'orderDate', 'status', 'total'] as const).map((k) => (
                    <th key={k} className="px-4 py-3 text-left font-medium text-gray-600">
                      {t(`ordersTable.${k}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-gray-700">{order.customerName}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(order.orderDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status] ?? ''}`}>
                        {ts(order.status as Parameters<typeof ts>[0])}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t('customers')}</h2>
          <div className="rounded-lg bg-white border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {(['name', 'company', 'type', 'email', 'since'] as const).map((k) => (
                    <th key={k} className="px-4 py-3 text-left font-medium text-gray-600">
                      {t(`customersTable.${k}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-700">{c.company ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{ts(c.type as Parameters<typeof ts>[0])}</td>
                    <td className="px-4 py-3 text-gray-500">{c.email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
