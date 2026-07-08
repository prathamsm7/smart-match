import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['@qdrant/js-client-rest', 'redis', '@openai/agents', '@ai-sdk/google', 'ai', 'openai', '@llamaindex/llama-cloud'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript:{
    ignoreBuildErrors:true
  }
};

export default nextConfig;
