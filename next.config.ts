import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Prisma on Vercel/Serverless + Next 16 can fail if the Prisma query engine
   * isn't included in the traced output. Force include Prisma engine files.
   */
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/.prisma/client/**/*", "./node_modules/@prisma/client/**/*"],
    "/*": ["./node_modules/.prisma/client/**/*", "./node_modules/@prisma/client/**/*"],
  },

  /**
   * Keep these packages external on the server build when needed.
   * (Useful for Node-specific deps / bundling edge cases)
   */
  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs"],
};

export default nextConfig;
