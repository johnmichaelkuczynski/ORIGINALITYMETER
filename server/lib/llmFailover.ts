import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Automatic AI provider failover.
// If the preferred provider's key is missing or its API call fails, we
// automatically move to the next provider in priority order. The core analysis
// engine uses this so a single broken key/model never takes the whole app down.

export interface ProviderAttempt {
  id: string;
  label: string;
  status: "success" | "failed" | "skipped";
  error?: string;
}

export interface FailoverResult {
  text: string;
  provider: string;
  providerLabel: string;
  attempts: ProviderAttempt[];
}

interface ProviderDef {
  id: string;
  label: string;
  model: string;
  isAvailable: () => boolean;
  call: (prompt: string, maxTokens: number) => Promise<string>;
}

const ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929";

// Helper for any OpenAI-compatible chat endpoint (OpenAI, DeepSeek, xAI).
async function openAICompatibleCall(
  apiKey: string | undefined,
  baseURL: string | undefined,
  model: string,
  prompt: string,
  maxTokens: number
): Promise<string> {
  const client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
  const res = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  return res.choices[0]?.message?.content || "";
}

// Priority order. Anthropic first (the app's tuned default), then the most
// capable OpenAI-compatible fallbacks. Perplexity is last (search-tuned).
export const FAILOVER_PROVIDERS: ProviderDef[] = [
  {
    id: "anthropic",
    label: "ZHI 1 — Anthropic (Claude)",
    model: ANTHROPIC_MODEL,
    isAvailable: () => !!process.env.ANTHROPIC_API_KEY,
    call: async (prompt, maxTokens) => {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const res = await client.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      });
      return res.content[0]?.type === "text" ? res.content[0].text : "";
    },
  },
  {
    id: "openai",
    label: "ZHI 2 — OpenAI (GPT-4o)",
    model: "gpt-4o",
    isAvailable: () => !!process.env.OPENAI_API_KEY,
    call: (prompt, maxTokens) =>
      openAICompatibleCall(process.env.OPENAI_API_KEY, undefined, "gpt-4o", prompt, Math.min(maxTokens, 16000)),
  },
  {
    id: "deepseek",
    label: "ZHI 3 — DeepSeek",
    model: "deepseek-chat",
    isAvailable: () => !!process.env.DEEPSEEK_API_KEY,
    call: (prompt, maxTokens) =>
      openAICompatibleCall(process.env.DEEPSEEK_API_KEY, "https://api.deepseek.com", "deepseek-chat", prompt, Math.min(maxTokens, 8000)),
  },
  {
    id: "xai",
    label: "ZHI 5 — xAI (Grok)",
    model: "grok-4.3",
    isAvailable: () => !!process.env.XAI_API_KEY,
    call: (prompt, maxTokens) =>
      openAICompatibleCall(process.env.XAI_API_KEY, "https://api.x.ai/v1", "grok-4.3", prompt, maxTokens),
  },
  {
    id: "perplexity",
    label: "ZHI 4 — Perplexity",
    model: "sonar",
    isAvailable: () => !!process.env.PERPLEXITY_API_KEY,
    call: (prompt, maxTokens) =>
      openAICompatibleCall(process.env.PERPLEXITY_API_KEY, "https://api.perplexity.ai", "sonar", prompt, Math.max(maxTokens, 16)),
  },
];

// Core failover loop. Tries each provider in the given list until one succeeds.
async function runFailover(
  list: ProviderDef[],
  prompt: string,
  maxTokens: number
): Promise<FailoverResult> {
  const attempts: ProviderAttempt[] = [];

  for (const p of list) {
    if (!p.isAvailable()) {
      attempts.push({ id: p.id, label: p.label, status: "skipped", error: "No API key configured" });
      continue;
    }
    try {
      const text = await p.call(prompt, maxTokens);
      if (!text || text.trim() === "") {
        throw new Error("Empty response");
      }
      attempts.push({ id: p.id, label: p.label, status: "success" });
      return { text, provider: p.id, providerLabel: p.label, attempts };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      attempts.push({ id: p.id, label: p.label, status: "failed", error: msg });
      console.warn(`[failover] ${p.id} failed, trying next provider: ${msg}`);
    }
  }

  const detail = attempts.map((a) => `${a.id}: ${a.status}${a.error ? ` (${a.error})` : ""}`).join(" | ");
  throw new Error(`All AI providers failed. ${detail}`);
}

// Public: generate text with automatic failover across all configured providers.
export async function generateWithFailover(prompt: string, maxTokens: number): Promise<FailoverResult> {
  return runFailover(FAILOVER_PROVIDERS, prompt, maxTokens);
}

// Diagnostic helper: prove the failover mechanism actually switches providers.
// We force a fake "primary" provider to fail, then confirm a real provider
// downstream picks up the request and returns a valid answer.
export async function testFailoverChain(): Promise<string> {
  const fakeFailing: ProviderDef = {
    id: "simulated-down",
    label: "Simulated primary outage",
    model: "none",
    isAvailable: () => true,
    call: async () => {
      throw new Error("Simulated provider outage (forced for failover test)");
    },
  };

  const realProviders = FAILOVER_PROVIDERS.filter((p) => p.isAvailable());
  if (realProviders.length === 0) {
    throw new Error("No real providers configured to fail over to");
  }

  const result = await runFailover([fakeFailing, ...realProviders], "Reply with the single word OK.", 16);
  const recovered = result.attempts.find((a) => a.id === "simulated-down" && a.status === "failed");
  if (!recovered) {
    throw new Error("Failover did not register the simulated outage");
  }
  return `Primary outage simulated → automatically recovered using ${result.providerLabel}`;
}
