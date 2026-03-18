'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, Link } from '@/i18n/navigation'
import {
  LayoutDashboard,
  DollarSign,
  ShoppingCart,
  Package,
  Factory,
  Users,
  BarChart3,
  Building2,
  ChevronDown,
  Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Company } from '@/schemas/companies'

interface SidebarProps {
  companyId: string
  companies: Company[]
}

export function Sidebar({ companyId, companies }: SidebarProps) {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [switcherOpen, setSwitcherOpen] = useState(false)

  const currentCompany = companies.find((c) => c.id === companyId)

  const NAV_ITEMS = [
    { href: `/companies/${companyId}/dashboard`, label: t('overview'), icon: LayoutDashboard },
    { href: `/companies/${companyId}/finance`, label: t('finance'), icon: DollarSign },
    { href: `/companies/${companyId}/sales`, label: t('sales'), icon: ShoppingCart },
    { href: `/companies/${companyId}/inventory`, label: t('inventory'), icon: Package },
    { href: `/companies/${companyId}/production`, label: t('production'), icon: Factory },
    { href: `/companies/${companyId}/hr`, label: t('hr'), icon: Users },
    { href: `/companies/${companyId}/reports`, label: t('reports'), icon: BarChart3 },
  ]

  return (
    <aside className="w-60 flex-shrink-0 bg-gray-900 text-white flex flex-col h-screen sticky top-0">
      <div className="px-3 pt-3 pb-2 border-b border-gray-700">
        <Link
          href="/supply-chain"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-gray-400 hover:bg-gray-800 hover:text-white transition-colors w-full"
        >
          <Home size={13} />
          {t('home')}
        </Link>
      </div>
      <div className="px-4 py-5 border-b border-gray-700">
        <div className="relative">
          <button
            onClick={() => setSwitcherOpen((o) => !o)}
            className="w-full flex items-center gap-2"
          >
            <div className="w-7 h-7 rounded bg-gray-700 flex items-center justify-center flex-shrink-0">
              <Building2 size={14} className="text-gray-300" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className="text-sm font-semibold tracking-tight truncate block leading-tight">
                {currentCompany?.name ?? companyId}
              </span>
              <p className="text-xs text-gray-400">{t('appSubtitle')}</p>
            </div>
            <ChevronDown
              size={14}
              className={cn('text-gray-400 flex-shrink-0 transition-transform', switcherOpen && 'rotate-180')}
            />
          </button>

          {switcherOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-md shadow-lg border border-gray-700 z-10 overflow-hidden">
              {companies.map((company) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.id}/dashboard` as Parameters<typeof Link>[0]['href']}
                  onClick={() => setSwitcherOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-gray-700 transition-colors',
                    company.id === companyId ? 'text-white font-semibold' : 'text-gray-400'
                  )}
                >
                  <Building2 size={12} className="flex-shrink-0" />
                  <span className="truncate">{company.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href as Parameters<typeof Link>[0]['href']}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-700">
        <LocaleSwitcher />
        <p className="mt-3 text-xs text-gray-600 text-center">v0.1.0</p>
      </div>
    </aside>
  )
}

function LocaleSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('nav')
  const currentIsZh = t('appSubtitle') === '运营管理中心'

  function switchLocale(newLocale: 'en' | 'zh-CN') {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <div className="flex rounded-md overflow-hidden text-xs font-medium">
      <button
        onClick={() => switchLocale('en')}
        className={cn(
          'flex-1 py-1.5 transition-colors',
          !currentIsZh
            ? 'bg-gray-600 text-white'
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
        )}
      >
        EN
      </button>
      <button
        onClick={() => switchLocale('zh-CN')}
        className={cn(
          'flex-1 py-1.5 transition-colors',
          currentIsZh
            ? 'bg-gray-600 text-white'
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
        )}
      >
        中文
      </button>
    </div>
  )
}
