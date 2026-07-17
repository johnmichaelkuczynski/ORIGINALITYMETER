---
name: ESM require() in server/routes.ts
description: routes.ts is an ES module; require() throws at runtime even though it builds fine
---

# require() is not defined in server/routes.ts

`server/routes.ts` (and the server generally) runs as ES modules (tsx/esbuild).
`require('fs')`, `require('@sendgrid/mail')`, etc. compile fine but throw
`ReferenceError: require is not defined` at runtime when the code path executes.

**Why:** The build does not catch it because esbuild leaves `require` as-is; the
error only surfaces when the specific route runs.

**How to apply:** Use top-of-file `import` statements (e.g. `import fs from "fs"`)
instead of `require()`. If you see runtime `require is not defined` errors, grep
`server/routes.ts` for remaining `require(` calls. Note: a latent
`require('@sendgrid/mail')` still exists in the SendGrid email path.
