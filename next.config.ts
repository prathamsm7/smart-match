import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['pdf-parse', '@qdrant/js-client-rest', 'redis', '@openai/agents', '@ai-sdk/google', 'ai', 'openai'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
