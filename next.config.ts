import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization settings
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.openai.com',
      },
      {
        protocol: 'https',
        hostname: 'api.anthropic.com',
      },
      {
        protocol: 'https',
        hostname: 'generativelanguage.googleapis.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // API rewrites for production optimization
  async rewrites() {
    return [
      // Proxy API routes for better performance
      {
        source: '/api/external/:path*',
        destination: 'https://api.openai.com/:path*',
      },
      {
        source: '/api/anthropic/:path*',
        destination: 'https://api.anthropic.com/:path*',
      },
      {
        source: '/api/google/:path*',
        destination: 'https://generativelanguage.googleapis.com/:path*',
      },
    ];
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },

  // Compression settings
  compress: true,

  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Turbopack configuration
  turbopack: {
    rules: {
      '\\.wasm$': {
        loaders: [],
        as: 'webassembly/async',
      },
    },
  },

  // Webpack configuration for WebAssembly support
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });
    return config;
  },

  // Enable typed routes
  typedRoutes: true,

  // Production optimizations
  poweredByHeader: false,
  reactStrictMode: true,

  // Output configuration for static optimization where possible
  output: 'standalone',

  // Environment-specific settings
  ...(process.env.NODE_ENV === 'production' && {
    // Disable x-powered-by header in production
    poweredByHeader: false,

    // Enable source maps for debugging (optional)
    productionBrowserSourceMaps: false,
  }),
};

export default nextConfig;
