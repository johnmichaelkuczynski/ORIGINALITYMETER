---
name: PDF library firewall block
description: jspdf/html2pdf.js are blocked by Replit's package security firewall; what to use instead
---

# jspdf / html2pdf.js are blocked by the package-firewall

`jspdf` (every version) and anything depending on it transitively (e.g. `html2pdf.js`)
are rejected by Replit's package-firewall with a Critical CVE. A full dependency
install fails *entirely* while they are in `package.json`, which also blocks unrelated
tooling (`tsx`, `drizzle-kit`) from resolving.

**Why:** security firewall (`package-firewall.replit.local`) returns 403 on the install.
Retrying the same install will not help.

**How to apply — replacements that work:**
- **Client-side PDF:** dependency-free browser print-to-PDF. Open a popup, write an HTML
  document, call `window.print()`. (`html2canvas` is NOT blocked but is unnecessary.)
- **Server-side PDF:** `pdfkit` (a working dependency). Collect `data` chunks,
  attach `end`/`error` listeners, then end the document, resolve `Buffer.concat(chunks)`.
- Remove blocked packages with the package-management uninstall tool, not bash.
