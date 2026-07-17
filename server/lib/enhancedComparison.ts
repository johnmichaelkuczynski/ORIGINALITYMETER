import Anthropic from "@anthropic-ai/sdk";
interface PassageData {
  title: string;
  text: string;
  userContext?: string;
}

interface SemanticUnit {
  corePropositions: string[];
  keyVocabulary: string[];
  argumentSkeleton: {
    claims: string[];
    premises: string[];
    supportPattern: string;
  };
}

interface ComparisonVector {
  contentSimilarity: {
    lexicalOverlap: number;
    conceptualParaphraseOverlap: number;
    argumentStructureMatching: number;
  };
  stylisticSimilarity: {
    sentenceRhythm: number;
    rhetoricalDevicePatterning: number;
    toneRegister: number;
  };
  epistemicProfileSimilarity: {
    compressionDegree: number;
    abstractionLevel: number;
    inferentialChainComplexity: number;
    frictionLevel: number;
  };
  narrativeTopicalSimilarity: {
    subjectMatterOverlap: number;
    illustrativeStructure: number;
    sharedReferencePoints: number;
  };
}

interface RipOffRisk {
  label: string; // "Unrelated", "Possibly derivative", etc.
  explanation: string;
  matchingSections?: string[];
}

interface DevelopmentRelationship {
  direction: 'A develops B' | 'B develops A' | 'mutual development' | 'no development';
  description: string;
}

interface DoctrinalAffinity {
  classification: 'Doctrinally kindred' | 'Methodologically kindred' | 'Doctrinally opposed' | 'Methodologically opposed' | 'Ambiguous / Neutral';
  justification: string;
  contentAgreement: number; // 0-10
  methodologicalSimilarity: number; // 0-10
}

interface AuthorProfile {
  intellectualInterests: string[];
  intellectualStrengths: string[];
  cognitiveWeaknesses: string[];
  emotionalSignatures: string[];
  personalAgenda: string;
}

interface ComparativeProfile {
  sharedTraits: string[];
  conflictingTraits: string[];
  authoralStance: string;
}

export interface EnhancedComparisonResult {
  overallSimilarityScore: number; // 0-100
  ripOffRisk: RipOffRisk;
  developmentRelationship: DevelopmentRelationship;
  doctrinalAffinity: DoctrinalAffinity;
  authorProfiles: {
    textA: AuthorProfile;
    textB: AuthorProfile;
  };
  comparativeProfile: ComparativeProfile;
  comparisonVectors: ComparisonVector;
  detailedAnalysis: string;
}

function preprocessText(text: string): { normalized: string; sentences: string[]; paragraphs: string[] } {
  // Normalize case and clean punctuation while preserving syntactic markers
  const normalized = text.toLowerCase()
    .replace(/[""'']/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/[^\w\s.,;:!?()[\]{}"'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Split into sentences (basic implementation)
  const sentences = normalized.split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // Split into paragraphs
  const paragraphs = text.split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return { normalized, sentences, paragraphs };
}

export async function enhancedTextComparison(
  textA: PassageData,
  textB: PassageData
): Promise<EnhancedComparisonResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Anthropic API key is not configured");
  }

  const anthropic = new Anthropic({ apiKey });

  // Preprocess both texts
  const processedA = preprocessText(textA.text);
  const processedB = preprocessText(textB.text);

  const systemPrompt = `You are an advanced text comparison analyzer that performs multi-dimensional analysis of two texts. You will evaluate content similarity, stylistic patterns, epistemic profiles, narrative structures, and author psychology to provide comprehensive comparison insights.

ANALYSIS FRAMEWORK:
1. Content Similarity (0-10 per metric):
   - Lexical overlap: Direct word/phrase matching and semantic similarity
   - Conceptual paraphrase overlap: Same ideas expressed differently
   - Argument structure: Logical flow and reasoning pattern alignment

2. Stylistic Similarity (0-10 per metric):
   - Sentence rhythm: Pacing, structure, complexity patterns
   - Rhetorical devices: Use of metaphor, analogy, parallelism
   - Tone/register: Academic vs conversational, formal vs casual

3. Epistemic Profile (0-10 per metric):
   - Compression degree: Information density per sentence
   - Abstraction level: Concrete vs general/theoretical
   - Inferential complexity: Reasoning chain sophistication
   - Friction level: Intellectual challenge, resistance, tension

4. Narrative/Topical Similarity (0-10 per metric):
   - Subject matter overlap: Shared topics and themes
   - Illustrative structure: Use of examples, analogies
   - Reference points: Shared citations, frameworks, traditions

PSYCHOLOGICAL PROFILING:
For each author, infer based on textual evidence:
- Intellectual interests and focus areas
- Cognitive strengths and weaknesses
- Emotional/motivational signatures
- Potential personal agenda or perspective

SCORING GUIDELINES:
- Be precise and evidence-based in all scores
- Consider both surface and deep structural similarities
- Distinguish between coincidental overlap and meaningful connection
- Evaluate development vs derivative relationships carefully`;

  const userPrompt = `Perform comprehensive multi-dimensional comparison of these two texts:

TEXT A (${textA.title || 'Untitled'}):
${textA.text}

TEXT B (${textB.title || 'Untitled'}):
${textB.text}

Return detailed analysis in this JSON format:

{
  "comparisonVectors": {
    "contentSimilarity": {
      "lexicalOverlap": number (0-10),
      "conceptualParaphraseOverlap": number (0-10),
      "argumentStructureMatching": number (0-10)
    },
    "stylisticSimilarity": {
      "sentenceRhythm": number (0-10),
      "rhetoricalDevicePatterning": number (0-10),
      "toneRegister": number (0-10)
    },
    "epistemicProfileSimilarity": {
      "compressionDegree": number (0-10),
      "abstractionLevel": number (0-10),
      "inferentialChainComplexity": number (0-10),
      "frictionLevel": number (0-10)
    },
    "narrativeTopicalSimilarity": {
      "subjectMatterOverlap": number (0-10),
      "illustrativeStructure": number (0-10),
      "sharedReferencePoints": number (0-10)
    }
  },
  "overallSimilarityScore": number (0-100),
  "ripOffRisk": {
    "score": number (0-100),
    "label": "Unrelated" | "Possibly derivative" | "Highly derivative" | "Likely rip-off",
    "explanation": "3-5 sentence explanation",
    "matchingSections": ["section1", "section2"]
  },
  "developmentRelationship": {
    "score": number (0-10),
    "direction": "A develops B" | "B develops A" | "mutual development" | "no development",
    "description": "paragraph explaining development relationship"
  },
  "doctrinalAffinity": {
    "classification": "Doctrinally kindred" | "Methodologically kindred" | "Doctrinally opposed" | "Methodologically opposed" | "Ambiguous / Neutral",
    "justification": "2-3 sentence justification",
    "contentAgreement": number (0-10),
    "methodologicalSimilarity": number (0-10)
  },
  "authorProfiles": {
    "textA": {
      "intellectualInterests": ["interest1", "interest2"],
      "intellectualStrengths": ["strength1", "strength2"],
      "cognitiveWeaknesses": ["weakness1", "weakness2"],
      "emotionalSignatures": ["signature1", "signature2"],
      "personalAgenda": "inferred agenda or perspective"
    },
    "textB": {
      "intellectualInterests": ["interest1", "interest2"],
      "intellectualStrengths": ["strength1", "strength2"],
      "cognitiveWeaknesses": ["weakness1", "weakness2"],
      "emotionalSignatures": ["signature1", "signature2"],
      "personalAgenda": "inferred agenda or perspective"
    }
  },
  "comparativeProfile": {
    "sharedTraits": ["trait1", "trait2"],
    "conflictingTraits": ["difference1", "difference2"],
    "authoralStance": "description of likely authorial relationship/stance"
  },
  "detailedAnalysis": "comprehensive paragraph summarizing all findings and their implications"
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const result = JSON.parse(jsonMatch[0]) as EnhancedComparisonResult;
    
    // Validate essential fields
    if (!result.comparisonVectors || !result.ripOffRisk || !result.authorProfiles) {
      throw new Error("Invalid response structure from enhanced comparison");
    }

    return result;
  } catch (error) {
    console.error("Error in enhanced text comparison:", error);
    throw new Error(`Enhanced comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}