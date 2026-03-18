import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { getCompanies, getCompanyById } from '@/lib/repositories'

export async function generateStaticParams() {
  const companies = await getCompanies()
  return companies.map((c) => ({ company: c.id }))
}

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string; company: string }>
}

export default async function CompanyLayout({ children, params }: Props) {
  const { locale, company: companyId } = await params
  setRequestLocale(locale)

  const [companies, company] = await Promise.all([
    getCompanies(),
    getCompanyById(companyId),
  ])

  if (!company) notFound()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar companyId={companyId} companies={companies} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
