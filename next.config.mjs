/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://ftzmlowdyozcowsorcnp.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_ABRN46nZon9NplBzO6yfow_1qw233wm',
    SUPABASE_SERVICE_ROLE_KEY: 'sb_publishable_ABRN46nZon9NplBzO6yfow_1qw233wm',
  },
}

export default nextConfig
