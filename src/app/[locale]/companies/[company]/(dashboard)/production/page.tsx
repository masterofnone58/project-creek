import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import { getRepos } from '@/lib/repositories'
import { formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

interface Props {
  params: Promise<{ locale: string; company: string }>
}

export default async function ProductionPage({ params }: Props) {
  const { locale, company } = await params
  setRequestLocale(locale)
  const [t, ts] = await Promise.all([
    getTranslations('production'),
    getTranslations('status'),
  ])
  const { productionRepo } = getRepos(company)
  const { orders } = await productionRepo.getAll()

  const byStatus = {
    planned: orders.filter((o) => o.status === 'planned').length,
    in_progress: orders.filter((o) => o.status === 'in_progress').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  }

  return (
    <div>
      <Header title={t('title')} description={t('description')} />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-3 gap-5">
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">{t('inProgress')}</p>
            <p className="mt-1 text-2xl font-bold text-yellow-600">{byStatus.in_progress}</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">{t('planned')}</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{byStatus.planned}</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">{t('completed')}</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{byStatus.completed}</p>
          </div>
        </div>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t('productionOrders')}</h2>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-lg bg-white border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{order.orderNumber}</span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? ''}`}>
                        {ts(order.status as Parameters<typeof ts>[0])}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">
                      {order.productName} — <span className="font-medium">{order.quantity} {order.unit}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.endDate
                        ? t('orderInfo', { startDate: formatDate(order.startDate), endDate: formatDate(order.endDate) })
                        : t('orderInfoNoEnd', { startDate: formatDate(order.startDate) })}
                      {order.assignedTo && ` · ${order.assignedTo}`}
                    </p>
                  </div>
                </div>

                {order.bom.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">{t('billOfMaterials')}</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {order.bom.map((item, i) => (
                        <div key={i} className="rounded bg-gray-50 px-3 py-2 text-xs">
                          <span className="font-medium text-gray-700">{item.productName}</span>
                          <span className="text-gray-500 ml-1">× {item.quantity} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
