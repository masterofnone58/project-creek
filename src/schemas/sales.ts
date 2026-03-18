import { z } from 'zod'

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  type: z.enum(['lead', 'prospect', 'customer', 'inactive']),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  notes: z.string().optional(),
})

export const DealSchema = z.object({
  id: z.string(),
  title: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  value: z.number(),
  currency: z.string().default('USD'),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
  probability: z.number().min(0).max(100),
  expectedCloseDate: z.string().optional(),
  assignedTo: z.string().optional(),
  createdAt: z.string(),
  notes: z.string().optional(),
})

export const SalesOrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  orderDate: z.string(),
  deliveryDate: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  lineItems: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
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

export const SalesDataSchema = z.object({
  customers: z.array(CustomerSchema),
  deals: z.array(DealSchema),
  orders: z.array(SalesOrderSchema),
})

export type Customer = z.infer<typeof CustomerSchema>
export type Deal = z.infer<typeof DealSchema>
export type SalesOrder = z.infer<typeof SalesOrderSchema>
export type SalesData = z.infer<typeof SalesDataSchema>
