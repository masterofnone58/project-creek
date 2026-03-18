import { z } from 'zod'

export const InvoiceSchema = z.object({
  id: z.string(),
  number: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  issueDate: z.string(),
  dueDate: z.string(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    total: z.number(),
  })),
  subtotal: z.number(),
  tax: z.number(),
  total: z.number(),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
})

export const ExpenseSchema = z.object({
  id: z.string(),
  date: z.string(),
  category: z.enum(['office', 'travel', 'marketing', 'operations', 'logistics', 'payroll', 'utilities', 'other']),
  description: z.string(),
  amount: z.number(),
  currency: z.string().default('USD'),
  vendor: z.string().optional(),
  approvedBy: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'paid']),
})

export const FinanceDataSchema = z.object({
  invoices: z.array(InvoiceSchema),
  expenses: z.array(ExpenseSchema),
})

export type Invoice = z.infer<typeof InvoiceSchema>
export type Expense = z.infer<typeof ExpenseSchema>
export type FinanceData = z.infer<typeof FinanceDataSchema>
