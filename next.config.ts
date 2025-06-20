import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // for now for getting images from unsplash 
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
