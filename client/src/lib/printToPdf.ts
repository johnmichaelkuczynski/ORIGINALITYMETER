/**
 * Dependency-free PDF generation via the browser's native print-to-PDF.
 * Replaces jsPDF / html2pdf.js (both blocked by the package security firewall).
 */

export function escapeHtml(text: string): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const BASE_STYLES = `
  @media print {
    @page { margin: 0.75in; size: letter; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
  body {
    font-family: 'Times New Roman', serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #000;
    background: #fff;
    margin: 0;
    padding: 24px;
  }
  h1 { font-size: 20pt; font-weight: bold; margin: 0 0 16px 0; page-break-after: avoid; }
  h2 { font-size: 16pt; font-weight: bold; margin: 20px 0 8px 0; page-break-after: avoid; }
  h3 { font-size: 13pt; font-weight: bold; margin: 14px 0 6px 0; page-break-after: avoid; }
  p { margin: 0 0 10px 0; text-align: justify; orphans: 2; widows: 2; }
  ul, ol { margin: 0 0 12px 24px; }
  li { margin: 0 0 4px 0; }
  blockquote { margin: 6px 0 6px 16px; padding-left: 12px; border-left: 3px solid #999; color: #333; font-style: italic; }
  hr { border: none; border-top: 1px solid #999; margin: 12px 0; }
  .muted { color: #666; font-size: 10pt; }
  strong { font-weight: bold; }
  em { font-style: italic; }
  mjx-container[display="true"] { margin: 12px 0 !important; text-align: center; page-break-inside: avoid; }
`;

function buildHtmlDocument(title: string, bodyHtml: string, withMathJax: boolean): string {
  const mathJaxHead = withMathJax
    ? `
    <script>
      window.MathJax = {
        tex: {
          inlineMath: [['\\\\(', '\\\\)'], ['$', '$']],
          displayMath: [['\\\\[', '\\\\]'], ['$$', '$$']],
          processEscapes: true
        },
        startup: {
          ready() {
            MathJax.startup.defaultReady();
            MathJax.startup.promise.then(() => {
              setTimeout(() => { window.print(); }, 400);
            });
          }
        }
      };
    </script>
    <script async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>`
    : "";

  const autoPrint = withMathJax
    ? `<script>setTimeout(() => { if (!window.MathJax) { window.print(); } }, 3000);</script>`
    : `<script>window.onload = () => { setTimeout(() => window.print(), 300); };</script>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  ${mathJaxHead}
  <style>${BASE_STYLES}</style>
</head>
<body class="math-container">
${bodyHtml}
${autoPrint}
</body>
</html>`;
}

/**
 * Open a print window with a fully-formed HTML body and trigger the print dialog.
 * The user chooses "Save as PDF" as the print destination.
 */
export function printHtmlDocument(
  title: string,
  bodyHtml: string,
  options: { withMathJax?: boolean } = {}
): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to save as PDF.");
    return;
  }
  const html = buildHtmlDocument(title, bodyHtml, options.withMathJax ?? false);
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
}

/**
 * Print the rendered HTML of an existing on-page element (preserves styling and math).
 */
export function printElementById(
  elementId: string,
  title: string,
  options: { withMathJax?: boolean } = {}
): void {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with ID '${elementId}' not found`);
  }
  printHtmlDocument(title, `<h1>${escapeHtml(title)}</h1>${element.innerHTML}`, {
    withMathJax: options.withMathJax ?? true,
  });
}

/** Convert an array of strings into an HTML ordered list. */
export function toOrderedList(items: string[]): string {
  if (!items || items.length === 0) return "";
  return `<ol>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ol>`;
}

/** Convert plain multi-paragraph text into HTML paragraphs. */
export function toParagraphs(text: string): string {
  return String(text ?? "")
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}
