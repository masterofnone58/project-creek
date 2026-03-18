import { SalesDataSchema } from '@/schemas/sales'
import type { ISalesRepository } from '../interfaces'
import type { SalesData, Customer, Deal, SalesOrder } from '@/schemas/sales'
import projectCreekData from '../../../../data/companies/project-creek/sales.json'
import creekGlobalData from '../../../../data/companies/creek-global/sales.json'

const COMPANY_DATA: Record<string, unknown> = {
  'project-creek': projectCreekData,
  'creek-global': creekGlobalData,
}

export function createSalesRepo(companyId: string): ISalesRepository {
  async function load(): Promise<SalesData> {
    const raw = COMPANY_DATA[companyId]
    if (!raw) throw new Error(`No sales data for company: ${companyId}`)
    return SalesDataSchema.parse(raw)
  }

  return {
    getAll: load,
    getCustomers: async (): Promise<Customer[]> => (await load()).customers,
    getDeals: async (): Promise<Deal[]> => (await load()).deals,
    getOrders: async (): Promise<SalesOrder[]> => (await load()).orders,
    getCustomerById: async (id: string): Promise<Customer | null> => {
      const data = await load()
      return data.customers.find((c) => c.id === id) ?? null
    },
  }
}
