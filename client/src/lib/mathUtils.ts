// Global MathJax type definition
declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
      startup?: {
        promise?: Promise<void>;
      };
    };
    mathJaxReady?: boolean;
  }
}

/**
 * Universal MathJax rendering utility
 * @param element - HTML element containing math content
 * @returns Promise that resolves when math is rendered
 */
export async function renderMathInElement(element: HTMLElement | null): Promise<void> {
  if (!element) return;

  try {
    // Wait for MathJax to be ready
    if (!window.MathJax) {
      await new Promise((resolve) => {
        const checkMathJax = () => {
          if (window.mathJaxReady) {
            resolve(true);
          } else {
            setTimeout(checkMathJax, 100);
          }
        };
        checkMathJax();
      });
    }

    if (window.MathJax && window.MathJax.typesetPromise) {
      await window.MathJax.startup?.promise;
      await window.MathJax.typesetPromise([element]);
    }
  } catch (error) {
    console.warn('MathJax rendering error:', error);
  }
}

/**
 * Convert markdown text to HTML with proper math preservation
 * @param markdown - Markdown text with LaTeX math notation
 * @returns HTML string with preserved math
 */
export function convertMarkdownWithMath(markdown: string): string {
  let html = markdown;
  
  // Store math expressions to protect them during markdown conversion
  const mathBlocks: string[] = [];
  let mathIndex = 0;
  
  // Store display math blocks ($$...$$)
  html = html.replace(/\$\$([^$]+?)\$\$/g, (match, content) => {
    const placeholder = `__MATH_DISPLAY_${mathIndex}__`;
    mathBlocks[mathIndex] = `$$${content.trim()}$$`;
    mathIndex++;
    return placeholder;
  });
  
  // Store inline math ($...$)
  html = html.replace(/\$([^$\n]+?)\$/g, (match, content) => {
    const placeholder = `__MATH_INLINE_${mathIndex}__`;
    mathBlocks[mathIndex] = `$${content.trim()}$`;
    mathIndex++;
    return placeholder;
  });
  
  // Store LaTeX parentheses notation
  html = html.replace(/\\\\?\(([^)]+?)\\\\?\)/g, (match, content) => {
    const placeholder = `__MATH_INLINE_${mathIndex}__`;
    mathBlocks[mathIndex] = `\\(${content.trim()}\\)`;
    mathIndex++;
    return placeholder;
  });
  
  // Store LaTeX bracket notation
  html = html.replace(/\\\\?\[([^\]]+?)\\\\?\]/g, (match, content) => {
    const placeholder = `__MATH_DISPLAY_${mathIndex}__`;
    mathBlocks[mathIndex] = `\\[${content.trim()}\\]`;
    mathIndex++;
    return placeholder;
  });
  
  // Convert markdown formatting (avoiding math placeholders)
  html = html.replace(/\*\*((?!__MATH_)[^*]+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*((?!__MATH_)[^*]+?)\*/g, '<em>$1</em>');
  
  // Convert headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>');
  
  // Convert code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded-md my-2 overflow-x-auto"><code>$1</code></pre>');
  
  // Convert inline code (avoiding math)
  html = html.replace(/`((?!__MATH_)[^`]+?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>');
  
  // Convert lists
  html = html.replace(/^\d+\.\s+(.*)$/gim, '<li class="ml-4">$1</li>');
  html = html.replace(/^[-*]\s+(.*)$/gim, '<li class="ml-4">$1</li>');
  
  // Convert line breaks and paragraphs
  html = html.replace(/\n\n/g, '</p><p class="mb-3">');
  html = `<p class="mb-3">${html}</p>`;
  html = html.replace(/\n/g, '<br>');
  
  // Clean up empty paragraphs
  html = html.replace(/<p class="mb-3"><\/p>/g, '');
  html = html.replace(/<p class="mb-3"><br><\/p>/g, '');
  
  // Restore math notation
  for (let i = 0; i < mathBlocks.length; i++) {
    html = html.replace(`__MATH_DISPLAY_${i}__`, mathBlocks[i]);
    html = html.replace(`__MATH_INLINE_${i}__`, mathBlocks[i]);
  }
  
  return html;
}

/**
 * Utility to render math in multiple elements
 * @param elements - Array of HTML elements containing math content
 */
export async function renderMathInElements(elements: HTMLElement[]): Promise<void> {
  try {
    if (!window.MathJax) {
      await new Promise((resolve) => {
        const checkMathJax = () => {
          if (window.mathJaxReady) {
            resolve(true);
          } else {
            setTimeout(checkMathJax, 100);
          }
        };
        checkMathJax();
      });
    }

    if (window.MathJax && window.MathJax.typesetPromise) {
      await window.MathJax.startup?.promise;
      await window.MathJax.typesetPromise(elements);
    }
  } catch (error) {
    console.warn('MathJax rendering error:', error);
  }
}