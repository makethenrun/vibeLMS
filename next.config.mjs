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
      // Large payloads for form submissions / saved drawings. File uploads use a
      // dedicated route handler (no app-level size cap). Note: on Vercel the
      // platform still caps a serverless request body at ~4.5 MB regardless of
      // this value — larger files need a direct-to-storage (signed URL) upload.
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
