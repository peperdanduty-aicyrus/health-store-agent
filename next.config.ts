import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          destination: "/survey",
          has: [{ type: "host", value: "survey.81366776.xyz" }],
          source: "/",
        },
      ],
    };
  },
};

export default nextConfig;
