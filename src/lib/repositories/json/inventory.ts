import { InventoryDataSchema } from '@/schemas/inventory'
import type { IInventoryRepository } from '../interfaces'
import type { InventoryData, Product, StockMovement } from '@/schemas/inventory'
import projectCreekData from '../../../../data/companies/project-creek/inventory.json'
import creekGlobalData from '../../../../data/companies/creek-global/inventory.json'

const COMPANY_DATA: Record<string, unknown> = {
  'project-creek': projectCreekData,
  'creek-global': creekGlobalData,
}

export function createInventoryRepo(companyId: string): IInventoryRepository {
  async function load(): Promise<InventoryData> {
    const raw = COMPANY_DATA[companyId]
    if (!raw) throw new Error(`No inventory data for company: ${companyId}`)
    return InventoryDataSchema.parse(raw)
  }

  return {
    getAll: load,
    getProducts: async (): Promise<Product[]> => (await load()).products,
    getMovements: async (): Promise<StockMovement[]> => (await load()).movements,
    getProductById: async (id: string): Promise<Product | null> => {
      const data = await load()
      return data.products.find((p) => p.id === id) ?? null
    },
    getLowStockProducts: async (): Promise<Product[]> => {
      const data = await load()
      return data.products.filter((p) => p.stockQuantity <= p.reorderLevel)
    },
  }
}
