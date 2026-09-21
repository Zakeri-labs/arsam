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
}

export default nextConfig
