/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.cdn.filesafe.space',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.leadconnectorhq.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
