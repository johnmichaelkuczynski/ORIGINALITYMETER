import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAssemblyAIApiKey } from "./assemblyai";
import { analyzeSingleDocument } from "./new-anthropic.js";
import { testFailoverChain } from "./llmFailover.js";

export type DiagnosticStatus = "pass" | "fail" | "skipped";

export interface DiagnosticResult {
  id: string;
  name: string;
  category: string;
  status: DiagnosticStatus;
  message: string;
  durationMs: number;
}

const ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929";

// Wrap a check with timing + uniform error handling so one failure never throws.
async function runCheck(
  id: string,
  name: string,
  category: string,
  fn: () => Promise<string>,
  timeoutMs = 60000
): Promise<DiagnosticResult> {
  const start = Date.now();
  try {
    const message = await Promise.race([
      fn(),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error(`Timed out after ${timeoutMs / 1000}s`)), timeoutMs)
      ),
    ]);
    return { id, name, category, status: "pass", message, durationMs: Date.now() - start };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { id, name, category, status: "fail", message: msg, durationMs: Date.now() - start };
  }
}

// For optional services that may not have a key configured: skip instead of fail.
async function optionalCheck(
  id: string,
  name: string,
  category: string,
  key: string | undefined,
  fn: () => Promise<string>,
  timeoutMs = 60000
): Promise<DiagnosticResult> {
  if (!key || key.trim() === "") {
    return {
      id,
      name,
      category,
      status: "skipped",
      message: "Not configured (optional — no API key set)",
      durationMs: 0,
    };
  }
  return runCheck(id, name, category, fn, timeoutMs);
}

function requireKey(value: string | undefined, label: string): string {
  if (!value || value.trim() === "") {
    throw new Error(`${label} is not set`);
  }
  return value;
}

// ---- Individual provider pings (small, fast, real API calls) ----

async function pingAnthropic(): Promise<string> {
  requireKey(process.env.ANTHROPIC_API_KEY, "ANTHROPIC_API_KEY");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const res = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 5,
    messages: [{ role: "user", content: "Reply with the single word OK." }],
  });
  const text = res.content[0]?.type === "text" ? res.content[0].text : "";
  return `Model ${ANTHROPIC_MODEL} responded: "${text.trim()}"`;
}

async function pingOpenAI(): Promise<string> {
  requireKey(process.env.OPENAI_API_KEY, "OPENAI_API_KEY");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 5,
    messages: [{ role: "user", content: "Reply with the single word OK." }],
  });
  return `Model gpt-4o responded: "${(res.choices[0]?.message?.content || "").trim()}"`;
}

async function pingDeepSeek(): Promise<string> {
  requireKey(process.env.DEEPSEEK_API_KEY, "DEEPSEEK_API_KEY");
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });
  const res = await client.chat.completions.create({
    model: "deepseek-chat",
    max_tokens: 5,
    messages: [{ role: "user", content: "Reply with the single word OK." }],
  });
  return `Model deepseek-chat responded: "${(res.choices[0]?.message?.content || "").trim()}"`;
}

async function pingPerplexity(): Promise<string> {
  requireKey(process.env.PERPLEXITY_API_KEY, "PERPLEXITY_API_KEY");
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      max_tokens: 16,
      messages: [{ role: "user", content: "Reply with the single word OK." }],
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status}: ${body.slice(0, 150)}`);
  }
  const data = await response.json();
  return `Model sonar responded: "${(data.choices?.[0]?.message?.content || "").trim()}"`;
}

async function pingXAI(): Promise<string> {
  requireKey(process.env.XAI_API_KEY, "XAI_API_KEY");
  const client = new OpenAI({ apiKey: process.env.XAI_API_KEY, baseURL: "https://api.x.ai/v1" });
  const res = await client.chat.completions.create({
    model: "grok-4.3",
    max_tokens: 5,
    messages: [{ role: "user", content: "Reply with the single word OK." }],
  });
  return `Model grok-4.3 responded: "${(res.choices[0]?.message?.content || "").trim()}"`;
}

async function pingGPTZero(): Promise<string> {
  const key = requireKey(process.env.GPTZERO_API_KEY, "GPTZERO_API_KEY");
  const response = await fetch("https://api.gptzero.me/v2/predict/text", {
    method: "POST",
    headers: { "x-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ document: "This is a short diagnostic test sentence for the AI detector." }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status}: ${body.slice(0, 150)}`);
  }
  return "GPTZero AI detection API responded successfully";
}

async function checkAnalysisEngine(): Promise<string> {
  // Runs the REAL production analysis pipeline end-to-end (Claude call + JSON parse).
  // All four modes (intelligence/originality/cogency/overall_quality) share this
  // same engine, so one live run verifies the core analysis function.
  const passage = {
    title: "Diagnostic",
    text: "The mind is not a vessel to be filled but a fire to be kindled.",
  };
  const result = await analyzeSingleDocument(passage, "intelligence", "quick");
  const count = result ? Object.keys(result).length : 0;
  if (count === 0) throw new Error("Analysis returned no results");
  return `Live end-to-end run returned ${count} scored questions`;
}

export async function runDiagnostics(): Promise<{
  results: DiagnosticResult[];
  summary: { total: number; passed: number; failed: number; skipped: number };
}> {
  const checks: Promise<DiagnosticResult>[] = [
    // AI provider connectivity (live calls)
    runCheck("anthropic", "ZHI 1 — Anthropic (Claude)", "AI Providers", pingAnthropic, 30000),
    runCheck("openai", "ZHI 2 — OpenAI (GPT-4o)", "AI Providers", pingOpenAI, 30000),
    runCheck("deepseek", "ZHI 3 — DeepSeek", "AI Providers", pingDeepSeek, 30000),
    runCheck("perplexity", "ZHI 4 — Perplexity", "AI Providers", pingPerplexity, 30000),
    runCheck("xai", "ZHI 5 — xAI (Grok)", "AI Providers", pingXAI, 30000),

    // Automatic provider failover (simulate primary outage, confirm recovery)
    runCheck(
      "failover",
      "Automatic Provider Failover (switches keys when one fails)",
      "Reliability",
      testFailoverChain,
      45000
    ),

    // Core analysis pipeline (real end-to-end run of the production engine)
    runCheck(
      "analyze-engine",
      "Analysis Engine — live end-to-end test (shared by all 4 modes)",
      "Analysis Engine",
      checkAnalysisEngine,
      150000
    ),

    // Transcription / dictation
    runCheck("assemblyai", "AssemblyAI (audio transcription)", "Transcription", async () => {
      const ok = await verifyAssemblyAIApiKey();
      if (!ok) throw new Error("AssemblyAI key verification failed");
      return "AssemblyAI key verified";
    }, 30000),
    runCheck("whisper", "Voice Dictation (OpenAI Whisper)", "Transcription", async () => {
      requireKey(process.env.OPENAI_API_KEY, "OPENAI_API_KEY");
      return "OpenAI key present (Whisper transcription ready)";
    }),

    // AI detection (optional — only run if a key is configured)
    optionalCheck("gptzero", "GPTZero (AI content detection)", "AI Detection", process.env.GPTZERO_API_KEY, pingGPTZero, 30000),

    // Supporting services (key presence)
    runCheck("mathpix", "Mathpix (math OCR)", "Supporting Services", async () => {
      requireKey(process.env.MATHPIX_APP_ID, "MATHPIX_APP_ID");
      requireKey(process.env.MATHPIX_APP_KEY, "MATHPIX_APP_KEY");
      return "Mathpix credentials present";
    }),
    runCheck("azure-speech", "Azure Speech (credentials)", "Supporting Services", async () => {
      requireKey(process.env.AZURE_SPEECH_KEY, "AZURE_SPEECH_KEY");
      requireKey(process.env.AZURE_SPEECH_REGION, "AZURE_SPEECH_REGION");
      return "Azure Speech credentials present";
    }),
  ];

  const results = await Promise.all(checks);
  const summary = {
    total: results.length,
    passed: results.filter((r) => r.status === "pass").length,
    failed: results.filter((r) => r.status === "fail").length,
    skipped: results.filter((r) => r.status === "skipped").length,
  };
  return { results, summary };
}
