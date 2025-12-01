import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/r/:slug',
        destination: '/review-menu/:slug',
      },
    ];
  },
};

export default nextConfig;
