import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_LAUNCHED: process.env.LAUNCHED || "false",
    NEXT_PUBLIC_AUSPOST_MYPOST_ID: process.env.AUSPOST_MYPOST_ID || "1000146016",
  },
};

export default nextConfig;