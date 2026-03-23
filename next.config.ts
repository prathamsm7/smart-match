import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', '@qdrant/js-client-rest', 'redis', '@openai/agents', '@ai-sdk/google', 'ai', 'openai'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript:{
    ignoreBuildErrors:true
  }
};

export default nextConfig;
