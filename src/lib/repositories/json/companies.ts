import { CompaniesSchema } from '@/schemas/companies'
import type { Company } from '@/schemas/companies'
import rawData from '../../../../data/companies.json'

export async function getCompanies(): Promise<Company[]> {
  return CompaniesSchema.parse(rawData)
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const companies = await getCompanies()
  return companies.find((c) => c.id === id) ?? null
}
