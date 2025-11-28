import OpenAI from 'openai';
import { QdrantClient } from '@qdrant/js-client-rest';

// Gemini client for LLM calls (using OpenAI-compatible API)
export const geminiClient = new OpenAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

// OpenAI client for LLM calls
export const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Qdrant client for vector database operations
export const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});
