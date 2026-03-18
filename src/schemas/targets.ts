import { z } from 'zod'

export const MonthlyTargetSchema = z.object({
  month: z.string(), // "YYYY-MM"
  invoiceAmount: z.number(),
  salesVolume: z.number(),
})

export const CollectionResponsibleSchema = z.object({
  name: z.string(),
  role: z.string(),
})

export const CompanyTargetSchema = z.object({
  annualQuota: z.number(),
  collectionResponsible: CollectionResponsibleSchema,
})

const HistoricalYearSchema = z.object({
  annualInvoiceQuota: z.number(),
  companies: z.record(z.string(), z.object({ annualQuota: z.number() })),
})

export const TargetsDataSchema = z.object({
  year: z.number(),
  annualInvoiceQuota: z.number(),
  monthlyTargets: z.array(MonthlyTargetSchema),
  companies: z.record(z.string(), CompanyTargetSchema),
  history: z.record(z.string(), HistoricalYearSchema).optional(),
})

export type MonthlyTarget = z.infer<typeof MonthlyTargetSchema>
export type CompanyTarget = z.infer<typeof CompanyTargetSchema>
export type TargetsData = z.infer<typeof TargetsDataSchema>
