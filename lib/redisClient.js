import { Redis } from "@upstash/redis";
import "dotenv/config";

// Extract REST URL and token from environment or use defaults
// Upstash REST URL format: https://HOST
// Upstash REST TOKEN: The token from the connection string
const getUpstashConfig = () => {
  // If REST URL and token are provided directly, use them
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    };
  }
};

const config = getUpstashConfig();

// Create Upstash Redis client (REST-based, no connection management needed)
const redisClient = new Redis({
  url: config.url,
  token: config.token,
});

export default redisClient;

