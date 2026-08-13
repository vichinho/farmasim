import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // TypeScript 5 provides the compiler API and avoids a CLI JSON parsing issue on this setup.
    useTypeScriptCli: false,
  },
};

export default nextConfig;
