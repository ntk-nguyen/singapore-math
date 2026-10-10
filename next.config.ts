import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // "For grown-ups" was renamed to "Parents"; keep old links working.
  async redirects() {
    return [{ source: "/grown-ups", destination: "/parents", permanent: true }];
  },
};

export default nextConfig;
