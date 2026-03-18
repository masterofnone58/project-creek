import type { FinanceData, Invoice, Expense } from '@/schemas/finance'
import type { SalesData, Customer, Deal, SalesOrder } from '@/schemas/sales'
import type { InventoryData, Product, StockMovement } from '@/schemas/inventory'
import type { ProductionData, ProductionOrder } from '@/schemas/production'
import type { HrData, Employee, Department } from '@/schemas/hr'
import type { TargetsData } from '@/schemas/targets'

export interface IFinanceRepository {
  getAll(): Promise<FinanceData>
  getInvoices(): Promise<Invoice[]>
  getExpenses(): Promise<Expense[]>
  getInvoiceById(id: string): Promise<Invoice | null>
}

export interface ISalesRepository {
  getAll(): Promise<SalesData>
  getCustomers(): Promise<Customer[]>
  getDeals(): Promise<Deal[]>
  getOrders(): Promise<SalesOrder[]>
  getCustomerById(id: string): Promise<Customer | null>
}

export interface IInventoryRepository {
  getAll(): Promise<InventoryData>
  getProducts(): Promise<Product[]>
  getMovements(): Promise<StockMovement[]>
  getProductById(id: string): Promise<Product | null>
  getLowStockProducts(): Promise<Product[]>
}

export interface IProductionRepository {
  getAll(): Promise<ProductionData>
  getOrders(): Promise<ProductionOrder[]>
  getOrderById(id: string): Promise<ProductionOrder | null>
}

export interface IHrRepository {
  getAll(): Promise<HrData>
  getEmployees(): Promise<Employee[]>
  getDepartments(): Promise<Department[]>
  getEmployeeById(id: string): Promise<Employee | null>
}

export interface ITargetsRepository {
  getTargets(): Promise<TargetsData>
}
