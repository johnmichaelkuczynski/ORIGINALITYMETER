---
name: Cross-Chunk Coherence (long-document generation)
description: How the Originality Meter rebuilds long documents coherently instead of naive chunk-and-join "Frankenstein" output.
---

# Cross-Chunk Coherence (CC)

The naive long-text path chunked at ~800 words and joined with `\n\n`, producing
"Frankenstein" output (terminology drift, contradictions, repetition, no arc).
The fix is a three-pass, DB-backed pipeline.

**The three passes (server/lib/crossChunkCoherence.ts):**
1. Skeleton extraction — one LLM call produces thesis, outline, key terms,
   commitment ledger (asserts/rejects/assumes), entities. This is the single
   source of structural truth every chunk must honor.
2. Constrained chunk processing — each chunk is prompted with the skeleton +
   a running summary of *prior chunks' delta reports* (the cross-chunk channel),
   plus hard length targets; retries once if output is <80% min or >120% max.
3. Stitch audit + assembly — final LLM call audits the compact per-chunk deltas
   (never the full text, so it scales) for contradictions/drift/redundancy/gaps,
   then chunk outputs are concatenated in order.

**Why these choices (durable):**
- State lives in external Neon Postgres (`reconstruction_jobs` +
  `reconstruction_chunks`), NOT in memory — the user emphatically required long
  jobs to survive restarts. The orchestrator is fire-and-forget in-process, so a
  startup sweeper (`resumeInterruptedReconstructions`, called from
  `registerRoutes`) re-drives any job whose status is not complete/failed. The
  pipeline is resume-safe: skeleton is reused if already present, completed
  chunks are skipped and their deltas still fed forward.
- API is async: POST `/api/reconstruction/start` returns a jobId immediately;
  client polls GET `/api/reconstruction/:id`. Frontend poller must wrap its body
  in try/catch (it runs in a detached setTimeout — an uncaught throw becomes an
  unhandled rejection and freezes the UI); tolerate a few transient errors.
- All LLM calls go through `generateWithFailover(prompt, maxTokens)` (returns
  `{text, provider, providerLabel, attempts}`), never a direct provider client.
- On a chunk LLM failure, fall back to the original source text for that section
  so the document is never left with a hole.

**Known deferred gap:** `/api/reconstruction/:id` has no authz (sequential IDs).
Acceptable only because the app has no auth/user system yet (same as
`/api/analysis/:id`); add ownership checks when Google login / auth lands.
