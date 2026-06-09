/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Type errors must block the build; ESLint is relaxed during build so that
  // stylistic rules never break `next build` (run `npm run lint` separately).
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Allow slightly larger payloads for form submissions (file uploads use a
      // dedicated route handler, not Server Actions).
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
