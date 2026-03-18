import { z } from 'zod'

export const ProductSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string(),
  unit: z.string(),
  costPrice: z.number(),
  sellPrice: z.number(),
  stockQuantity: z.number(),
  reorderLevel: z.number(),
  reorderQuantity: z.number(),
  supplierId: z.string().optional(),
  supplierName: z.string().optional(),
  active: z.boolean().default(true),
})

export const StockMovementSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  date: z.string(),
  type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.number(),
  reason: z.string().optional(),
  referenceId: z.string().optional(),
  referenceType: z.enum(['purchase', 'sale', 'production', 'adjustment']).optional(),
})

export const InventoryDataSchema = z.object({
  products: z.array(ProductSchema),
  movements: z.array(StockMovementSchema),
})

export type Product = z.infer<typeof ProductSchema>
export type StockMovement = z.infer<typeof StockMovementSchema>
export type InventoryData = z.infer<typeof InventoryDataSchema>
