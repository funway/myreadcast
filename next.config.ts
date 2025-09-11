import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // productionBrowserSourceMaps: true,
  reactStrictMode: false,
  
  // 生产环境去掉 console
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
