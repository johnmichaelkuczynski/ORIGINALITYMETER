---
name: LLM model names must be validated against the live API key
description: Hardcoded model names break silently; this key only has access to specific newer models
---

# LLM model names are key/account-specific and go stale

The app hardcoded model names that returned errors on the configured keys, which
made the whole app appear broken ("nothing works"):
- Anthropic: old names (claude-sonnet-4-20250514, claude-3-5/3-7-sonnet) → 404.
  Working: `claude-sonnet-4-5-20250929`.
- Perplexity: `llama-3.1-sonar-*` → 400 invalid_model. Working: `sonar`.
- xAI: `grok-2-1212` → "Model not found". Working: `grok-4.3` (list via GET
  https://api.x.ai/v1/models).
- OpenAI `gpt-4o` and DeepSeek `deepseek-chat` were fine.

**Why:** Providers retire model snapshots and a given API key only has access to
a subset. A 404/400 model error cascades into "everything fails" when that model
is the default provider (Anthropic is the app default).

**How to apply:** When an AI feature fails, first curl the provider with a tiny
request to confirm the model name is valid for THIS key before debugging app
logic. To find valid models: Anthropic/xAI/OpenAI expose `/v1/models`; Perplexity
lists them in docs. The in-app "System Diagnostics" page (/diagnostics,
POST /api/diagnostics/run) pings every provider live and surfaces these fast.
Note Perplexity requires max_tokens >= 16.
