import { z } from 'zod'

export const DepartmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  headId: z.string().optional(),
  headName: z.string().optional(),
})

export const EmployeeSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.string(),
  departmentId: z.string(),
  departmentName: z.string(),
  status: z.enum(['active', 'inactive', 'on_leave']),
  startDate: z.string(),
  salary: z.number().optional(),
  managerId: z.string().optional(),
  managerName: z.string().optional(),
})

export const HrDataSchema = z.object({
  employees: z.array(EmployeeSchema),
  departments: z.array(DepartmentSchema),
})

export type Department = z.infer<typeof DepartmentSchema>
export type Employee = z.infer<typeof EmployeeSchema>
export type HrData = z.infer<typeof HrDataSchema>
