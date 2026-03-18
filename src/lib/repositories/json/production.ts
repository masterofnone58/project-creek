import { ProductionDataSchema } from '@/schemas/production'
import type { IProductionRepository } from '../interfaces'
import type { ProductionData, ProductionOrder } from '@/schemas/production'
import projectCreekData from '../../../../data/companies/project-creek/production.json'
import creekGlobalData from '../../../../data/companies/creek-global/production.json'

const COMPANY_DATA: Record<string, unknown> = {
  'project-creek': projectCreekData,
  'creek-global': creekGlobalData,
}

export function createProductionRepo(companyId: string): IProductionRepository {
  async function load(): Promise<ProductionData> {
    const raw = COMPANY_DATA[companyId]
    if (!raw) throw new Error(`No production data for company: ${companyId}`)
    return ProductionDataSchema.parse(raw)
  }

  return {
    getAll: load,
    getOrders: async (): Promise<ProductionOrder[]> => (await load()).orders,
    getOrderById: async (id: string): Promise<ProductionOrder | null> => {
      const data = await load()
      return data.orders.find((o) => o.id === id) ?? null
    },
  }
}
