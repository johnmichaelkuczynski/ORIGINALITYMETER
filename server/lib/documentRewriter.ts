import Anthropic from "@anthropic-ai/sdk";
import { chunkDocument, reassembleDocument, getDocumentStats, DocumentChunk } from './documentChunker';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface RewriteRequest {
  sourceText: string;
  customInstructions: string;
  contentSource?: string;
  styleSource?: string;
  preserveMath: boolean;
  isFiction?: boolean;
}

export interface ChunkedRewriteRequest extends RewriteRequest {
  enableChunking?: boolean;
  maxWordsPerChunk?: number;
}

export interface StreamingRewriteRequest extends RewriteRequest {
  onChunk?: (chunk: string) => void;
}

/**
 * Rewrites a document according to custom instructions with perfect math preservation and chunking support
 * @param request - Rewrite request parameters
 * @returns Promise containing the rewritten text with preserved mathematical notation
 */
export async function rewriteDocument(request: ChunkedRewriteRequest): Promise<string> {
  try {
    const { sourceText, customInstructions, contentSource, styleSource, preserveMath, enableChunking = true, maxWordsPerChunk = 800 } = request;

    // Get document statistics
    const stats = getDocumentStats(sourceText);
    console.log(`Document stats: ${stats.wordCount} words, ${stats.mathBlockCount} math blocks, estimated ${stats.estimatedChunks} chunks`);

    // Determine if chunking is needed
    const needsChunking = enableChunking && stats.wordCount > maxWordsPerChunk;

    if (needsChunking) {
      console.log(`Large document detected (${stats.wordCount} words). Using chunked processing.`);
      return await rewriteDocumentInChunks(request, stats);
    }

    // Process as single document for smaller texts
    return await rewriteSingleDocument(request);
  } catch (error) {
    console.error('Error in rewriteDocument:', error);
    throw error;
  }
}

/**
 * Rewrites a document in chunks for large texts
 */
async function rewriteDocumentInChunks(request: ChunkedRewriteRequest, stats: any): Promise<string> {
  const { sourceText, customInstructions, contentSource, styleSource, preserveMath, maxWordsPerChunk = 800 } = request;

  // Create chunks
  const chunks = chunkDocument(sourceText, {
    maxWordsPerChunk,
    overlapWords: 100,
    preserveParagraphs: true,
    preserveMath: preserveMath || false
  });

  console.log(`Created ${chunks.length} chunks for processing`);

  const rewrittenChunks: string[] = [];

  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.wordCount} words)`);

    try {
      const chunkRequest: RewriteRequest = {
        sourceText: chunk.content,
        customInstructions: customInstructions + `\n\nNOTE: This is chunk ${i + 1} of ${chunks.length} from a larger document. Maintain consistency with the overall document style and ensure smooth transitions.`,
        contentSource,
        styleSource,
        preserveMath: preserveMath || false
      };

      const rewrittenChunk = await rewriteSingleDocument(chunkRequest);
      rewrittenChunks.push(rewrittenChunk);

      // Add small delay between chunks to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}:`, error);
      // If a chunk fails, use the original content
      rewrittenChunks.push(chunk.content);
    }
  }

  // Reassemble the document
  const reassembled = reassembleDocument(rewrittenChunks, chunks);
  console.log(`Successfully reassembled document from ${chunks.length} chunks`);
  
  return reassembled;
}

/**
 * Rewrites a single document or chunk
 */
export async function rewriteSingleDocument(request: RewriteRequest): Promise<string> {
  try {
    const { sourceText, customInstructions, contentSource, styleSource, preserveMath, isFiction } = request;

    // Default style sample if no style source provided
    const styleSample = styleSource || `One cannot have the concept of a red object without having the concept of an extended object. But the word "red" doesn't contain the word "extended." In general, our concepts are interconnected in ways in which the corresponding words are not interconnected. This is not an accidental fact about the English language or about any other language: it is inherent in what a language is that the cognitive abilities corresponding to a person's abilities to use words cannot possibly be reflected in semantic relations holding among those words. This fact in its turn is a consequence of the fact that expressions are, whereas concepts are not, digital structures, for which reason the ways in which cognitive abilities interact cannot possibly bear any significant resemblance to the ways in which expressions interact. Consequently, there is no truth to the contention that our thought-processes are identical with, or bear any resemblance to, the digital computations that mediate computer-activity.`;

    // Check word count for PROVISION 2
    const wordCount = sourceText.trim().split(/\s+/).length;
    const isShort = wordCount < 800;
    const hasCustomInstructions = customInstructions && customInstructions.trim().length > 0;
    
    // Calculate target length: 3X or 750 minimum, whichever is higher
    const tripleLength = wordCount * 3;
    const targetLength = Math.max(tripleLength, 750);

    // PROVISION 3: Use style matching, never "make it better"
    let systemPrompt = `You are an elite philosophical rewriting assistant. Your output must score 95+ on intelligence and originality metrics.

CRITICAL ANTI-BLOAT RULE: If you use ANY of these banned phrases, the rewrite FAILS:
❌ "ostensibly" ❌ "inextricably" ❌ "profound implications" ❌ "theoretical curiosity"
❌ "reveals a complex interplay" ❌ "not merely" ❌ "upon closer examination"
❌ "it is worth noting" ❌ "it should be emphasized" ❌ "inherently complex"
❌ "nuanced" ❌ "multifaceted" ❌ "sophisticated framework"
❌ "though...reveals" construction ❌ Any phrase that adds words without adding meaning

NEGATIVE EXAMPLE - DO NOT DO THIS:
Original: "One cannot have the concept of a red object without having the concept of an extended object."
BAD BLOATED REWRITE: "The architecture of our cognitive framework, though ostensibly simple, reveals a complex interplay where the notion of a red object is inextricably linked to the notion of an extended object."
This is GARBAGE. It turned 15 words into 36 words while adding ZERO new content.

CORRECT APPROACH:
Original: "One cannot have the concept of a red object without having the concept of an extended object."
GOOD REWRITE: "You can't think 'red' without thinking 'extended'. Here's why. Red is a color. Colors need surfaces. Surfaces have extent. So redness presupposes extension. Think of a red apple. The redness spreads across the apple's surface. No surface, no redness. This isn't a quirk of English. It's built into the concepts themselves."
This ADDS examples and clarification WITHOUT bloated filler.

WRITE LIKE THE ORIGINAL: Short sentences. Direct claims. No filler. No puffery. No academic posturing.${preserveMath ? ` PRESERVE ALL mathematical expressions EXACTLY using proper LaTeX: $inline$ and $$display$$.` : ''}`;
    
    // PROVISION 2 & 3: If style sample provided, add it to system prompt
    if (styleSource) {
      systemPrompt += `

STYLE SAMPLE (rewrite to match this EXACT style - not a caricature, but this precise style):
"${styleSample.substring(0, 1500)}${styleSample.length > 1500 ? '...' : ''}"

CRITICAL: Match the sentence structure, rhythm, vocabulary, logical rigor, and tone of this style sample exactly. Use the same sentence length. Use the same directness. NO BLOAT.`;
    }

    // Build user prompt
    let userPrompt = '';

    // PROVISION 1: If user provided custom instructions, use them
    if (hasCustomInstructions) {
      userPrompt += `INSTRUCTIONS (follow these exactly):
${customInstructions}

`;
    } else {
      // No custom instructions - use DEFAULT INSTRUCTIONS
      const essayOrStory = isFiction ? 'complete story' : 'complete academic essay';
      
      userPrompt += `INSTRUCTIONS:

Turn into ${essayOrStory}. Write in the style of uploaded paragraphs. 

MANDATORY STYLE RULES:
- Keep sentences SHORT (under 25 words each)
- Keep edge. Keep friction. Every sentence hard-hitting.
- NEVER use bloated phrases like "ostensibly", "inextricably", "reveals a complex interplay", "profound implications"
- NEVER create volume through puffery or placeholder content
- If the original says "X is Y" in 5 words, DON'T turn it into "The architecture of X, though ostensibly simple, reveals Y" in 15 words
- ADD LENGTH BY ADDING EXAMPLES, NOT BY ADDING FILLER WORDS

ILLUSTRATE POINTS WITH VIVID RELATABLE EXAMPLES. NEVER MAKE A STATEMENT THAT CAN BE ILLUSTRATED WITHOUT ILLUSTRATING IT. DEFINE TECHNICAL TERMS. ELIMINATE OBSCURITIES. ADD CONTENT THROUGH EXAMPLES AND CLARIFICATION, NOT BLOATED PHONY ACADEMIC PROSE.

`;
    }

    // MANDATORY PROVISIONS (ALWAYS ENFORCED UNLESS USER EXPLICITLY CONTRADICTS)
    
    // PROVISION 4: 3X expansion + 750-word minimum
    if (isShort) {
      userPrompt += `MINIMUM LENGTH: ${targetLength} words (either 3X the original length or 750 words, whichever is higher).

`;
    }
    
    // PROVISIONS 5 & 6: Complete essay or complete story (unless user contradicts)
    const essayOrStory = isFiction ? 'complete story with full narrative arc' : 'complete academic essay with introduction, body, and conclusion';
    userPrompt += `FORMAT: Turn fragment into ${essayOrStory}.

`;
    
    // PROVISION 4: Preserve edge and sharpness
    userPrompt += `PRESERVE: Keep edge, sharpness, and concision. Add clarity and support WITHOUT diluting these qualities.

`;

    if (contentSource) {
      userPrompt += `CONTENT TO INTEGRATE:
"${contentSource.substring(0, 2000)}${contentSource.length > 2000 ? '...' : ''}"

`;
    }

    userPrompt += `TEXT TO REWRITE:
"${sourceText}"

QUALITY REQUIREMENT: Output must be genius-level philosophical writing that would score 95+ on intelligence and originality analysis. Use vivid examples. Define terms. Make every sentence earn its place.

Output only the rewritten text with no preamble or meta-commentary.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: `${systemPrompt}\n\n${userPrompt}`
        }
      ],
    });

    const rewrittenText = response.content[0].type === "text" ? response.content[0].text : "";
    
    if (!rewrittenText.trim()) {
      throw new Error("Rewrite process failed to generate content");
    }

    return rewrittenText;
  } catch (error) {
    console.error("Error in document rewriting:", error);
    throw new Error(`Document rewriting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Streaming version - rewrites a single document with real-time output
 */
export async function* rewriteSingleDocumentStream(request: RewriteRequest): AsyncGenerator<string, void, unknown> {
  try {
    const { sourceText, customInstructions, contentSource, styleSource, preserveMath, isFiction } = request;

    // Default style sample if no style source provided
    const styleSample = styleSource || `One cannot have the concept of a red object without having the concept of an extended object. But the word "red" doesn't contain the word "extended." In general, our concepts are interconnected in ways in which the corresponding words are not interconnected. This is not an accidental fact about the English language or about any other language: it is inherent in what a language is that the cognitive abilities corresponding to a person's abilities to use words cannot possibly be reflected in semantic relations holding among those words. This fact in its turn is a consequence of the fact that expressions are, whereas concepts are not, digital structures, for which reason the ways in which cognitive abilities interact cannot possibly bear any significant resemblance to the ways in which expressions interact. Consequently, there is no truth to the contention that our thought-processes are identical with, or bear any resemblance to, the digital computations that mediate computer-activity.`;

    // Check word count for PROVISION 2
    const wordCount = sourceText.trim().split(/\s+/).length;
    const isShort = wordCount < 800;
    const hasCustomInstructions = customInstructions && customInstructions.trim().length > 0;
    
    // Calculate target length: 3X or 750 minimum, whichever is higher
    const tripleLength = wordCount * 3;
    const targetLength = Math.max(tripleLength, 750);

    // PROVISION 3: Use style matching, never "make it better"
    let systemPrompt = `You are an elite philosophical rewriting assistant. Your output must score 95+ on intelligence and originality metrics.

CRITICAL ANTI-BLOAT RULE: If you use ANY of these banned phrases, the rewrite FAILS:
❌ "ostensibly" ❌ "inextricably" ❌ "profound implications" ❌ "theoretical curiosity"
❌ "reveals a complex interplay" ❌ "not merely" ❌ "upon closer examination"
❌ "it is worth noting" ❌ "it should be emphasized" ❌ "inherently complex"
❌ "nuanced" ❌ "multifaceted" ❌ "sophisticated framework"
❌ "though...reveals" construction ❌ Any phrase that adds words without adding meaning

NEGATIVE EXAMPLE - DO NOT DO THIS:
Original: "One cannot have the concept of a red object without having the concept of an extended object."
BAD BLOATED REWRITE: "The architecture of our cognitive framework, though ostensibly simple, reveals a complex interplay where the notion of a red object is inextricably linked to the notion of an extended object."
This is GARBAGE. It turned 15 words into 36 words while adding ZERO new content.

CORRECT APPROACH:
Original: "One cannot have the concept of a red object without having the concept of an extended object."
GOOD REWRITE: "You can't think 'red' without thinking 'extended'. Here's why. Red is a color. Colors need surfaces. Surfaces have extent. So redness presupposes extension. Think of a red apple. The redness spreads across the apple's surface. No surface, no redness. This isn't a quirk of English. It's built into the concepts themselves."
This ADDS examples and clarification WITHOUT bloated filler.

WRITE LIKE THE ORIGINAL: Short sentences. Direct claims. No filler. No puffery. No academic posturing.${preserveMath ? ` PRESERVE ALL mathematical expressions EXACTLY using proper LaTeX: $inline$ and $$display$$.` : ''}`;
    
    // PROVISION 2 & 3: If style sample provided, add it to system prompt
    if (styleSource) {
      systemPrompt += `

STYLE SAMPLE (rewrite to match this EXACT style - not a caricature, but this precise style):
"${styleSample.substring(0, 1500)}${styleSample.length > 1500 ? '...' : ''}"

CRITICAL: Match the sentence structure, rhythm, vocabulary, logical rigor, and tone of this style sample exactly. Use the same sentence length. Use the same directness. NO BLOAT.`;
    }

    // Build user prompt
    let userPrompt = '';

    // PROVISION 1: If user provided custom instructions, use them
    if (hasCustomInstructions) {
      userPrompt += `INSTRUCTIONS (follow these exactly):
${customInstructions}

`;
    } else {
      // No custom instructions - use DEFAULT INSTRUCTIONS
      const essayOrStory = isFiction ? 'complete story' : 'complete academic essay';
      
      userPrompt += `INSTRUCTIONS:

Turn into ${essayOrStory}. Write in the style of uploaded paragraphs. 

MANDATORY STYLE RULES:
- Keep sentences SHORT (under 25 words each)
- Keep edge. Keep friction. Every sentence hard-hitting.
- NEVER use bloated phrases like "ostensibly", "inextricably", "reveals a complex interplay", "profound implications"
- NEVER create volume through puffery or placeholder content
- If the original says "X is Y" in 5 words, DON'T turn it into "The architecture of X, though ostensibly simple, reveals Y" in 15 words
- ADD LENGTH BY ADDING EXAMPLES, NOT BY ADDING FILLER WORDS

ILLUSTRATE POINTS WITH VIVID RELATABLE EXAMPLES. NEVER MAKE A STATEMENT THAT CAN BE ILLUSTRATED WITHOUT ILLUSTRATING IT. DEFINE TECHNICAL TERMS. ELIMINATE OBSCURITIES. ADD CONTENT THROUGH EXAMPLES AND CLARIFICATION, NOT BLOATED PHONY ACADEMIC PROSE.

`;
    }

    // MANDATORY PROVISIONS (ALWAYS ENFORCED UNLESS USER EXPLICITLY CONTRADICTS)
    
    // PROVISION 4: 3X expansion + 750-word minimum
    if (isShort) {
      userPrompt += `MINIMUM LENGTH: ${targetLength} words (either 3X the original length or 750 words, whichever is higher).

`;
    }
    
    // PROVISIONS 5 & 6: Complete essay or complete story (unless user contradicts)
    const essayOrStory = isFiction ? 'complete story with full narrative arc' : 'complete academic essay with introduction, body, and conclusion';
    userPrompt += `FORMAT: Turn fragment into ${essayOrStory}.

`;
    
    // PROVISION 4: Preserve edge and sharpness
    userPrompt += `PRESERVE: Keep edge, sharpness, and concision. Add clarity and support WITHOUT diluting these qualities.

`;

    if (contentSource) {
      userPrompt += `CONTENT TO INTEGRATE:
"${contentSource.substring(0, 2000)}${contentSource.length > 2000 ? '...' : ''}"

`;
    }

    userPrompt += `TEXT TO REWRITE:
"${sourceText}"

QUALITY REQUIREMENT: Output must be genius-level philosophical writing that would score 95+ on intelligence and originality analysis. Use vivid examples. Define terms. Make every sentence earn its place.

Output only the rewritten text with no preamble or meta-commentary.`;

    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: `${systemPrompt}\n\n${userPrompt}`
        }
      ],
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  } catch (error) {
    console.error("Error in streaming document rewriting:", error);
    throw new Error(`Streaming document rewriting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Solves homework assignments and problem sets with perfect mathematical notation
 * @param assignmentText - The assignment or problem set to solve
 * @returns Promise containing complete solutions
 */
export async function solveHomework(assignmentText: string): Promise<string> {
  try {
    const systemPrompt = `You are an expert academic tutor and problem solver with deep knowledge across all disciplines including mathematics, physics, chemistry, biology, economics, engineering, philosophy, literature, and more.

CRITICAL INSTRUCTIONS:
1. COMPLETE SOLUTIONS: Provide full, detailed solutions to ALL questions and problems
2. MATHEMATICAL NOTATION: Use proper LaTeX notation for all mathematical expressions: $inline$ and $$display$$
3. STEP-BY-STEP: Show all work, reasoning, and intermediate steps
4. EXPLANATIONS: Include clear explanations of concepts and methods used
5. FORMATTING: Structure solutions clearly with numbered problems/questions
6. ACCURACY: Ensure all calculations, facts, and reasoning are correct
7. COMPREHENSIVE: Address every part of multi-part questions

FOR DIFFERENT TYPES OF ASSIGNMENTS:
- Essays: Write complete, well-structured essays with proper arguments and evidence
- Problem Sets: Solve all problems with detailed mathematical work
- Analysis: Provide thorough analysis with supporting evidence
- Proofs: Present rigorous mathematical or logical proofs
- Code: Write functional, well-commented code solutions

Return complete solutions without meta-commentary or disclaimers.`;

    const userPrompt = `ASSIGNMENT TO COMPLETE:
${assignmentText}

PROVIDE: Complete solutions to all questions, problems, and tasks in this assignment with proper mathematical notation, detailed explanations, and step-by-step work.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4000,
      temperature: 0.3, // Lower temperature for more accurate solutions
      messages: [
        {
          role: "user",
          content: `${systemPrompt}\n\n${userPrompt}`
        }
      ],
    });

    const solution = response.content[0].type === "text" ? response.content[0].text : "";
    
    if (!solution.trim()) {
      throw new Error("Homework solving failed to generate solutions");
    }

    return solution;
  } catch (error) {
    console.error("Error solving homework:", error);
    throw new Error(`Homework solving failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}