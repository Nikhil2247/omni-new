import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Output standalone for Docker deployment
  output: 'standalone',
  
  // Image optimization for better SEO and performance
  images: {
    dangerouslyAllowLocalIP: true,
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000', // MinIO port
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001', // Backend port for proxied images
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '9000', // MinIO HTTPS
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '3001', // Backend HTTPS
      },
      {
        protocol: 'http',
        hostname: '147.93.106.69',
        port: '9000', // MinIO public IP
      },
      {
        protocol: 'https',
        hostname: '147.93.106.69',
        port: '9000', // MinIO public IP HTTPS
      },
      {
        protocol: 'http',
        hostname: '147.93.106.69',
        port: '3001', // Backend public IP
      },
      {
        protocol: 'https',
        hostname: '147.93.106.69',
        port: '3001', // Backend public IP HTTPS
      },
      {
        protocol: 'http',
        hostname: 'backend.omnicassion.com',
      },
      {
        protocol: 'https',
        hostname: 'backend.omnicassion.com',
      },
      {
        protocol: 'http',
        hostname: 'files.omnicassion.com',
      },
      {
        protocol: 'https',
        hostname: 'files.omnicassion.com',
      },
    ],
  },

  // Enable compression for better performance
  compress: true,

  // Optimize production builds
  productionBrowserSourceMaps: false,
  
  // Power optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security

  // Trailing slash configuration
  trailingSlash: false,

  // Generate ETags for caching
  generateEtags: true,

  // Keep legacy marketing links working after route rename.
  async rewrites() {
    return [
      {
        source: '/wedding-guest-list-manager',
        destination: '/wedding-guest-list',
      },
    ];
  },

  // HTTP headers for security and SEO
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
