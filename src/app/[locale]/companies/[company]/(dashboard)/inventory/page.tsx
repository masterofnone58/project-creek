import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import { getRepos } from '@/lib/repositories'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Props {
  params: Promise<{ locale: string; company: string }>
}

export default async function InventoryPage({ params }: Props) {
  const { locale, company } = await params
  setRequestLocale(locale)
  const t = await getTranslations('inventory')
  const { inventoryRepo } = getRepos(company)
  const { products, movements } = await inventoryRepo.getAll()

  const lowStock = products.filter((p) => p.stockQuantity <= p.reorderLevel)
  const totalStockValue = products.reduce((s, p) => s + p.stockQuantity * p.costPrice, 0)

  return (
    <div>
      <Header title={t('title')} description={t('description')} />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-3 gap-5">
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">{t('totalProducts')}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{products.length}</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">{t('stockValue')}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(totalStockValue)}</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">{t('lowStockAlerts')}</p>
            <p className={`mt-1 text-2xl font-bold ${lowStock.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {lowStock.length}
            </p>
          </div>
        </div>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t('products')}</h2>
          <div className="rounded-lg bg-white border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {(['sku', 'product', 'category', 'stock', 'reorderLevel', 'cost', 'sellPrice'] as const).map((k) => (
                    <th key={k} className="px-4 py-3 text-left font-medium text-gray-600">
                      {t(`productsTable.${k}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => {
                  const isLow = p.stockQuantity <= p.reorderLevel
                  return (
                    <tr key={p.id} className={isLow ? 'bg-red-50' : ''}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500">{p.category}</td>
                      <td className={`px-4 py-3 font-medium ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                        {p.stockQuantity} {p.unit}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{p.reorderLevel}</td>
                      <td className="px-4 py-3 text-gray-700">{formatCurrency(p.costPrice)}</td>
                      <td className="px-4 py-3 text-gray-700">{p.sellPrice > 0 ? formatCurrency(p.sellPrice) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t('recentMovements')}</h2>
          <div className="rounded-lg bg-white border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {(['date', 'product', 'type', 'quantity', 'reason', 'reference'] as const).map((k) => (
                    <th key={k} className="px-4 py-3 text-left font-medium text-gray-600">
                      {t(`movementsTable.${k}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-3 text-gray-500">{formatDate(m.date)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{m.productName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        m.type === 'in' ? 'bg-green-100 text-green-700' :
                        m.type === 'out' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {t(`movementType.${m.type}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{m.quantity}</td>
                    <td className="px-4 py-3 text-gray-500">{m.reason ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{m.referenceId ?? '—'}</td>
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
