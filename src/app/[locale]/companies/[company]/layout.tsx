import { notFound } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { getCompanies, getCompanyById } from '@/lib/repositories'

export async function generateStaticParams() {
  const companies = await getCompanies()
  return companies.map((c) => ({ company: c.id }))
}

interface Props {
  children: React.ReactNode
  params: Promise<{ company: string }>
}

export default async function CompanyLayout({ children, params }: Props) {
  const { company: companyId } = await params

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
