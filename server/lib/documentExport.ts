import fs from 'fs';
import path from 'path';
import os from 'os';


export interface ExportRequest {
  content: string;
  format: 'word' | 'pdf' | 'txt' | 'html';
  title: string;
}

/**
 * Converts markdown and LaTeX math notation to HTML for display
 * @param content - Content with markdown and LaTeX math notation
 * @returns HTML content with rendered formatting and math
 */
function convertMarkdownToHTML(content: string): string {
  let htmlContent = content;
  
  // Convert bold markdown **text** to <strong>
  htmlContent = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert italic markdown *text* to <em>
  htmlContent = htmlContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert headers
  htmlContent = htmlContent.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  htmlContent = htmlContent.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  htmlContent = htmlContent.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Convert inline math $...$ to HTML with MathJax
  htmlContent = htmlContent.replace(/\$([^$]+)\$/g, '<span class="math-inline">\\($1\\)</span>');
  
  // Convert display math $$...$$ to HTML with MathJax
  htmlContent = htmlContent.replace(/\$\$([^$]+)\$\$/g, '<div class="math-display">\\[$1\\]</div>');
  
  // Convert double line breaks to paragraphs
  htmlContent = htmlContent.replace(/\n\n/g, '</p><p>');
  htmlContent = `<p>${htmlContent}</p>`;
  
  // Convert single line breaks to <br>
  htmlContent = htmlContent.replace(/\n/g, '<br>');
  
  // Clean up empty paragraphs
  htmlContent = htmlContent.replace(/<p><\/p>/g, '');
  htmlContent = htmlContent.replace(/<p><br><\/p>/g, '');
  
  return htmlContent;
}

/**
 * Converts markdown to plain text for non-HTML formats
 * @param content - Content with markdown formatting
 * @returns Plain text with markdown removed
 */
function convertMarkdownToPlainText(content: string): string {
  let plainText = content;
  
  // Remove bold and italic markdown
  plainText = plainText.replace(/\*\*(.*?)\*\*/g, '$1');
  plainText = plainText.replace(/\*(.*?)\*/g, '$1');
  
  // Convert headers to plain text with extra spacing
  plainText = plainText.replace(/^### (.*$)/gim, '\n$1\n');
  plainText = plainText.replace(/^## (.*$)/gim, '\n$1\n');
  plainText = plainText.replace(/^# (.*$)/gim, '\n$1\n');
  
  // Clean up math notation for plain text
  plainText = plainText.replace(/\$\$([^$]+)\$\$/g, '\n\n[$1]\n\n');
  plainText = plainText.replace(/\$([^$]+)\$/g, '[$1]');
  
  return plainText;
}

/**
 * Exports document content in the specified format
 * @param request - Export request parameters
 * @returns Buffer containing the exported document
 */
export async function exportDocument(request: ExportRequest): Promise<Buffer> {
  const { content, format, title } = request;
  
  try {
    switch (format) {
      case 'txt':
        // For text format, preserve the original content structure if it's already plain text
        const txtContent = content.includes('<') ? convertMarkdownToPlainText(content) : content;
        return Buffer.from(`${title}\n${'='.repeat(title.length)}\n\n${txtContent}`, 'utf8');
        
      case 'html':
        const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <script>
        window.MathJax = {
            tex: {
                inlineMath: [['\\\\(', '\\\\)']],
                displayMath: [['\\\\[', '\\\\]']]
            }
        };
    </script>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        .math-display {
            text-align: center;
            margin: 20px 0;
        }
        .math-inline {
            display: inline;
        }
        h1, h2, h3 {
            color: #333;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="content">
        ${convertMarkdownToHTML(content)}
    </div>
</body>
</html>`;
        return Buffer.from(htmlTemplate, 'utf8');
        
      case 'word':
        // Create a simple DOCX-compatible format using HTML
        const htmlForWord = convertMarkdownToHTML(content);
        const wordDocument = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Times New Roman', serif; line-height: 1.6; margin: 40px; }
    h1 { color: #000; font-size: 24px; }
    h2 { color: #000; font-size: 20px; }
    h3 { color: #000; font-size: 16px; }
    p { margin: 12px 0; }
    strong { font-weight: bold; }
    em { font-style: italic; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div>${htmlForWord}</div>
</body>
</html>`;
        return Buffer.from(wordDocument, 'utf8');
        
      case 'pdf': {
        const PDFDocument = (await import('pdfkit')).default;
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));

        // Title
        doc.font('Helvetica-Bold').fontSize(20).text(title, { align: 'left' });
        doc.moveDown();

        // Body: strip HTML tags and markdown down to plain text
        let body = content;
        if (body.includes('<')) {
          body = body
            .replace(/<\/(h1|h2|h3|p|div|li)>/gi, '\n')
            .replace(/<li[^>]*>/gi, '\u2022 ')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
        }
        body = convertMarkdownToPlainText(body);

        const sections = body.split(/\n\s*\n/);
        doc.font('Helvetica').fontSize(12);
        for (const section of sections) {
          const text = section.trim();
          if (!text) continue;
          doc.text(text, { align: 'left' });
          doc.moveDown(0.6);
        }

        const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
          doc.on('end', () => resolve(Buffer.concat(chunks)));
          doc.on('error', reject);
          doc.end();
        });
        return pdfBuffer;
      }
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error) {
    console.error('Error exporting document:', error);
    throw new Error(`Document export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}