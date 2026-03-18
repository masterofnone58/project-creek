// Active repository implementations.
// To migrate to a database: create src/lib/repositories/db/ with the same exports
// and update the imports here. No other files need to change.

import { createFinanceRepo } from './json/finance'
import { createSalesRepo } from './json/sales'
import { createInventoryRepo } from './json/inventory'
import { createProductionRepo } from './json/production'
import { createHrRepo } from './json/hr'

export function getRepos(companyId: string) {
  return {
    financeRepo: createFinanceRepo(companyId),
    salesRepo: createSalesRepo(companyId),
    inventoryRepo: createInventoryRepo(companyId),
    productionRepo: createProductionRepo(companyId),
    hrRepo: createHrRepo(companyId),
  }
}

export { getCompanies, getCompanyById } from './json/companies'
export { createTargetsRepo } from './json/targets'

export type {
  IFinanceRepository,
  ISalesRepository,
  IInventoryRepository,
  IProductionRepository,
  IHrRepository,
  ITargetsRepository,
} from './interfaces'
