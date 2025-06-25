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
  webpack: (config, { isServer }) => {
    // Handle module resolution issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Remove semver alias to fix build error
    // config.resolve.alias = {
    //   ...config.resolve.alias,
    //   semver: require.resolve('semver'),
    // };

    return config;
  },
};

export default nextConfig;
