import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_LAUNCHED: process.env.LAUNCHED || "false",
  },
};

export default nextConfig;