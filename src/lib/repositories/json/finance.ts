import { FinanceDataSchema } from '@/schemas/finance'
import type { IFinanceRepository } from '../interfaces'
import type { FinanceData, Invoice, Expense } from '@/schemas/finance'
import projectCreekData from '../../../../data/companies/project-creek/finance.json'
import creekGlobalData from '../../../../data/companies/creek-global/finance.json'

const COMPANY_DATA: Record<string, unknown> = {
  'project-creek': projectCreekData,
  'creek-global': creekGlobalData,
}

export function createFinanceRepo(companyId: string): IFinanceRepository {
  async function load(): Promise<FinanceData> {
    const raw = COMPANY_DATA[companyId]
    if (!raw) throw new Error(`No finance data for company: ${companyId}`)
    return FinanceDataSchema.parse(raw)
  }

  return {
    getAll: load,
    getInvoices: async (): Promise<Invoice[]> => (await load()).invoices,
    getExpenses: async (): Promise<Expense[]> => (await load()).expenses,
    getInvoiceById: async (id: string): Promise<Invoice | null> => {
      const data = await load()
      return data.invoices.find((inv) => inv.id === id) ?? null
    },
  }
}
