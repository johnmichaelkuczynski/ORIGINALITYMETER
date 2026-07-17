import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathRendererProps {
  text: string;
  className?: string;
}

export default function MathRenderer({ text, className = "" }: MathRendererProps) {
  if (!text) return null;
  
  // Function to detect and render LaTeX math notation
  const renderMathText = (input: string) => {
    // Split text by math delimiters and render accordingly
    const parts = [];
    let currentIndex = 0;
    
    // Handle block math ($$...$$)
    const blockMathRegex = /\$\$([^$]+)\$\$/g;
    // Handle inline math ($...$)
    const inlineMathRegex = /\$([^$\n]+)\$/g;
    
    let match;
    let lastIndex = 0;
    
    // First handle block math
    while ((match = blockMathRegex.exec(input)) !== null) {
      // Add text before math
      if (match.index > lastIndex) {
        const textBefore = input.slice(lastIndex, match.index);
        parts.push(renderInlineMath(textBefore, parts.length));
      }
      
      // Add block math with error handling
      try {
        parts.push(
          <div key={parts.length} className="my-4 text-center">
            <BlockMath math={match[1]} />
          </div>
        );
      } catch (error) {
        parts.push(
          <div key={parts.length} className="my-4 text-center bg-red-50 p-2 rounded">
            <code>$$${match[1]}$$</code>
          </div>
        );
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Handle remaining text with inline math
    if (lastIndex < input.length) {
      const remainingText = input.slice(lastIndex);
      parts.push(renderInlineMath(remainingText, parts.length));
    }
    
    return parts;
  };
  
  const renderInlineMath = (text: string, keyBase: number) => {
    const parts = [];
    const inlineMathRegex = /\$([^$\n]+)\$/g;
    let lastIndex = 0;
    let match;
    
    while ((match = inlineMathRegex.exec(text)) !== null) {
      // Add regular text before math
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      
      // Add inline math with error handling
      try {
        parts.push(
          <InlineMath key={`${keyBase}-${parts.length}`} math={match[1]} />
        );
      } catch (error) {
        parts.push(
          <code key={`${keyBase}-${parts.length}`} className="bg-red-50 px-1 rounded">
            ${match[1]}$
          </code>
        );
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return parts.length > 0 ? (
      <span key={keyBase}>{parts}</span>
    ) : null;
  };
  
  return (
    <div className={className}>
      {renderMathText(text)}
    </div>
  );
}