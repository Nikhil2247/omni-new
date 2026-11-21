import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "https://api.omnicassion.com";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // One canonical host: www.omnicassion.com -> omnicassion.com (301). Google lists both as separate pages today.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.omnicassion.com" }],
        destination: "https://omnicassion.com/:path*",
        permanent: true,
      },
    ];
  },

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
    // Uploaded files get unique keys, so optimized copies can be cached for 30 days.
    minimumCacheTTL: 60 * 60 * 24 * 30,
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
        hostname: 'omnicassion.s3.ap-south-1.amazonaws.com',
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
