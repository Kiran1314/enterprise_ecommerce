/** @type {import('next.config.js').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.ibcstudio.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig