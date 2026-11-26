import type { NextConfig } from 'next';

// API and upload traffic are handled by runtime route handlers rather than
// build-time rewrites. Render assigns the backend hostname after deployment;
// the internal host/port must not be baked into the Next.js build.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
};
export default nextConfig;
