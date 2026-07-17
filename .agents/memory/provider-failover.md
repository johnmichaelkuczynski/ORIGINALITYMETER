---
name: AI provider automatic failover
description: Core analysis never depends on a single provider/key; it falls through a priority chain
---

# Automatic AI provider failover

The core analysis engine does NOT call a single provider directly. It routes
through a shared failover helper that tries providers in priority order and
returns the first success: Anthropic → OpenAI → DeepSeek → xAI → Perplexity.
A provider is attempted only if its API key is present; a thrown error or empty
response moves on to the next. Only if ALL configured providers fail does the
call throw.

**Why:** A single stale model name or dead key previously made the whole app
look broken ("nothing works"). Failover means one bad key/provider degrades
gracefully instead of taking the app down.

**How to apply:**
- New LLM features should call the failover helper, not a provider SDK directly,
  so they inherit resilience. The helper takes (prompt, maxTokens) and returns
  { text, provider, attempts }.
- Do not re-add hard guards like "if (!ANTHROPIC_API_KEY) throw" before analysis —
  check that AT LEAST ONE provider is available instead, or failover is defeated.
- Perplexity is last on purpose (search-tuned, weaker at clean JSON); it also
  needs maxTokens >= 16.
- The /diagnostics page has a "failover" check that simulates a primary outage
  and confirms a real provider recovers — keep it green after provider changes.
