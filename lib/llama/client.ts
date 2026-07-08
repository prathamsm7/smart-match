import LlamaCloud from "@llamaindex/llama-cloud";

let client: LlamaCloud | null = null;

export function getLlamaCloudClient(): LlamaCloud {
    const apiKey = process.env.LLAMA_CLOUD_API_KEY;
    if (!apiKey) {
        throw new Error("LLAMA_CLOUD_API_KEY is not configured");
    }

    if (!client) {
        client = new LlamaCloud({
            apiKey,
            ...(process.env.LLAMA_CLOUD_BASE_URL
                ? { baseURL: process.env.LLAMA_CLOUD_BASE_URL }
                : {}),
        });
    }

    return client;
}
