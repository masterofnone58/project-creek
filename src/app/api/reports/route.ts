import { NextResponse } from 'next/server'
import { getRepos } from '@/lib/repositories'

export async function GET(request: Request) {
  const company = new URL(request.url).searchParams.get('company') ?? 'project-creek'
  const { financeRepo, salesRepo, inventoryRepo, productionRepo } = getRepos(company)

  const [finance, sales, inventory, production] = await Promise.all([
    financeRepo.getAll(),
    salesRepo.getAll(),
    inventoryRepo.getAll(),
    productionRepo.getAll(),
  ])

  const totalRevenue = finance.invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0)

  const totalExpenses = finance.expenses
    .filter((exp) => exp.status === 'paid' || exp.status === 'approved')
    .reduce((sum, exp) => sum + exp.amount, 0)

  const totalOutstandingInvoices = finance.invoices
    .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total, 0)

  const pipelineValue = sales.deals
    .filter((d) => !['won', 'lost'].includes(d.stage))
    .reduce((sum, d) => sum + d.value * (d.probability / 100), 0)

  const lowStockCount = inventory.products.filter(
    (p) => p.stockQuantity <= p.reorderLevel
  ).length

  const activeProductionOrders = production.orders.filter(
    (o) => o.status === 'in_progress'
  ).length

  return NextResponse.json({
    finance: { totalRevenue, totalExpenses, totalOutstandingInvoices },
    sales: {
      totalCustomers: sales.customers.filter((c) => c.type === 'customer').length,
      openDeals: sales.deals.filter((d) => !['won', 'lost'].includes(d.stage)).length,
      weightedPipelineValue: pipelineValue,
    },
    inventory: { totalProducts: inventory.products.length, lowStockCount },
    production: { activeOrders: activeProductionOrders },
  })
}
