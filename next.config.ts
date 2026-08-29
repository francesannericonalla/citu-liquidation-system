import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "@react-pdf/renderer"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
