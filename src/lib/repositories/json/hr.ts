import { HrDataSchema } from '@/schemas/hr'
import type { IHrRepository } from '../interfaces'
import type { HrData, Employee, Department } from '@/schemas/hr'
import projectCreekData from '../../../../data/companies/project-creek/hr.json'
import creekGlobalData from '../../../../data/companies/creek-global/hr.json'

const COMPANY_DATA: Record<string, unknown> = {
  'project-creek': projectCreekData,
  'creek-global': creekGlobalData,
}

export function createHrRepo(companyId: string): IHrRepository {
  async function load(): Promise<HrData> {
    const raw = COMPANY_DATA[companyId]
    if (!raw) throw new Error(`No HR data for company: ${companyId}`)
    return HrDataSchema.parse(raw)
  }

  return {
    getAll: load,
    getEmployees: async (): Promise<Employee[]> => (await load()).employees,
    getDepartments: async (): Promise<Department[]> => (await load()).departments,
    getEmployeeById: async (id: string): Promise<Employee | null> => {
      const data = await load()
      return data.employees.find((e) => e.id === id) ?? null
    },
  }
}
