import type { NextConfig } from "next";
import { supportedMediaDomains } from "@/lib/config";
const nextConfig: NextConfig = {
  images: {
    remotePatterns: supportedMediaDomains.map((domain) => ({
      protocol: "https",
      hostname: domain,
    })),
  },
};

export default nextConfig;
