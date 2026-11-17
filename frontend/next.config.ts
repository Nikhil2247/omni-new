import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "https://api.omnicassion.com";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Proxy all /api/proxy/* requests to the backend (bypasses browser CORS)
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'files.omnicassion.com',
      },
      {
        protocol: 'https',
        hostname: 'backend.omnicassion.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
      },
    ],
  },

  // Enable compression
  compress: true,

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // Security
  poweredByHeader: false,

  // Trailing slash
  trailingSlash: false,

  // Generate ETags for caching
  generateEtags: true,
};

export default nextConfig;
