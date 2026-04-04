import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error(
    "ANTHROPIC_API_KEY must be set. Get your API key from https://console.anthropic.com/",
  );
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
