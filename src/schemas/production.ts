import { z } from 'zod'

export const BomItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number(),
  unit: z.string(),
})

export const ProductionOrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  productId: z.string(),
  productName: z.string(),
  quantity: z.number(),
  unit: z.string(),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']),
  startDate: z.string(),
  endDate: z.string().optional(),
  bom: z.array(BomItemSchema),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
})

export const ProductionDataSchema = z.object({
  orders: z.array(ProductionOrderSchema),
})

export type BomItem = z.infer<typeof BomItemSchema>
export type ProductionOrder = z.infer<typeof ProductionOrderSchema>
export type ProductionData = z.infer<typeof ProductionDataSchema>
