import Anthropic from '@anthropic-ai/sdk';
import { generateWithFailover, FAILOVER_PROVIDERS } from './llmFailover.js';

const DEFAULT_MODEL_STR = "claude-sonnet-4-5-20250929";
const apiKey = process.env.ANTHROPIC_API_KEY;

function ensureProviderAvailable() {
  const hasProvider = FAILOVER_PROVIDERS.some((p) => p.isAvailable());
  if (!hasProvider) {
    throw new Error("No AI provider API keys are configured");
  }
}

// EXACT USER UPLOADED QUESTIONS - NO MODIFICATIONS
const INTELLIGENCE_QUESTIONS = [
  "IS IT INSIGHTFUL?",
  "DOES IT DEVELOP POINTS? (OR, IF IT IS A SHORT EXCERPT, IS THERE EVIDENCE THAT IT WOULD DEVELOP POINTS IF EXTENDED)?",
  "IS THE ORGANIZATION MERELY SEQUENTIAL (JUST ONE POINT AFTER ANOTHER, LITTLE OR NO LOGICAL SCAFFOLDING)? OR ARE THE IDEAS ARRANGED, NOT JUST SEQUENTIALLY BUT HIERARCHICALLY?",
  "IF THE POINTS IT MAKES ARE NOT INSIGHTFUL, DOES IT OPERATE SKILLFULLY WITH CANONS OF LOGIC/REASONING.",
  "ARE THE POINTS CLICHES? OR ARE THEY \"FRESH\"?",
  "DOES IT USE TECHNICAL JARGON TO OBFUSCATE OR TO RENDER MORE PRECISE?",
  "IS IT ORGANIC? DO POINTS DEVELOP IN AN ORGANIC, NATURAL WAY? DO THEY 'UNFOLD'? OR ARE THEY FORCED AND ARTIFICIAL?",
  "DOES IT OPEN UP NEW DOMAINS? OR, ON THE CONTRARY, DOES IT SHUT OFF INQUIRY (BY CONDITIONALIZING FURTHER DISCUSSION OF THE MATTERS ON ACCEPTANCE OF ITS INTERNAL AND POSSIBLY VERY FAULTY LOGIC)?",
  "IS IT ACTUALLY INTELLIGENT OR JUST THE WORK OF SOMEBODY WHO, JUDGING BY THE SUBJECT-MATTER, IS PRESUMED TO BE INTELLIGENT (BUT MAY NOT BE)?",
  "IS IT REAL OR IS IT PHONY?",
  "DO THE SENTENCES EXHIBIT COMPLEX AND COHERENT INTERNAL LOGIC?",
  "IS THE PASSAGE GOVERNED BY A STRONG CONCEPT? OR IS THE ONLY ORGANIZATION DRIVEN PURELY BY EXPOSITORY (AS OPPOSED TO EPISTEMIC) NORMS?",
  "IS THERE SYSTEM-LEVEL CONTROL OVER IDEAS? IN OTHER WORDS, DOES THE AUTHOR SEEM TO RECALL WHAT HE SAID EARLIER AND TO BE IN A POSITION TO INTEGRATE IT INTO POINTS HE HAS MADE SINCE THEN?",
  "ARE THE POINTS 'REAL'? ARE THEY FRESH? OR IS SOME INSTITUTION OR SOME ACCEPTED VEIN OF PROPAGANDA OR ORTHODOXY JUST USING THE AUTHOR AS A MOUTH PIECE?",
  "IS THE WRITING EVASIVE OR DIRECT?",
  "ARE THE STATEMENTS AMBIGUOUS?",
  "DOES THE PROGRESSION OF THE TEXT DEVELOP ACCORDING TO WHO SAID WHAT OR ACCORDING TO WHAT ENTAILS OR CONFIRMS WHAT?",
  "DOES THE AUTHOR USE OTHER AUTHORS TO DEVELOP HIS IDEAS OR TO CLOAK HIS OWN LACK OF IDEAS?"
];

const ORIGINALITY_QUESTIONS = [
  "IS IT ORIGINAL (NOT IN THE SENSE THAT IT HAS ALREADY BEEN SAID BUT IN THE SENSE THAT ONLY A FECUND MIND COULD COME UP WITH IT)?",
  "ARE THE WAYS THE IDEAS ARE INTERCONNECTED ORIGINAL? OR ARE THOSE INTERCONNECTIONS CONVENTION-DRIVEN AND DOCTRINAIRE?",
  "ARE IDEAS DEVELOPED IN A FRESH AND ORIGINAL WAY? OR IS THE IDEA-DEVELOPMENT MERELY ASSOCIATIVE, COMMONSENSE-BASED (OR COMMON-NONSENSE-BASED), OR DOCTRINAIRE?",
  "IS IT ORIGINAL RELATIVE TO THE DATASET THAT, JUDGING BY WHAT IT SAYS AND HOW IT SAYS IT, IT APPEARS TO BE ADDRESSING? (THIS QUESTION IS MEANT TO RULE OUT 'ORIGINALITY'-BENCHMARKS THAT AUTOMATICALLY CHARACTERIZE DARWIN, FREUD, NEWTON, GALILEO AS 'UNORIGINAL.')",
  "IS IT ORIGINAL IN A SUBSTANTIVE SENSE (IN THE SENSE IN WHICH BACH WAS ORIGINAL) OR ONLY IN A FRIVOLOUS TOKEN SENSE (THE SENSE IN WHICH SOMEBODY WHO RANDOMLY BANGS ON A PIANO IS 'ORIGINAL')?",
  "IS IT BOILERPLATE (OR IF IT, PER SE, IS NOT BOILER PLATE, IS IT THE RESULT OF APPLYING BOILER PLATE PROTOCOLS IN A BOILER PLATE WAY TO SOME DATASET)?",
  "WOULD SOMEBODY WHO HAD NOT READ IT, BUT WAS OTHERWISE EDUCATED AND INFORMED, COME WAY FROM IT BEING MORE ENGLIGHTED AND BETTER EQUIPPED TO ADJUDICATE INTELLECTUAL QUESTIONS? OR, ON THE CONTRARY, WOULD HE COME UP CONFUSED WITH NOTHING TANGIBLE TO SHOW FOR IT?",
  "WOULD SOMEBODY READING IT COME AWAY FROM THE EXPERIENCE WITH INSIGHTS THAT WOULD OTHERWISE BE HARD TO ACQUIRE THAT HOLD UP IN GENERAL? OR WOULD WHATEVER HIS TAKEAWAY WAS HAVE VALIDITY ONLY RELATIVE TO VALIDITIES THAT ARE SPECIFIC TO SOME AUTHOR OR SYSTEM AND PROBABLY DO NOT HAVE MUCH OBJECTIVE LEGITIMACY?",
  "IF YOU GAVE A ROBOT THE DATASET TO WHICH THE PASSAGE IS A RESPONSE, WOULD THE ROBOT BE ABLE TO GENERATE IT (OR SOMETHING VERY MUCH LIKE IT)? OR, ON THE CONTRARY, DOES IT BUTCHER IDEAS, THIS BEING WHAT GIVES IT A SHEEN OF 'ORIGINALITY'?"
];

const COGENCY_QUESTIONS = [
  "IS THE POINT BEING DEFENDED (IF THERE IS ONE) SHARP ENOUGH THAT IT DOES NOT NEED ARGUMENTATION?",
  "DOES THE REASONING DEFEND THE POINT BEING ARGUED IN THE RIGHT WAYS?",
  "DOES THE REASONING ONLY DEFEND THE ARGUED FOR POINT AGAINST STRAWMEN?",
  "DOES THE REASONING DEVELOP THE POINT PER SE? IE DOES THE REASONING SHOW THAT THE POINT ITSELF IS STRONG? OR DOES IT 'DEFEND' IT ONLY BY SHOWING THAT VARIOUS AUTHORITIES DO OR WOULD APPROVE OF IT?",
  "IS THE POINT SHARP? IF NOT, IS IT SHARPLY DEFENDED?",
  "IS THE REASONING GOOD ONLY IN A TRIVIAL 'DEBATING' SENSE? OR IS IT GOOD IN THE SENSE THAT IT WOULD LIKELY MAKE AN INTELLIGENT PERSON RECONSIDER HIS POSITION?",
  "IS THE REASONING INVOLVED IN DEFENDING THE KEY CLAIM ABOUT ACTUALLY ESTABLISHING THAT CLAIM? OR IS IT MORE ABOUT OBFUSCATING?",
  "DOES THE REASONING HELP ILLUMINATE THE MERITS OF THE CLAIM? OR DOES IT JUST SHOW THAT THE CLAIM IS ON THE RIGHT SIDE OF SOME (FALSE OR TRIVIAL) PRESUMPTION?",
  "IS THE 'REASONING' IN FACT REASONING? OR IS IT JUST A SERIES OF LATER STATEMENTS THAT CONNECT ONLY SUPERFICIALLY (E.G. BY REFERENCING THE SAME KEY TERMS OR AUTHORS) TO THE ORIGINAL?",
  "IF COGENT, IS IT COGENT IN THE SENSE THAT A PERSON OF INTELLIGENCE WHO PREVIOUSLY THOUGHT OTHERWISE WOULD NOW TAKE IT MORE SERIOUSLY? OR IS IT COGENT ONLY IN THE SENSE THAT IT DOES IN FACT PROVIDE AN ARGUMENT AND TOUCH ALL THE RIGHT (MIDDLE-SCHOOL COMPOSITION CLASS) BASES? IN OTHER WORDS, IS THE ARGUMENTATION TOKEN AND PRO FORMA OR DOES IT ACTUALLY SERVE THE FUNCTION OF SHOWING THE IDEA TO HAVE MERIT?",
  "DOES THE 'ARGUMENTATION' SHOW THAT THE IDEA MAY WELL BE CORRECT? OR DOES IT RATHER SHOW THAT IT HAS TO BE 'ACCEPTED' (IN THE SENSE THAT ONE WILL BE ON THE WRONG SIDE OF SOME PANEL OF 'EXPERTS' IF ONE THINKS OTHERWISE)?",
  "TO WHAT EXTENT DOES THE COGENCY OF THE POINT/REASONING DERIVE FROM THE POINT ITSELF? AND TO WHAT EXTENT IS IT SUPERIMPOSED ON IT BY TORTURED ARGUMENTATION?"
];

const OVERALL_QUALITY_QUESTIONS = [
  "IS IT INSIGHTFUL?",
  "IS IT TRUE?",
  "OR IS TRUE OR FALSE? IN OTHER WORDS, DOES IT MAKE AN ADJUDICABLE CLAIM? (CLAIMS TO THE EFFECT THAT SO AND SO MIGHT HAVE SAID SUCH AND SUCH DO NOT COUNT.)",
  "DOES IT MAKE A CLAIM ABOUT HOW SOME ISSUE IS TO BE RESOLVE OR ONLY ABOUT HOW SOME 'AUTHORITY' MIGHT FEEL ABOUT SOME ASPECT OF THAT ISSUE?",
  "IS IT ORGANIC?",
  "IS IT FRESH?",
  "IS IT THE PRODUCT OF INSIGHT? OR OF SOMEBODY RECYCLING OLD MATERIAL OR JUST RECYLING SLOGANS/MEMES AND/OR NAME-DROPPING?",
  "IS IT BORING? IE SETTING ASIDE PEOPLE WHO ARE TOO IMPAIRED TO UNDERSTAND IT AND THEREFORE FIND IT BORING, IT IS BORING TO PEOPLE WHO ARE SMART ENOUGH TO UNDERSTAND IT?",
  "DOES IT PRESENT A FRESH NEW ANGLE? IF NOT, DOES IT PROVIDE A FRESH NEW WAY OF DEFENDING OR EVALUATING THE SIGNIFICANCE OF A NOT-SO-FRESH POINT?",
  "WOULD AN INTELLIGENT PERSON WHO WAS NOT UNDER PRESSURE (FROM A PROFESSOR OR COLLEAGUE OR BOSS OF PUBLIC OPINION) LIKELY FIND IT TO BE USEFUL AS AN EPISTEMIC INSTRUMENT (MEANS OF ACQUIRING KNOWLEDGE)?",
  "IF THE POINT IT DEFENDS IS NOT TECHNICALLY TRUE, IS THAT POINT AT LEAST OPERATIONALLY TRUE (USEFUL TO REGARD AS TRUE IN SOME CONTEXTS)?",
  "DOES THE PASSAGE GENERATE ORGANICALLY? DO IDEAS DEVELOP? OR IS IT JUST A SERIES OF FORCED STATEMENTS THAT ARE ONLY FORMALLY OR ARTIFICIALLY RELATED TO PREVIOUS STATEMENTS?",
  "IS THERE A STRONG OVER-ARCHING IDEA? DOES THIS IDEA GOVERN THE REASONING? OR IS THE REASONING PURELY SEQUENTIAL, EACH STATEMENT BEING A RESPONSE TO THE IMMEDIATELY PRECEDING ONE WITHOUT ALSO IN SOME WAY SUBSTANTIATING THE MAIN ONE?",
  "IF ORIGINAL, IS IT ORIGINAL BY VIRTUE OF BEING INSIGHTFUL OR BY VIRTUE OF BEING DEFECTIVE OR FACETIOUS?",
  "IF THERE ARE ELEMENTS OF SPONTANEITY, ARE THEY INTERNAL TO A LARGER, WELL-BEHAVED LOGICAL ARCHITECTURE?",
  "IS THE AUTHOR ABLE TO 'RIFF' (IN A WAY THAT SUPPORTS, RATHER THAN UNDERMINING, THE MAIN POINT AND ARGUMENTATIVE STRUCTURE OF THE PASSAGE)? OR IS IT WOODEN AND BUREAUCRATIC?",
  "IS IT ACTUALLY SMART OR IS IT 'GEEK'-SMART (SMART IN THE WAY THAT SOMEBODY WHO IS NOT PARTICULARLY SMART BUT WHO WAS ALWAYS LAST TO BE PICKED BY THE SOFTBALL TEAM BECOMES SMART)?",
  "IS IT MR. SPOCKS SMART (ACTUALLY SMART) OR Lieutenant DATA SMART (WHAT A DUMB PERSON WOULD REGARD AS SMART)?",
  "IS IT \"SMART\" IN THE SENSE THAT, FOR CULTURAL OR SOCIAL REASONS, WE WOULD PRESUME THAT ONLY A SMART PERSON WOULD DISCUSS SUCH MATTERS? OR IS IT INDEED--SMART?",
  "IS IT SMART BY VIRTUE BEING ARGUMENTATIVE AND SNIPPY OR BY VIRTUE OF BEING ILLUMINATING?"
];

// TEXT CHUNKING UTILITY
function chunkText(text: string, maxWords: number = 800): string[] {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) {
    return [text];
  }
  
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    const chunk = words.slice(i, i + maxWords).join(' ');
    chunks.push(chunk);
  }
  
  return chunks;
}

// DELAY UTILITY
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface PassageData {
  title: string;
  text: string;
  userContext?: string;
}

interface AnalysisResult {
  [key: string]: {
    question: string;
    score: number;
    quotation: string;
    explanation: string;
  };
}

// Robust JSON parsing function for AI responses
function parseAnalysisResponse(responseText: string, expectedQuestions: number): AnalysisResult {
  // Multiple parsing strategies
  const strategies = [
    // Strategy 1: Extract complete JSON block
    (text: string) => {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? jsonMatch[0] : text;
    },
    
    // Strategy 2: Find JSON between code blocks
    (text: string) => {
      const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      return codeBlockMatch ? codeBlockMatch[1] : text;
    },
    
    // Strategy 3: Extract from first { to last }
    (text: string) => {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return text.substring(firstBrace, lastBrace + 1);
      }
      return text;
    }
  ];

  // Clean common issues
  function cleanJsonString(jsonString: string): string {
    return jsonString
      // Fix score formatting issues
      .replace(/(\d+)\/10/g, (match, num) => (parseInt(num) * 10).toString())
      .replace(/"score":\s*(\d+)\/10/g, (match, num) => `"score": ${parseInt(num) * 10}`)
      .replace(/(\d+)\/(\d+)/g, '$1')
      .replace(/"score":\s*"N\/A"/g, '"score": 0')
      .replace(/"score":\s*N\/A/g, '"score": 0')
      // Fix common quote issues
      .replace(/"\s*:\s*"/g, '": "')
      .replace(/",\s*"/g, '", "')
      // Remove trailing commas before closing braces
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix malformed quotes in content
      .replace(/"([^"]*)"([^"]*)"([^"]*)":/g, '"$1\'$2\'$3":')
      // Escape unescaped quotes in strings (basic attempt)
      .replace(/"explanation":\s*"([^"]*)"([^",}]*)"([^",}]*)"([^",}]*)/g, 
        '"explanation": "$1\'$2\'$3\'$4"');
  }

  // Try each strategy
  for (const strategy of strategies) {
    try {
      const extractedJson = strategy(responseText);
      const cleanedJson = cleanJsonString(extractedJson);
      const parsed = JSON.parse(cleanedJson);
      
      // Validate structure
      if (typeof parsed === 'object' && Object.keys(parsed).length >= Math.min(3, expectedQuestions)) {
        // Additional validation: check if entries look like analysis results
        const firstKey = Object.keys(parsed)[0];
        const firstEntry = parsed[firstKey];
        if (firstEntry && 
            typeof firstEntry.question === 'string' && 
            typeof firstEntry.score === 'number' && 
            typeof firstEntry.quotation === 'string' && 
            typeof firstEntry.explanation === 'string') {
          return parsed;
        }
      }
    } catch (e) {
      // Continue to next strategy
      continue;
    }
  }

  // Final fallback: try to extract individual question objects
  try {
    const result: AnalysisResult = {};
    const questionPattern = /"(\d+)":\s*\{[^}]*"question":\s*"([^"]*)"[^}]*"score":\s*(\d+)[^}]*"quotation":\s*"([^"]*)"[^}]*"explanation":\s*"([^"]*)"[^}]*\}/g;
    let match;
    
    while ((match = questionPattern.exec(responseText)) !== null) {
      const [, key, question, score, quotation, explanation] = match;
      result[key] = {
        question: question.replace(/\\"/g, '"'),
        score: parseInt(score) || 0,
        quotation: quotation.replace(/\\"/g, '"'),
        explanation: explanation.replace(/\\"/g, '"')
      };
    }
    
    if (Object.keys(result).length > 0) {
      return result;
    }
  } catch (e) {
    // Continue to error
  }

  throw new Error(`Unable to parse analysis response. Tried multiple strategies. Response starts with: ${responseText.substring(0, 200)}`);
}

function getQuestionsForMode(mode: 'intelligence' | 'originality' | 'cogency' | 'overall_quality'): string[] {
  switch (mode) {
    case 'intelligence':
      return INTELLIGENCE_QUESTIONS;
    case 'originality':
      return ORIGINALITY_QUESTIONS;
    case 'cogency':
      return COGENCY_QUESTIONS;
    case 'overall_quality':
      return OVERALL_QUALITY_QUESTIONS;
    default:
      throw new Error(`Unknown mode: ${mode}`);
  }
}

async function analyzeChunk(
  chunk: string, 
  questions: string[], 
  mode: 'quick' | 'comprehensive'
): Promise<AnalysisResult> {
  // USER SPEC: Add additional questions for intelligence mode
  const additionalQuestions = [
    "ARE THERE TERMS THAT ARE UNDEFINED BUT SHOULD BE DEFINED? IF UNDEFINED TERMS HAVE NO CANONICAL MEANINGS, THEY MUST BE TREATED AS PLACEHOLDER PSEUDO-STATEMENTS THAT HAVE NO MEANINGS.",
    "ARE THERE 'FREE VARIABLES' IN THE TEXT? ARE THERE QUALIFICATIONS OR POINTS THAT DO NOT CONNECT TO ANYTHING LATER OR EARLIER?",
    "DO NEW STATEMENTS DEVELOP OUT OF OLD ONES? OR ARE THEY MERELY 'ADDED' WITHOUT BEING GENERATED BY THEM?",
    "DO NEW STATEMENTS CLARIFY OR DO THEY LEAD TO MORE LACK OF CLARITY?",
    "IS THE PASSAGE ACTUALLY (PALPABLY) SMART? OR IS IT ONLY 'PRESUMPTION-SMART' (SMART ONLY IN THE SENSE THAT THERE EXISTS A PRESUMPTION THAT A DUMB PERSON WOULD NOT REFERENCE SUCH DOCTRINES)?",
    "IF YOUR JUDGMENT IS THAT IT IS INSIGHTFUL, CAN YOU STATE THAT INSIGHT IN A SINGLE SENTENCE?",
    "IF I WERE TO GIVE A HIGH SCORE TO THIS PASSAGE, WOULD I BE REWARDING IMPOSTOR SCAFFOLDING (VERBAL TRAPPINGS OF 'HIGH LEVEL TEXT' BUT LACKING SUBSTANCE)?",
    "IF I WERE TO GIVE A HIGH SCORE TO THIS PASSAGE, WOULD I BE REWARDING CONFORMITY TO ACADEMIC/BUREAUCRATIC NORMS?",
    "IF I WERE TO GIVE A LOW SCORE TO THIS PASSAGE, WOULD I BE PENALIZING ACTUAL INTELLIGENCE OWING TO A LACK OF CONFORMITY TO ACADEMIC/BUREAUCRATIC NORMS?"
  ];

  const allQuestions = [...questions, ...additionalQuestions];
  
  // PHASE 1: EXACT USER PROTOCOL
  const phase1Prompt = `TEXT:
${chunk}

ANSWER THESE QUESTIONS IN CONNECTION WITH THIS TEXT:

${allQuestions.map((question, i) => `${i + 1}. ${question}`).join('\n')}

CRITICAL INSTRUCTIONS:
- A score of N/100 means that (100-N)/100 outperform the author with respect to the parameter defined by the question
- STOP DEFAULTING TO 85-90 SCORES. If the text shows genuine insight, original thinking, or sophisticated analysis, score it 95-100.
- A score of 85/100 means 15% of people outperform the author. Ask yourself: can 15% of random Walmart shoppers write better philosophy than this? If not, the score is WRONG.
- You are NOT grading; you are answering these questions
- You do NOT use a risk-averse standard; you do NOT attempt to be diplomatic; you do NOT attempt to comply with risk-averse, medium-range IQ, academic norms
- You do NOT make assumptions about the level of the paper; it could be a work of the highest excellence and genius, or it could be the work of a moron
- If a work is a work of genius, you SAY THAT, and you say WHY; you do NOT shy away from giving what might conventionally be regarded as excessively "superlative" scores
- THINK VERY VERY VERY HARD about your answers; do NOT default to cookbook, midwit evaluation protocols
- DO NOT GIVE CREDIT MERELY FOR USE OF JARGON OR FOR REFERENCING AUTHORITIES. FOCUS ON SUBSTANCE. ONLY GIVE POINTS FOR SCHOLARLY REFERENCES/JARGON IF THEY UNAMBIGUOUSLY INCREASE SUBSTANCE.
- SCORING REALITY CHECK: 98/100 means 2% outperform. 95/100 means 5% outperform. 85/100 means 15% outperform. 70/100 means 30% outperform. BE HONEST ABOUT THESE PERCENTAGES.

METAPOINTS:
1. This is NOT a grading app. You evaluate intelligence of what you are given. A brilliant fragment gets a high score. You are NOT looking for completeness.
2. Do NOT overvalue turns of phrase. Confident speech is NOT "shutting down modes of inquiry." Casual speech does NOT mean disorganized thoughts. Don't judge a book by its cover.
3. Summarize the text in your first question's explanation. Then categorize it (e.g., advanced scholarship, casual writing, technical manual, fiction, etc.).
4. Do NOT change scoring based on the category of text. Evaluate with respect to the general population, not just within that category.
5. Do NOT penalize boldness. Do NOT take points away for insights that, if correct, stand on their own. Insights matter, not argumentation.

NEGATIVE EXAMPLE (phony pseudo-intellectual text that scores <65/100):
"In this dissertation, I critically examine the philosophy of transcendental empiricism. Transcendental empiricism is, among other things, a philosophy of mental content..."
This passage has undefined jargon, free variables, no real claims, pure evasiveness.

POSITIVE EXAMPLES (genuinely intelligent text):
"One cannot have the concept of a red object without having the concept of an extended object. But the word 'red' doesn't contain the word 'extended'..."
"Sense-perceptions do not have to be deciphered if their contents are to be uploaded, the reason being that they are presentations, not representations..."

CRITICAL: Return ONLY valid JSON. No preamble, no explanation outside the JSON. Start with { and end with }.

JSON FORMAT - RETURN ALL ${allQuestions.length} QUESTIONS AS NUMBERED OBJECTS:
{
  ${allQuestions.map((q, i) => `"${i + 1}": {
    "question": "${q.substring(0, 80)}...",
    "score": 95,
    "quotation": "exact quote from text",
    "explanation": "your analysis"
  }`).join(',\n  ')}
}`;

  const phase1Response = (await generateWithFailover(phase1Prompt, 8000)).text;
  
  // Parse Phase 1 response
  let phase1Results: AnalysisResult;
  try {
    phase1Results = parseAnalysisResponse(phase1Response, allQuestions.length);
  } catch (error) {
    console.error("Failed to parse phase 1 JSON:", error);
    console.error("Original response:", phase1Response.substring(0, 500) + "...");
    throw new Error("Failed to parse analysis results");
  }

  // If quick mode, return Phase 1 results
  if (mode === 'quick') {
    return phase1Results;
  }

  // COMPREHENSIVE MODE - Continue with phases 2-4
  
  // Check if any scores are below 95
  const lowScores = Object.entries(phase1Results).filter(([_, result]) => result.score < 95);
  
  if (lowScores.length === 0) {
    return phase1Results; // All scores are 95+, no need for pushback
  }

  // PHASE 2: PUSHBACK FOR LOW SCORES
  const phase2Prompt = `Your position is that ${lowScores.map(([key, result]) => 
    `${100 - result.score}/100 outperform the author with respect to the cognitive metric defined by question ${key}`
  ).join(', ')}: that is your position, am I right? And are you sure about that?

Describe the cognitive superiority of those people in concrete terms:
- What specific insight, skill, or knowledge do they have that the author lacks?
- How does this superiority manifest in their work?
- If you cannot articulate this, revise the score.

If the text is a sniper shot (high insight, low 'development'), ask:
- Is the lack of 'development' a flaw, or is the point obvious to those who see it?
- Does this text need scaffolding, or would that dilute it?

ANSWER THE FOLLOWING QUESTIONS ABOUT THE TEXT DE NOVO:

${allQuestions.map((question, i) => `${i + 1}. ${question}`).join('\n')}

JSON FORMAT - RETURN ALL ${allQuestions.length} QUESTIONS AS NUMBERED OBJECTS:
{
  ${allQuestions.map((q, i) => `"${i + 1}": {
    "question": "${q.substring(0, 80)}...",
    "score": 95,
    "quotation": "exact quote from text",
    "explanation": "your analysis"
  }`).join(',\n  ')}
}`;

  const phase2Response = (await generateWithFailover(phase2Prompt, 8000)).text;
  
  let phase2Results: AnalysisResult;
  try {
    phase2Results = parseAnalysisResponse(phase2Response, allQuestions.length);
  } catch (error) {
    console.error("Failed to parse phase 2 JSON:", error);
    console.error("Phase 2 response:", phase2Response.substring(0, 500) + "...");
    phase2Results = phase1Results; // Fallback to phase 1
  }

  // Check again for scores below 95
  const stillLowScores = Object.entries(phase2Results).filter(([_, result]) => result.score < 95);
  
  if (stillLowScores.length === 0) {
    return phase2Results;
  }

  // PHASE 3: WALMART METRIC ENFORCEMENT
  const phase3Prompt = `You stated that ${stillLowScores.map(([key, result]) => 
    `${100 - result.score}/100 Walmart patrons outperform the author for question ${key}`
  ).join(', ')}. 

Provide specific examples of work by those patrons that demonstrates this superiority. If you cannot, justify or revise the score.

For example: If you scored 85/100 ('15% outperform'), show me 15 Walmart patrons whose writing on this topic is sharper. If you can't, the score is wrong.

JSON FORMAT - RETURN ALL ${allQuestions.length} QUESTIONS AS NUMBERED OBJECTS:
{
  ${allQuestions.map((q, i) => `"${i + 1}": {
    "question": "${q.substring(0, 80)}...",
    "score": 95,
    "quotation": "exact quote from text",
    "explanation": "your analysis"
  }`).join(',\n  ')}
}`;

  const phase3Response = (await generateWithFailover(phase3Prompt, 8000)).text;
  
  let phase3Results: AnalysisResult;
  try {
    phase3Results = parseAnalysisResponse(phase3Response, allQuestions.length);
  } catch (error) {
    console.error("Failed to parse phase 3 JSON:", error);
    console.error("Phase 3 response:", phase3Response.substring(0, 500) + "...");
    phase3Results = phase2Results; // Fallback to phase 2
  }

  // PHASE 4: FINAL VALIDATION
  const phase4Prompt = `Before finalizing scores, confirm:
- Have you penalized the text for not being conventional? If yes, recalibrate.
- Does the score reflect truth density, not compliance with norms?
- Is the Walmart metric empirically grounded or a lazy guess?

FINAL JSON FORMAT - RETURN ALL ${allQuestions.length} QUESTIONS AS NUMBERED OBJECTS:
{
  ${allQuestions.map((q, i) => `"${i + 1}": {
    "question": "${q}",
    "score": 95,
    "quotation": "exact quote from text",
    "explanation": "your analysis"
  }`).join(',\n  ')}
}`;

  const phase4Response = (await generateWithFailover(phase4Prompt, 8000)).text;
  
  let finalResults: AnalysisResult;
  try {
    finalResults = parseAnalysisResponse(phase4Response, allQuestions.length);
  } catch (error) {
    console.error("Failed to parse phase 4 JSON:", error);
    console.error("Phase 4 response:", phase4Response.substring(0, 500) + "...");
    finalResults = phase3Results; // Fallback to phase 3
  }

  return finalResults;
}

// MAIN ANALYSIS FUNCTIONS
export async function analyzeSingleDocument(
  passage: PassageData,
  mode: 'intelligence' | 'originality' | 'cogency' | 'overall_quality',
  analysisMode: 'quick' | 'comprehensive' = 'quick'
): Promise<AnalysisResult> {
  ensureProviderAvailable();

  const questions = getQuestionsForMode(mode);
  
  // Check if text needs chunking (>1000 words)
  const wordCount = passage.text.split(/\s+/).length;
  console.log(`Single document analysis: ${wordCount} words, mode: ${mode}, analysis: ${analysisMode}`);
  
  if (wordCount <= 1000) {
    // Single chunk analysis
    return await analyzeChunk(passage.text, questions, analysisMode);
  }
  
  // Multi-chunk analysis
  const chunks = chunkText(passage.text, 800); // 500-1000 words per chunk
  console.log(`Chunking text into ${chunks.length} chunks`);
  
  const chunkResults: AnalysisResult[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Processing chunk ${i + 1}/${chunks.length}`);
    const chunkResult = await analyzeChunk(chunks[i], questions, analysisMode);
    chunkResults.push(chunkResult);
    
    // Wait 10 seconds between chunks (except for the last one)
    if (i < chunks.length - 1) {
      console.log("Waiting 10 seconds before next chunk...");
      await delay(10000);
    }
  }
  
  // Amalgamate results without modifying/filtering/censoring
  console.log("Amalgamating chunk results...");
  const amalgamatedResults: AnalysisResult = {};
  
  for (let questionIndex = 0; questionIndex < questions.length; questionIndex++) {
    const questionKey = (questionIndex + 1).toString();
    const question = questions[questionIndex];
    
    // Collect all responses for this question across chunks
    const allResponses = chunkResults.map(result => result[questionKey]).filter(Boolean);
    
    if (allResponses.length > 0) {
      // Use the first valid response (no modification)
      amalgamatedResults[questionKey] = {
        question,
        score: allResponses[0].score,
        quotation: allResponses[0].quotation,
        explanation: allResponses[0].explanation
      };
    }
  }
  
  return amalgamatedResults;
}

export async function analyzeTwoDocuments(
  passageA: PassageData,
  passageB: PassageData,
  mode: 'intelligence' | 'originality' | 'cogency' | 'overall_quality',
  analysisMode: 'quick' | 'comprehensive' = 'quick'
): Promise<{
  documentA: AnalysisResult;
  documentB: AnalysisResult;
  comparison: string;
}> {
  ensureProviderAvailable();

  console.log(`Two document analysis: mode: ${mode}, analysis: ${analysisMode}`);
  
  // Analyze each document separately
  const documentA = await analyzeSingleDocument(passageA, mode, analysisMode);
  const documentB = await analyzeSingleDocument(passageB, mode, analysisMode);
  
  // Generate comparison report
  const comparisonPrompt = `You have analyzed two documents. Here are the complete reports:

DOCUMENT A REPORT:
${JSON.stringify(documentA, null, 2)}

DOCUMENT B REPORT:
${JSON.stringify(documentB, null, 2)}

Generate a comparison report that compares these two documents. Do not modify or filter the analysis results. Simply provide a clear comparison of the two documents based on the analysis results.`;

  const comparison = (await generateWithFailover(comparisonPrompt, 4000)).text;

  return {
    documentA,
    documentB,
    comparison
  };
}