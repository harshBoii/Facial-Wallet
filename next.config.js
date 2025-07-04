/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static file serving for uploaded photos
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ];
  },
  // Webpack configuration for face-api.js compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        encoding: require.resolve('encoding'),
        stream: false,
        util: false,
        url: false,
        buffer: false,
        process: false,
      };
    }
    return config;
  },
  // Image optimization settings
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/photos/**',
      },
    ],
  },
  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
}

module.exports = nextConfig 