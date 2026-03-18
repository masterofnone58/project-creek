import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import { getRepos } from '@/lib/repositories'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-400',
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

interface Props {
  params: Promise<{ locale: string; company: string }>
}

export default async function FinancePage({ params }: Props) {
  const { locale, company } = await params
  setRequestLocale(locale)
  const [t, ts] = await Promise.all([
    getTranslations('finance'),
    getTranslations('status'),
  ])
  const { financeRepo } = getRepos(company)
  const { invoices, expenses } = await financeRepo.getAll()

  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0)
  const totalOutstanding = invoices.filter((i) => ['sent', 'overdue'].includes(i.status)).reduce((s, i) => s + i.total, 0)
  const totalExpenses = expenses.filter((e) => ['paid', 'approved'].includes(e.status)).reduce((s, e) => s + e.amount, 0)

  return (
    <div>
      <Header title={t('title')} description={t('description')} />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-3 gap-5">
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">{t('paidRevenue')}</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">{t('outstanding')}</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{formatCurrency(totalOutstanding)}</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">{t('totalExpenses')}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t('invoices')}</h2>
          <div className="rounded-lg bg-white border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {(['invoice', 'customer', 'issueDate', 'dueDate', 'status', 'total'] as const).map((k) => (
                    <th key={k} className="px-4 py-3 text-left font-medium text-gray-600">
                      {t(`invoiceTable.${k}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{inv.number}</td>
                    <td className="px-4 py-3 text-gray-700">{inv.customerName}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(inv.issueDate)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(inv.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[inv.status] ?? ''}`}>
                        {ts(inv.status as Parameters<typeof ts>[0])}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(inv.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t('expenses')}</h2>
          <div className="rounded-lg bg-white border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {(['date', 'category', 'description', 'vendor', 'status', 'amount'] as const).map((k) => (
                    <th key={k} className="px-4 py-3 text-left font-medium text-gray-600">
                      {t(`expenseTable.${k}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td className="px-4 py-3 text-gray-500">{formatDate(exp.date)}</td>
                    <td className="px-4 py-3 capitalize text-gray-700">{exp.category}</td>
                    <td className="px-4 py-3 text-gray-900">{exp.description}</td>
                    <td className="px-4 py-3 text-gray-500">{exp.vendor ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[exp.status] ?? ''}`}>
                        {ts(exp.status as Parameters<typeof ts>[0])}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(exp.amount)}</td>
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
