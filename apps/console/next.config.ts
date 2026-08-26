import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@merkiai/tenancy', '@merkiai/ui'],
}

export default nextConfig
