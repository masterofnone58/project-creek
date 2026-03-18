import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const isGithubPages = process.env.DEPLOY_TARGET === 'github-pages'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.trycloudflare.com', '192.168.31.149'],
  ...(isGithubPages && {
    output: 'export',
    basePath: '/project-creek',
    images: { unoptimized: true },
  }),
}

export default withNextIntl(nextConfig)
