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
}

module.exports = nextConfig 