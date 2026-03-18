import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import { getRepos } from '@/lib/repositories'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  on_leave: 'bg-yellow-100 text-yellow-700',
}

interface Props {
  params: Promise<{ locale: string; company: string }>
}

export default async function HrPage({ params }: Props) {
  const { locale, company } = await params
  setRequestLocale(locale)
  const [t, ts] = await Promise.all([
    getTranslations('hr'),
    getTranslations('status'),
  ])
  const { hrRepo } = getRepos(company)
  const { employees, departments } = await hrRepo.getAll()

  const active = employees.filter((e) => e.status === 'active').length
  const onLeave = employees.filter((e) => e.status === 'on_leave').length

  return (
    <div>
      <Header title={t('title')} description={t('description')} />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-3 gap-5">
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">{t('totalEmployees')}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{employees.length}</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">{t('active')}</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{active}</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">{t('onLeave')}</p>
            <p className="mt-1 text-2xl font-bold text-yellow-600">{onLeave}</p>
          </div>
        </div>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t('departments')}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {departments.map((dept) => {
              const count = employees.filter((e) => e.departmentId === dept.id).length
              return (
                <div key={dept.id} className="rounded-lg bg-white border border-gray-200 p-4">
                  <p className="font-medium text-gray-900 text-sm">{dept.name}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{count === 1 ? t('member') : t('members')}</p>
                  {dept.headName && (
                    <p className="text-xs text-gray-500 mt-2 border-t border-gray-100 pt-2">{t('head')}: {dept.headName}</p>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t('employees')}</h2>
          <div className="rounded-lg bg-white border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {(['name', 'role', 'department', 'status', 'startDate', 'salary'] as const).map((k) => (
                    <th key={k} className="px-4 py-3 text-left font-medium text-gray-600">
                      {t(`employeesTable.${k}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{emp.firstName} {emp.lastName}</td>
                    <td className="px-4 py-3 text-gray-700">{emp.role}</td>
                    <td className="px-4 py-3 text-gray-500">{emp.departmentName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[emp.status] ?? ''}`}>
                        {ts(emp.status as Parameters<typeof ts>[0])}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(emp.startDate)}</td>
                    <td className="px-4 py-3 text-gray-700">{emp.salary ? formatCurrency(emp.salary) : '—'}</td>
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
