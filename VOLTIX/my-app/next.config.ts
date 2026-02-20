import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove "output: export" for Vercel deployment with dynamic features
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Proxy API calls through Next.js to avoid Chrome blocking port 6000
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${backendUrl}/socket.io/:path*`,
      }
    ];
  },
};

export default nextConfig;
