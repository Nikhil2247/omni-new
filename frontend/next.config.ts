import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

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
