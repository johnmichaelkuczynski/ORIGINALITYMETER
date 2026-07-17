// ============================================================================
// CROSS-CHUNK COHERENCE (CC) — coherent long-document generation.
//
// The naive long-document path chunks text and processes each chunk in
// isolation, then joins the pieces. The result is a "Frankenstein" document:
// terminology drifts, later chunks contradict earlier ones, points repeat, and
// there is no unified argument arc.
//
// This module implements the three-pass architecture that fixes that:
//   PASS 1 — Global skeleton extraction (thesis, outline, key terms,
//            commitment ledger, entities) so every chunk shares one source of
//            structural truth.
//   PASS 2 — Constrained chunk processing. Each chunk is generated against the
//            skeleton + the running deltas of prior chunks, with explicit
//            length targets and retry-on-miss.
//   PASS 3 — Global consistency stitch. A final pass reviews all chunk delta
//            reports against the skeleton, flags contradictions / drift /
//            redundancy, and the output is assembled.
//
// All intermediate state lives in the external Neon Postgres DB (via storage),
// so long jobs survive restarts and can be polled for live progress.
// ============================================================================

import { storage } from "../storage";
import { generateWithFailover } from "./llmFailover";
import type { ReconstructionJob } from "@shared/schema";

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

function nowIso(): string {
  return new Date().toISOString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function countWords(text: string): number {
  const trimmed = (text || "").trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

// ---------------------------------------------------------------------------
// Length enforcement (Part 3 of the CC spec)
// ---------------------------------------------------------------------------

export type LengthMode =
  | "heavy_compression"
  | "moderate_compression"
  | "maintain"
  | "moderate_expansion"
  | "heavy_expansion";

interface TargetLength {
  targetMin: number;
  targetMax: number;
  explicit: boolean;
}

// Parse a target word count out of the user's custom instructions. Falls back
// to sensible ratios when the user only gives a verbal hint, and to "match
// input length" when nothing is specified.
export function parseTargetLength(customInstructions: string, totalInputWords: number): TargetLength {
  const text = (customInstructions || "").toLowerCase();

  const num = (s: string): number => parseInt(s.replace(/[,\s]/g, ""), 10);

  // "X-Y words" range.
  const rangeMatch = text.match(/(\d[\d,]*)\s*(?:-|to|–)\s*(\d[\d,]*)\s*words?/);
  if (rangeMatch) {
    return { targetMin: num(rangeMatch[1]), targetMax: num(rangeMatch[2]), explicit: true };
  }

  // "at least X words".
  const atLeast = text.match(/at\s+least\s+(\d[\d,]*)\s*words?/);
  if (atLeast) {
    const x = num(atLeast[1]);
    return { targetMin: x, targetMax: Math.ceil(x * 1.25), explicit: true };
  }

  // "no more than X words".
  const noMore = text.match(/no\s+more\s+than\s+(\d[\d,]*)\s*words?/);
  if (noMore) {
    const x = num(noMore[1]);
    return { targetMin: Math.floor(x * 0.75), targetMax: x, explicit: true };
  }

  // "approximately/about/around/~ X words" or bare "X words".
  const approx = text.match(/(?:approximately|about|around|~|roughly)\s*(\d[\d,]*)\s*words?/);
  const bare = text.match(/(\d[\d,]*)\s*words?/);
  // Shorthand like "10k", "2.5k".
  const kshort = text.match(/(\d+(?:\.\d+)?)\s*k\b/);

  if (approx) {
    const x = num(approx[1]);
    return { targetMin: Math.floor(x * 0.9), targetMax: Math.ceil(x * 1.1), explicit: true };
  }
  if (bare) {
    const x = num(bare[1]);
    return { targetMin: Math.floor(x * 0.9), targetMax: Math.ceil(x * 1.1), explicit: true };
  }
  if (kshort) {
    const x = Math.round(parseFloat(kshort[1]) * 1000);
    return { targetMin: Math.floor(x * 0.9), targetMax: Math.ceil(x * 1.1), explicit: true };
  }

  // Verbal multipliers.
  if (/twice as long|2x|double/.test(text)) {
    const x = totalInputWords * 2;
    return { targetMin: Math.floor(x * 0.9), targetMax: Math.ceil(x * 1.1), explicit: true };
  }
  const multiplier = text.match(/(\d+(?:\.\d+)?)\s*(?:x|times)\s+(?:as\s+long|longer|the\s+length)/);
  if (multiplier) {
    const x = Math.round(totalInputWords * parseFloat(multiplier[1]));
    return { targetMin: Math.floor(x * 0.9), targetMax: Math.ceil(x * 1.1), explicit: true };
  }

  // Verbal expand / compress without a number.
  if (/\b(expand|enrich|elaborate|develop|lengthen)\b/.test(text)) {
    return { targetMin: Math.round(totalInputWords * 1.3), targetMax: Math.round(totalInputWords * 1.5), explicit: false };
  }
  if (/\b(compress|summarize|summarise|condense|shorten|abridge)\b/.test(text)) {
    return { targetMin: Math.round(totalInputWords * 0.3), targetMax: Math.round(totalInputWords * 0.5), explicit: false };
  }

  // Default: roughly match input length (ratio 1.0), with a little headroom.
  return { targetMin: Math.round(totalInputWords * 0.9), targetMax: Math.round(totalInputWords * 1.15), explicit: false };
}

export function getLengthMode(lengthRatio: number): LengthMode {
  if (lengthRatio < 0.5) return "heavy_compression";
  if (lengthRatio < 0.8) return "moderate_compression";
  if (lengthRatio < 1.2) return "maintain";
  if (lengthRatio < 1.8) return "moderate_expansion";
  return "heavy_expansion";
}

const LENGTH_GUIDANCE: Record<LengthMode, string> = {
  heavy_compression: `LENGTH MODE: HEAVY COMPRESSION
You must significantly compress this chunk while preserving core arguments.
- Remove examples, keep only the most critical one
- Remove repetition and redundancy
- Convert detailed explanations to concise statements
- Preserve thesis statements and key claims verbatim
- Remove transitional phrases and rhetorical flourishes`,
  moderate_compression: `LENGTH MODE: MODERATE COMPRESSION
You must compress this chunk while preserving argument structure.
- Keep the strongest 1-2 examples, remove weaker ones
- Tighten prose without losing meaning
- Preserve all key claims and their primary support
- Remove redundancy but keep necessary emphasis`,
  maintain: `LENGTH MODE: MAINTAIN LENGTH
Your output should be approximately the same length as input.
- Improve clarity and coherence without changing length significantly
- Replace weak examples with stronger ones of similar length
- Restructure sentences for better flow
- Do not add or remove substantial content`,
  moderate_expansion: `LENGTH MODE: MODERATE EXPANSION
You must expand this chunk while maintaining focus.
- Add 1-2 supporting examples or evidence for key claims
- Elaborate on implications of major points
- Add transitional sentences to improve flow
- Expand terse statements into fuller explanations
- Do NOT add tangential content or padding`,
  heavy_expansion: `LENGTH MODE: HEAVY EXPANSION
You must significantly expand this chunk with substantive additions.
- Add 2-3 concrete examples (historical, empirical, or hypothetical)
- Elaborate on each major claim with supporting analysis
- Add relevant context and background
- Develop implications and consequences of arguments
- Add appropriate qualifications and nuances
- Do NOT add filler or padding—all additions must be substantive`,
};

// ---------------------------------------------------------------------------
// Chunking (paragraph-aware, ~500 words/chunk per CC spec)
// ---------------------------------------------------------------------------

const CHUNK_WORDS = 500;

export function splitIntoChunks(text: string, chunkWords: number = CHUNK_WORDS): string[] {
  // Respect paragraph boundaries; only split a paragraph if it is itself larger
  // than the chunk budget.
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current: string[] = [];
  let currentWords = 0;

  const flush = () => {
    if (current.length) {
      chunks.push(current.join("\n\n"));
      current = [];
      currentWords = 0;
    }
  };

  for (const para of paragraphs) {
    const w = countWords(para);

    if (w > chunkWords * 1.6) {
      // Oversized paragraph: flush what we have, then hard-split by sentences.
      flush();
      const sentences = para.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [para];
      let sent: string[] = [];
      let sentWords = 0;
      for (const s of sentences) {
        const sw = countWords(s);
        if (sentWords + sw > chunkWords && sent.length) {
          chunks.push(sent.join(" ").trim());
          sent = [];
          sentWords = 0;
        }
        sent.push(s.trim());
        sentWords += sw;
      }
      if (sent.length) chunks.push(sent.join(" ").trim());
      continue;
    }

    if (currentWords + w > chunkWords && current.length) {
      flush();
    }
    current.push(para);
    currentWords += w;
  }
  flush();

  return chunks.length ? chunks : [text.trim()];
}

// ---------------------------------------------------------------------------
// Prompt builders (Part 6 of the CC spec)
// ---------------------------------------------------------------------------

const NO_PUFFERY = `STYLE: No puffery. No hedging. No empty academic filler. Every sentence must
carry information. Add length only by adding substantive content (examples,
evidence, analysis), never by padding with rhetorical flourishes.`;

function buildSkeletonPrompt(documentText: string): string {
  // Cap the skeleton call so very large docs don't overflow context. We take
  // the first 15,000 words, which is enough to capture global structure.
  const words = documentText.trim().split(/\s+/);
  const capped = words.length > 15000 ? words.slice(0, 15000).join(" ") : documentText;

  return `You are extracting a structural skeleton from a document. This skeleton will
guide coherent processing of every section, so be precise and preserve exact
terminology — errors here propagate everywhere.

Return ONLY valid JSON (no markdown fences, no preamble) in exactly this shape:
{
  "thesis": "1-3 sentence central argument or purpose",
  "outline": ["8 to 20 short numbered claims/sections describing the document's structure"],
  "keyTerms": [{"term": "...", "definition": "the specific meaning as used in THIS document"}],
  "commitmentLedger": {
    "asserts": ["claims the document affirms"],
    "rejects": ["claims the document denies"],
    "assumes": ["premises the document takes for granted"]
  },
  "entities": ["people, organizations, technical terms, or variables that must be referenced consistently"]
}

Keep the entire JSON under ~2000 tokens. Capture structure only — do not rewrite the content.

DOCUMENT TEXT:
${capped}`;
}

function formatSkeleton(skeleton: any): string {
  if (!skeleton || typeof skeleton !== "object") return "(no skeleton available)";
  const lines: string[] = [];
  if (skeleton.thesis) lines.push(`THESIS: ${skeleton.thesis}`);
  if (Array.isArray(skeleton.outline) && skeleton.outline.length) {
    lines.push(`\nARGUMENT ARC:`);
    skeleton.outline.forEach((o: string, i: number) => lines.push(`  ${i + 1}. ${o}`));
  }
  if (Array.isArray(skeleton.keyTerms) && skeleton.keyTerms.length) {
    lines.push(`\nKEY TERMS (use EXACTLY as defined):`);
    skeleton.keyTerms.forEach((t: any) => lines.push(`  - ${t.term}: ${t.definition}`));
  }
  const cl = skeleton.commitmentLedger || {};
  if (cl.asserts?.length || cl.rejects?.length || cl.assumes?.length) {
    lines.push(`\nCOMMITMENT LEDGER (never contradict):`);
    (cl.asserts || []).forEach((a: string) => lines.push(`  ASSERTS: ${a}`));
    (cl.rejects || []).forEach((r: string) => lines.push(`  REJECTS: ${r}`));
    (cl.assumes || []).forEach((a: string) => lines.push(`  ASSUMES: ${a}`));
  }
  if (Array.isArray(skeleton.entities) && skeleton.entities.length) {
    lines.push(`\nENTITIES (consistent reference): ${skeleton.entities.join(", ")}`);
  }
  lines.push(`\nCONSTRAINT: Every section you write MUST be consistent with this skeleton.`);
  return lines.join("\n");
}

interface ChunkPromptArgs {
  chunkText: string;
  skeletonBlock: string;
  customInstructions: string;
  styleSource?: string | null;
  contentSource?: string | null;
  priorDeltas: string;
  targetWords: number;
  minWords: number;
  maxWords: number;
  chunkInputWords: number;
  lengthGuidance: string;
  chunkIndex: number;
  totalChunks: number;
  isFiction: boolean;
  preserveMath: boolean;
}

function buildChunkPrompt(a: ChunkPromptArgs): string {
  const sectionKind = a.isFiction ? "narrative section" : "section";
  return `You are processing ONE ${sectionKind} of a larger document. You must maintain
coherence with the document's established structure and commitments.

GLOBAL SKELETON (you must honor this):
${a.skeletonBlock}

${a.priorDeltas ? `WHAT EARLIER SECTIONS ALREADY ESTABLISHED (do not repeat or contradict):\n${a.priorDeltas}\n` : ""}
INSTRUCTIONS (follow these):
${a.customInstructions}
${a.styleSource ? `\nSTYLE SAMPLE (match this exact voice, sentence rhythm, and rigor):\n"${a.styleSource.substring(0, 1200)}"\n` : ""}${a.contentSource ? `\nADDITIONAL CONTENT TO INTEGRATE WHERE RELEVANT:\n"${a.contentSource.substring(0, 1500)}"\n` : ""}
*** OUTPUT LENGTH REQUIREMENT ***
This is section ${a.chunkIndex + 1} of ${a.totalChunks}. Original section: ${a.chunkInputWords} words.
YOUR OUTPUT MUST BE ${a.minWords}-${a.maxWords} words (target ~${a.targetWords}).
This is a HARD requirement. Count your words before finalizing.

${a.lengthGuidance}
*** END LENGTH REQUIREMENT ***

CONSTRAINTS:
- Do NOT contradict any commitment in the skeleton.
- Use key terms EXACTLY as defined in the skeleton.
- Do NOT re-introduce points earlier sections already made; build on them.
- If you detect a conflict with the skeleton, flag it explicitly in the delta report rather than silently violating it.
- Write connective prose that flows from the prior sections — this is part of one unified document, not a standalone piece.
${a.preserveMath ? "- PRESERVE all mathematical expressions exactly using LaTeX ($inline$ and $$display$$)." : ""}
${NO_PUFFERY}

SECTION SOURCE TEXT:
${a.chunkText}

Respond in EXACTLY this format:

PROCESSED_TEXT:
[your reconstructed section here, ${a.minWords}-${a.maxWords} words, no headers like "Section N" unless the instructions ask for them]

DELTA_REPORT:
{"newClaims": ["claims introduced here"], "termsUsed": ["skeleton key terms you used"], "conflicts": ["conflicts with the skeleton, or empty"]}`;
}

function buildExpansionRetryPrompt(previous: string, actual: number, target: number, min: number, max: number): string {
  return `Your previous output was ${actual} words, but the target is ${min}-${max} words.
Add approximately ${Math.max(target - actual, 0)} more words by deepening the existing
content: additional examples or evidence, fuller explanations, elaboration of
implications, and connective sentences. Do NOT add filler or padding, and do NOT
introduce claims that conflict with the rest of the document.

PREVIOUS OUTPUT:
${previous}

Return ONLY the expanded text (no preamble, no delta report), ${min}-${max} words.`;
}

function buildCompressionRetryPrompt(previous: string, actual: number, target: number, min: number, max: number): string {
  return `Your previous output was ${actual} words, but the target is ${min}-${max} words.
Remove approximately ${Math.max(actual - target, 0)} words by cutting weaker
examples, tightening prose, and eliminating redundancy. Preserve every key claim
and the core argument.

PREVIOUS OUTPUT:
${previous}

Return ONLY the compressed text (no preamble, no delta report), ${min}-${max} words.`;
}

function buildStitchPrompt(skeletonBlock: string, deltaReports: string): string {
  return `You are reviewing the per-section delta reports of a long document for
cross-chunk coherence. You are NOT rewriting the document — you are auditing it.

GLOBAL SKELETON:
${skeletonBlock}

PER-SECTION DELTA REPORTS (in order):
${deltaReports}

Review for: (1) CONTRADICTIONS between sections or with the skeleton,
(2) TERMINOLOGY DRIFT, (3) REDUNDANCY (same point made repeatedly),
(4) GAPS (skeleton items never covered).

Return ONLY valid JSON (no fences):
{
  "conflicts": ["specific issues with the section number, or empty if none"],
  "repairPlan": ["for each conflict, which section needs what change, or empty"],
  "transitionNote": "one short paragraph the assembler can use to frame the document as a unified whole"
}`;
}

// ---------------------------------------------------------------------------
// JSON / format parsing helpers
// ---------------------------------------------------------------------------

function extractJson(text: string): any {
  if (!text) return null;
  let t = text.trim();
  // Strip markdown code fences if present.
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  // Grab the outermost JSON object.
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  const candidate = t.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

// Parse the "PROCESSED_TEXT: ... DELTA_REPORT: ..." chunk response format.
function parseChunkResponse(raw: string): { text: string; delta: any } {
  if (!raw) return { text: "", delta: {} };
  const deltaIdx = raw.search(/DELTA_REPORT\s*:/i);
  let textPart = raw;
  let deltaPart = "";
  if (deltaIdx !== -1) {
    textPart = raw.slice(0, deltaIdx);
    deltaPart = raw.slice(deltaIdx).replace(/^[\s\S]*?DELTA_REPORT\s*:/i, "");
  }
  textPart = textPart.replace(/^[\s\S]*?PROCESSED_TEXT\s*:/i, "").trim();
  // If the marker was absent, fall back to the whole response as text.
  if (!textPart) textPart = raw.trim();
  const delta = extractJson(deltaPart) || {};
  return { text: textPart, delta };
}

// ---------------------------------------------------------------------------
// Job initialization
// ---------------------------------------------------------------------------

export interface InitJobArgs {
  sourceText: string;
  customInstructions: string;
  styleSource?: string | null;
  contentSource?: string | null;
  isFiction?: boolean;
  preserveMath?: boolean;
  title?: string | null;
}

export async function initializeReconstructionJob(args: InitJobArgs): Promise<ReconstructionJob> {
  const totalInputWords = countWords(args.sourceText);
  const { targetMin, targetMax } = parseTargetLength(args.customInstructions || "", totalInputWords);
  const targetMid = Math.floor((targetMin + targetMax) / 2) || totalInputWords;
  const lengthRatio = totalInputWords > 0 ? targetMid / totalInputWords : 1;
  const lengthMode = getLengthMode(lengthRatio);

  const chunks = splitIntoChunks(args.sourceText);
  const numChunks = chunks.length;
  const chunkTargetWords = Math.max(1, Math.ceil(targetMid / numChunks));

  const ts = nowIso();
  const job = await storage.createReconstructionJob({
    status: "pending",
    title: args.title || null,
    originalText: args.sourceText,
    customInstructions: args.customInstructions || "",
    styleSource: args.styleSource || null,
    contentSource: args.contentSource || null,
    isFiction: !!args.isFiction,
    preserveMath: args.preserveMath !== false,
    totalInputWords,
    targetMinWords: targetMin,
    targetMaxWords: targetMax,
    targetMidWords: targetMid,
    lengthRatio,
    lengthMode,
    numChunks,
    chunkTargetWords,
    currentChunk: 0,
    globalSkeleton: null,
    stitchReport: null,
    finalOutput: null,
    finalWordCount: null,
    errorMessage: null,
    createdAt: ts,
    updatedAt: ts,
  });

  // Create one chunk record per section. Each chunk's target scales with its
  // own input size so distribution stays even.
  for (let i = 0; i < chunks.length; i++) {
    const chunkInputWords = countWords(chunks[i]);
    const chunkTarget = Math.max(1, Math.round(chunkInputWords * lengthRatio));
    await storage.createReconstructionChunk({
      jobId: job.id,
      chunkIndex: i,
      chunkInputText: chunks[i],
      chunkInputWords,
      targetWords: chunkTarget,
      minWords: Math.floor(chunkTarget * 0.85),
      maxWords: Math.ceil(chunkTarget * 1.15),
      chunkOutputText: null,
      actualWords: null,
      chunkDelta: null,
      retryCount: 0,
      status: "pending",
      errorMessage: null,
      createdAt: ts,
      updatedAt: ts,
    });
  }

  console.log(`[CC] Job ${job.id} initialized: ${totalInputWords} words in -> target ${targetMin}-${targetMax} (mid ${targetMid}), ratio ${lengthRatio.toFixed(2)} (${lengthMode}), ${numChunks} chunks @ ~${chunkTargetWords} words.`);
  return job;
}

// ---------------------------------------------------------------------------
// The three passes
// ---------------------------------------------------------------------------

async function runSkeletonExtraction(jobId: number): Promise<any> {
  const job = await storage.getReconstructionJob(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  // Resume support: if a skeleton was already extracted before an interruption,
  // reuse it instead of paying for the call again.
  if (job.globalSkeleton && typeof job.globalSkeleton === "object") {
    console.log(`[CC] Job ${jobId} skeleton already present — skipping extraction (resume).`);
    return job.globalSkeleton;
  }

  await storage.updateReconstructionJob(jobId, { status: "skeleton_extraction", updatedAt: nowIso() });

  const prompt = buildSkeletonPrompt(job.originalText);
  const result = await generateWithFailover(prompt, 3000);
  const skeleton = extractJson(result.text) || { thesis: "", outline: [], keyTerms: [], commitmentLedger: {}, entities: [], _raw: result.text };

  await storage.updateReconstructionJob(jobId, { globalSkeleton: skeleton, updatedAt: nowIso() });
  console.log(`[CC] Job ${jobId} skeleton extracted via ${result.provider}.`);
  return skeleton;
}

async function runChunkProcessing(jobId: number): Promise<void> {
  const job = await storage.getReconstructionJob(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  await storage.updateReconstructionJob(jobId, { status: "chunk_processing", updatedAt: nowIso() });

  const skeletonBlock = formatSkeleton(job.globalSkeleton);
  const lengthGuidance = LENGTH_GUIDANCE[(job.lengthMode as LengthMode)] || LENGTH_GUIDANCE.maintain;

  const allChunks = await storage.getReconstructionChunks(jobId);
  // Running summary of prior chunks' deltas — the cross-chunk coherence channel.
  const priorDeltaLines: string[] = [];

  for (const chunk of allChunks) {
    if (chunk.status === "complete") {
      // Already done (resumed job): still feed its delta forward.
      const d = chunk.chunkDelta as any;
      if (d?.newClaims?.length) {
        priorDeltaLines.push(`Section ${chunk.chunkIndex + 1}: ${(d.newClaims || []).slice(0, 5).join("; ")}`);
      }
      continue;
    }

    await storage.updateReconstructionChunk(chunk.id, { status: "processing", updatedAt: nowIso() });

    const priorDeltas = priorDeltaLines.slice(-25).join("\n");
    const prompt = buildChunkPrompt({
      chunkText: chunk.chunkInputText,
      skeletonBlock,
      customInstructions: job.customInstructions || "Reconstruct this section faithfully, improving clarity and flow.",
      styleSource: job.styleSource,
      contentSource: job.contentSource,
      priorDeltas,
      targetWords: chunk.targetWords,
      minWords: chunk.minWords,
      maxWords: chunk.maxWords,
      chunkInputWords: chunk.chunkInputWords,
      lengthGuidance,
      chunkIndex: chunk.chunkIndex,
      totalChunks: job.numChunks,
      isFiction: job.isFiction,
      preserveMath: job.preserveMath,
    });

    try {
      const maxTokens = Math.min(8000, Math.max(1500, Math.ceil(chunk.maxWords * 2)));
      let resp = await generateWithFailover(prompt, maxTokens);
      let parsed = parseChunkResponse(resp.text);
      let outputText = parsed.text;
      let actualWords = countWords(outputText);
      let retryCount = 0;

      // Retry if substantially below target.
      if (actualWords < chunk.minWords * 0.8 && chunk.targetWords > 50) {
        console.log(`[CC] Job ${jobId} chunk ${chunk.chunkIndex + 1}: ${actualWords} words < target ${chunk.targetWords}. Expanding.`);
        const retry = await generateWithFailover(
          buildExpansionRetryPrompt(outputText, actualWords, chunk.targetWords, chunk.minWords, chunk.maxWords),
          maxTokens
        );
        if (countWords(retry.text) > actualWords) {
          outputText = retry.text.trim();
          actualWords = countWords(outputText);
        }
        retryCount++;
      }

      // Retry if substantially above target.
      if (actualWords > chunk.maxWords * 1.2 && chunk.maxWords > 50) {
        console.log(`[CC] Job ${jobId} chunk ${chunk.chunkIndex + 1}: ${actualWords} words > max ${chunk.maxWords}. Compressing.`);
        const retry = await generateWithFailover(
          buildCompressionRetryPrompt(outputText, actualWords, chunk.targetWords, chunk.minWords, chunk.maxWords),
          maxTokens
        );
        if (countWords(retry.text) > 0) {
          outputText = retry.text.trim();
          actualWords = countWords(outputText);
        }
        retryCount++;
      }

      await storage.updateReconstructionChunk(chunk.id, {
        chunkOutputText: outputText,
        actualWords,
        chunkDelta: parsed.delta || {},
        retryCount,
        status: "complete",
        updatedAt: nowIso(),
      });
      await storage.updateReconstructionJob(jobId, { currentChunk: chunk.chunkIndex + 1, updatedAt: nowIso() });

      const d = parsed.delta as any;
      if (d?.newClaims?.length) {
        priorDeltaLines.push(`Section ${chunk.chunkIndex + 1}: ${(d.newClaims || []).slice(0, 5).join("; ")}`);
      }

      console.log(`[CC] Job ${jobId} chunk ${chunk.chunkIndex + 1}/${job.numChunks} complete via ${resp.provider}: ${actualWords} words (target ${chunk.targetWords}).`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[CC] Job ${jobId} chunk ${chunk.chunkIndex + 1} failed: ${msg}. Falling back to source text.`);
      // Never drop content: fall back to the original section text so the
      // document stays complete even if one chunk's LLM call fails.
      await storage.updateReconstructionChunk(chunk.id, {
        chunkOutputText: chunk.chunkInputText,
        actualWords: chunk.chunkInputWords,
        chunkDelta: { error: msg },
        status: "failed",
        errorMessage: msg,
        updatedAt: nowIso(),
      });
      await storage.updateReconstructionJob(jobId, { currentChunk: chunk.chunkIndex + 1, updatedAt: nowIso() });
    }

    // Light pacing between chunks to avoid provider rate limits.
    await sleep(600);
  }

  console.log(`[CC] Job ${jobId} all chunks processed.`);
}

async function runStitchAndAssemble(jobId: number): Promise<string> {
  const job = await storage.getReconstructionJob(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  await storage.updateReconstructionJob(jobId, { status: "stitching", updatedAt: nowIso() });

  const chunks = await storage.getReconstructionChunks(jobId);
  const skeletonBlock = formatSkeleton(job.globalSkeleton);

  // Stitch audit operates on compact deltas only (never the full chunks), so it
  // scales to many chunks without blowing the context window.
  const deltaReports = chunks
    .map((c) => {
      const d = (c.chunkDelta as any) || {};
      const claims = (d.newClaims || []).slice(0, 4).join("; ");
      const conflicts = (d.conflicts || []).filter(Boolean).join("; ");
      return `Section ${c.chunkIndex + 1} (${c.actualWords ?? 0}w): claims: ${claims || "—"}${conflicts ? ` | CONFLICTS: ${conflicts}` : ""}`;
    })
    .join("\n");

  let stitchReport: any = null;
  try {
    const stitch = await generateWithFailover(buildStitchPrompt(skeletonBlock, deltaReports), 2500);
    stitchReport = extractJson(stitch.text) || { raw: stitch.text };
    const conflictCount = Array.isArray(stitchReport?.conflicts) ? stitchReport.conflicts.length : 0;
    console.log(`[CC] Job ${jobId} stitch audit complete: ${conflictCount} conflict(s) flagged.`);
  } catch (err) {
    console.warn(`[CC] Job ${jobId} stitch audit failed (non-fatal): ${err instanceof Error ? err.message : String(err)}`);
  }

  // Assemble final output from the stored chunk outputs in order.
  let finalOutput = "";
  let totalWords = 0;
  for (const c of chunks) {
    const text = (c.chunkOutputText || "").trim();
    if (text) {
      finalOutput += text + "\n\n";
      totalWords += c.actualWords ?? countWords(text);
    }
  }
  finalOutput = finalOutput.trim();

  await storage.updateReconstructionJob(jobId, {
    stitchReport,
    finalOutput,
    finalWordCount: totalWords,
    status: "complete",
    updatedAt: nowIso(),
  });

  console.log(`[CC] Job ${jobId} complete: ${totalWords} words (target ${job.targetMinWords}-${job.targetMaxWords}).`);
  return finalOutput;
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

// Runs the full pipeline for an already-initialized job. Designed to be called
// in the background (fire-and-forget) — progress + result are read from the DB.
export async function runReconstruction(jobId: number): Promise<void> {
  try {
    await runSkeletonExtraction(jobId);
    await runChunkProcessing(jobId);
    await runStitchAndAssemble(jobId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[CC] Job ${jobId} failed: ${msg}`);
    await storage.updateReconstructionJob(jobId, { status: "failed", errorMessage: msg, updatedAt: nowIso() });
  }
}

// Startup recovery: the orchestrator runs in-process (fire-and-forget), so a
// server restart mid-job would otherwise leave the job stuck in a non-terminal
// state forever. Because all state is persisted in Postgres and the pipeline is
// resume-safe (skeleton reused if present, completed chunks skipped and their
// deltas fed forward), we simply re-drive any incomplete jobs on boot.
export async function resumeInterruptedReconstructions(): Promise<void> {
  try {
    const jobs = await storage.getIncompleteReconstructionJobs();
    if (!jobs.length) return;
    console.log(`[CC] Resuming ${jobs.length} interrupted reconstruction job(s) after restart.`);
    for (const job of jobs) {
      runReconstruction(job.id).catch((err) => {
        console.error(`[CC] Resume of job ${job.id} crashed:`, err);
      });
    }
  } catch (err) {
    console.error(`[CC] Failed to scan for interrupted jobs:`, err);
  }
}
