import { TargetsDataSchema } from '@/schemas/targets'
import type { ITargetsRepository } from '../interfaces'
import type { TargetsData } from '@/schemas/targets'
import rawData from '../../../../data/targets.json'

export function createTargetsRepo(): ITargetsRepository {
  async function load(): Promise<TargetsData> {
    return TargetsDataSchema.parse(rawData)
  }

  return {
    getTargets: load,
  }
}
