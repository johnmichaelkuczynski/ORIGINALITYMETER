/**
 * Document chunking utilities for handling large documents
 */

export interface DocumentChunk {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  wordCount: number;
  hasmath: boolean;
}

export interface ChunkingOptions {
  maxWordsPerChunk: number;
  overlapWords: number;
  preserveParagraphs: boolean;
  preserveMath: boolean;
}

/**
 * Splits a large document into manageable chunks for processing
 * @param content - The full document content
 * @param options - Chunking configuration
 * @returns Array of document chunks
 */
export function chunkDocument(content: string, options: ChunkingOptions = {
  maxWordsPerChunk: 800,
  overlapWords: 100,
  preserveParagraphs: true,
  preserveMath: true
}): DocumentChunk[] {
  const { maxWordsPerChunk, overlapWords, preserveParagraphs, preserveMath } = options;
  
  if (!content.trim()) {
    return [];
  }

  // Preserve math notation if requested
  const mathBlocks: string[] = [];
  let processedContent = content;
  
  if (preserveMath) {
    let mathIndex = 0;
    
    // Store display math blocks ($$...$$)
    processedContent = processedContent.replace(/\$\$([^$]+)\$\$/g, (match, mathContent) => {
      const placeholder = `__MATH_DISPLAY_${mathIndex}__`;
      mathBlocks[mathIndex] = match;
      mathIndex++;
      return placeholder;
    });
    
    // Store inline math blocks ($...$)
    processedContent = processedContent.replace(/\$([^$\n]+)\$/g, (match, mathContent) => {
      const placeholder = `__MATH_INLINE_${mathIndex}__`;
      mathBlocks[mathIndex] = match;
      mathIndex++;
      return placeholder;
    });
  }

  const chunks: DocumentChunk[] = [];
  
  if (preserveParagraphs) {
    // Split by paragraphs first, then group into chunks
    const paragraphs = processedContent.split(/\n\s*\n/).filter(p => p.trim());
    
    let currentChunk = '';
    let currentWordCount = 0;
    let chunkStartIndex = 0;
    let actualStartIndex = 0;
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      const paragraphWords = paragraph.split(/\s+/).length;
      
      // If adding this paragraph would exceed the limit and we have content
      if (currentWordCount + paragraphWords > maxWordsPerChunk && currentChunk) {
        // Create chunk
        const chunkContent = restoreMathBlocks(currentChunk.trim(), mathBlocks);
        chunks.push({
          id: `chunk-${chunks.length + 1}`,
          content: chunkContent,
          startIndex: actualStartIndex,
          endIndex: actualStartIndex + currentChunk.length,
          wordCount: currentWordCount,
          hasmath: hasMathNotation(chunkContent)
        });
        
        // Start new chunk with overlap
        if (overlapWords > 0 && chunks.length > 0) {
          const overlapText = getLastWords(currentChunk, overlapWords);
          currentChunk = overlapText + '\n\n' + paragraph;
          currentWordCount = overlapText.split(/\s+/).length + paragraphWords;
        } else {
          currentChunk = paragraph;
          currentWordCount = paragraphWords;
        }
        
        actualStartIndex = chunkStartIndex;
        chunkStartIndex += currentChunk.length;
      } else {
        // Add paragraph to current chunk
        if (currentChunk) {
          currentChunk += '\n\n' + paragraph;
        } else {
          currentChunk = paragraph;
          chunkStartIndex = actualStartIndex;
        }
        currentWordCount += paragraphWords;
      }
    }
    
    // Add final chunk if there's remaining content
    if (currentChunk.trim()) {
      const chunkContent = restoreMathBlocks(currentChunk.trim(), mathBlocks);
      chunks.push({
        id: `chunk-${chunks.length + 1}`,
        content: chunkContent,
        startIndex: actualStartIndex,
        endIndex: actualStartIndex + currentChunk.length,
        wordCount: currentWordCount,
        hasmath: hasMathNotation(chunkContent)
      });
    }
  } else {
    // Simple word-based chunking
    const words = processedContent.split(/\s+/);
    
    for (let i = 0; i < words.length; i += maxWordsPerChunk - overlapWords) {
      const chunkWords = words.slice(i, i + maxWordsPerChunk);
      const chunkText = chunkWords.join(' ');
      const chunkContent = restoreMathBlocks(chunkText, mathBlocks);
      
      chunks.push({
        id: `chunk-${chunks.length + 1}`,
        content: chunkContent,
        startIndex: i,
        endIndex: Math.min(i + maxWordsPerChunk, words.length),
        wordCount: chunkWords.length,
        hasmath: hasMathNotation(chunkContent)
      });
    }
  }

  return chunks;
}

/**
 * Reassembles processed chunks back into a complete document
 * @param processedChunks - Array of processed chunk contents
 * @param originalChunks - Original chunks for reference
 * @returns Reassembled document
 */
export function reassembleDocument(processedChunks: string[], originalChunks: DocumentChunk[]): string {
  if (processedChunks.length !== originalChunks.length) {
    throw new Error('Processed chunks count does not match original chunks count');
  }

  // Simple reassembly - join with double line breaks
  return processedChunks.join('\n\n');
}

/**
 * Estimates the total processing time for chunked document
 * @param chunks - Array of document chunks
 * @param estimatedSecondsPerChunk - Estimated processing time per chunk
 * @returns Estimated total processing time in seconds
 */
export function estimateProcessingTime(chunks: DocumentChunk[], estimatedSecondsPerChunk: number = 30): number {
  return chunks.length * estimatedSecondsPerChunk;
}

/**
 * Gets content statistics for a document
 * @param content - Document content
 * @returns Statistics object
 */
export function getDocumentStats(content: string): {
  wordCount: number;
  characterCount: number;
  paragraphCount: number;
  mathBlockCount: number;
  estimatedChunks: number;
} {
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const characterCount = content.length;
  const paragraphCount = content.split(/\n\s*\n/).filter(p => p.trim()).length;
  const mathBlockCount = (content.match(/\$\$[^$]+\$\$|\$[^$\n]+\$/g) || []).length;
  const estimatedChunks = Math.ceil(wordCount / 800);

  return {
    wordCount,
    characterCount,
    paragraphCount,
    mathBlockCount,
    estimatedChunks
  };
}

// Helper functions

function restoreMathBlocks(text: string, mathBlocks: string[]): string {
  let restored = text;
  for (let i = 0; i < mathBlocks.length; i++) {
    restored = restored.replace(`__MATH_DISPLAY_${i}__`, mathBlocks[i]);
    restored = restored.replace(`__MATH_INLINE_${i}__`, mathBlocks[i]);
  }
  return restored;
}

function hasMathNotation(text: string): boolean {
  return /\$\$[^$]+\$\$|\$[^$\n]+\$/.test(text);
}

function getLastWords(text: string, wordCount: number): string {
  const words = text.trim().split(/\s+/);
  return words.slice(-wordCount).join(' ');
}