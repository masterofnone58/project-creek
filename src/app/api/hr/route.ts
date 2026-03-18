import { NextResponse } from 'next/server'
import { getRepos } from '@/lib/repositories'

export async function GET(request: Request) {
  const company = new URL(request.url).searchParams.get('company') ?? 'project-creek'
  const { hrRepo } = getRepos(company)
  const data = await hrRepo.getAll()
  return NextResponse.json(data)
}
