/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Re-enable Next's image optimization pipeline (resizing + modern formats +
    // CDN caching). "unoptimized" shipped full-size originals to every device.
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig
