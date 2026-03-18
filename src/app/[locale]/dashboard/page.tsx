import { redirect } from 'next/navigation'

// Redirect old /dashboard URL to the new companies overview
export default async function OldDashboardRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect(`/${locale}/companies/project-creek/dashboard`)
}
