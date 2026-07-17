---
name: Build gate (vite/esbuild, not tsc)
description: Which command actually gates this project's build/deploy, and why tsc errors are misleading
---

# The real build gate is vite + esbuild, NOT `npm run check`

`npm run check` (`tsc --noEmit`) fails **project-wide** and always has — it reports
hundreds of JSX/parse errors (TS17002, TS1128, TS1005) across many untouched files
(e.g. `AnalysisTabs.tsx`, `AdvancedComparison.tsx`, `ComprehensiveReport.tsx`).

**Why:** the project's tsc setup does not cleanly parse the codebase's JSX/TS dialect;
errors cascade. This is a pre-existing condition, not a regression.

**How to apply:** Validate changes with `npm run build` (runs `vite build && esbuild`)
and the dev server (HTTP 200), NOT with `npm run check`. If a code review or tool
reports tsc failures, confirm whether they pre-exist and whether `vite build` still
exits 0 before treating them as your regression. A clean `vite build` (e.g.
"N modules transformed", exit 0) means the production toolchain accepts the code.
