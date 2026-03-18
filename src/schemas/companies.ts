import { z } from 'zod'

export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  industry: z.string(),
  color: z.string(),
  description: z.string(),
})

export const CompaniesSchema = z.array(CompanySchema)

export type Company = z.infer<typeof CompanySchema>
