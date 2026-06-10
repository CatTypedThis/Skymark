import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow local network devices for development testing
  allowedDevOrigins: ["192.168.10.22"],
};

export default nextConfig;
