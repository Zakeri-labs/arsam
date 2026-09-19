/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets the dev server (HMR + _next chunks) be reached from a phone on the
  // same LAN/hotspot for on-device PWA testing; otherwise Next.js blocks
  // those cross-origin dev requests and the page hangs on "checking session".
  allowedDevOrigins: ['192.168.43.192'],
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
