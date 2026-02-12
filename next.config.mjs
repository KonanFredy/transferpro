/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
