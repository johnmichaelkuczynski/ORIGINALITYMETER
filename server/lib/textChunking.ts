export interface TextChunk {
  id: number;
  content: string;
  wordCount: number;
  startPosition: number;
  endPosition: number;
  preview: string; // First 100 characters for preview
}

export interface ChunkedDocument {
  originalText: string;
  title: string;
  totalWordCount: number;
  chunks: TextChunk[];
  chunkSize: number;
}

/**
 * Splits text into chunks while preserving sentence boundaries
 * @param text The text to chunk
 * @param targetChunkSize Target number of words per chunk (default: 500)
 * @returns Array of text chunks
 */
export function chunkText(text: string, targetChunkSize: number = 500): TextChunk[] {
  // Clean and normalize the text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Split into sentences using regex that handles various sentence endings
  const sentences = cleanText.split(/(?<=[.!?])\s+/);
  
  const chunks: TextChunk[] = [];
  let currentChunk = '';
  let currentWordCount = 0;
  let chunkStartPosition = 0;
  let chunkId = 1;
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;
    
    const sentenceWordCount = sentence.split(/\s+/).length;
    
    // If adding this sentence would exceed target size and we have content, create chunk
    if (currentWordCount > 0 && currentWordCount + sentenceWordCount > targetChunkSize) {
      const chunkContent = currentChunk.trim();
      chunks.push({
        id: chunkId++,
        content: chunkContent,
        wordCount: currentWordCount,
        startPosition: chunkStartPosition,
        endPosition: chunkStartPosition + chunkContent.length,
        preview: chunkContent.substring(0, 100) + (chunkContent.length > 100 ? '...' : '')
      });
      
      // Start new chunk
      chunkStartPosition += chunkContent.length + 1;
      currentChunk = sentence;
      currentWordCount = sentenceWordCount;
    } else {
      // Add sentence to current chunk
      if (currentChunk) {
        currentChunk += ' ' + sentence;
      } else {
        currentChunk = sentence;
      }
      currentWordCount += sentenceWordCount;
    }
  }
  
  // Add the last chunk if it has content
  if (currentChunk.trim()) {
    const chunkContent = currentChunk.trim();
    chunks.push({
      id: chunkId,
      content: chunkContent,
      wordCount: currentWordCount,
      startPosition: chunkStartPosition,
      endPosition: chunkStartPosition + chunkContent.length,
      preview: chunkContent.substring(0, 100) + (chunkContent.length > 100 ? '...' : '')
    });
  }
  
  return chunks;
}

/**
 * Creates a chunked document from text
 * @param text The original text
 * @param title Document title
 * @param chunkSize Target words per chunk
 * @returns ChunkedDocument object
 */
export function createChunkedDocument(
  text: string, 
  title: string, 
  chunkSize: number = 500
): ChunkedDocument {
  const chunks = chunkText(text, chunkSize);
  const totalWordCount = text.split(/\s+/).length;
  
  return {
    originalText: text,
    title,
    totalWordCount,
    chunks,
    chunkSize
  };
}

/**
 * Reconstructs text from selected chunks
 * @param chunks Array of selected chunks
 * @returns Reconstructed text
 */
export function reconstructTextFromChunks(chunks: TextChunk[]): string {
  return chunks
    .sort((a, b) => a.id - b.id) // Ensure proper order
    .map(chunk => chunk.content)
    .join(' ');
}

/**
 * Determines if text should be chunked based on word count
 * @param text The text to evaluate
 * @param threshold Word count threshold (default: 1000)
 * @returns Boolean indicating if chunking is recommended
 */
export function shouldChunkText(text: string, threshold: number = 1000): boolean {
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  return wordCount > threshold;
}