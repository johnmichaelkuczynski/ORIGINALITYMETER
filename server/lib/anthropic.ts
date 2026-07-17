import Anthropic from '@anthropic-ai/sdk';

// Define types locally to avoid import issues
interface PassageData {
  title: string;
  text: string;
  userContext?: string;
}

interface AnalysisResult {
  [key: string]: any;
}

interface SupportingDocument {
  [key: string]: any;
}

interface StyleOption {
  [key: string]: any;
}

interface SubmitFeedbackRequest {
  [key: string]: any;
}

const DEFAULT_MODEL_STR = "claude-sonnet-4-5-20250929";

const apiKey = process.env.ANTHROPIC_API_KEY;

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
  "DOES THE PIECE HAVE A CONCLUSION? IF SO, DO THE PREMISES LEAD UP TO IT? IF NOT, WHY NOT?",
  "ARE THE CLAIMS DEFENDED AGAINST THE RIGHT OBJECTIONS? OR DOES THE AUTHOR IGNORE THE STRONGEST OBJECTIONS AND RESPOND ONLY TO WEAK ONES?",
  "DOES THE TEXT HAVE A 'THROUGH-LINE'? DO INDIVIDUAL POINTS BUILD ON EACH OTHER? OR IS THE TEXT JUST A SEQUENCE OF SEPARATE POINTS HAVING ONLY A ROUGH TOPICAL OVERLAP?",
  "IF INFERENCES ARE DRAWN, ARE THEY LEGITIMATE? OR ARE THEY OF THE 'DOES NOT FOLLOW' VARIETY?",
  "IS THE ARGUMENT CLEAR? IN PARTICULAR, CAN THE READER RECONSTRUCT THE LOGICAL SHAPE OF THE ARGUMENT BEING MADE?"
];

export async function analyzePrimaryIntelligence(passage: PassageData, parameterCount: number = 18): Promise<any> {
  if (!apiKey) {
    throw new Error("Anthropic API key is not configured");
  }

  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  // Check if text is too long and needs chunking
  const words = passage.text.split(/\s+/).length;
  let finalPassage = passage;
  
  // Truncate if too long to prevent JSON parsing issues
  if (words > 800) {
    const truncatedText = passage.text.split(/\s+/).slice(0, 800).join(' ') + '\n\n[Document continues...]';
    finalPassage = { ...passage, text: truncatedText };
    console.log(`Intelligence passage truncated from ${words} to ~800 words`);
  }

  const selectedQuestions = INTELLIGENCE_QUESTIONS.slice(0, parameterCount);

  // PHASE 1: EXACT USER PROTOCOL - Questions only with anti-bias instructions
  const phase1Prompt = `TEXT:
${finalPassage.text}

ANSWER THESE QUESTIONS IN CONNECTION WITH THIS TEXT:

${selectedQuestions.map((question, i) => `${i + 1}. ${question}`).join('\n')}

CRITICAL INSTRUCTIONS:
- A score of N/100 means that (100-N)/100 outperform the author with respect to the parameter defined by the question
- You are NOT grading; you are answering these questions
- You do NOT use a risk-averse standard; you do NOT attempt to be diplomatic; you do NOT attempt to comply with risk-averse, medium-range IQ, academic norms
- You do NOT make assumptions about the level of the paper; it could be a work of the highest excellence and genius, or it could be the work of a moron
- If a work is a work of genius, you SAY THAT, and you say WHY; you do NOT shy away from giving what might conventionally be regarded as excessively "superlative" scores; you give it the score it deserves, NOT the score that a midwit committee would say it deserves
- THINK VERY VERY VERY HARD about your answers; do NOT default to cookbook, midwit evaluation protocols

Before answering the questions, note this non-negotiable standard:
Insight is a sniper shot, not a town hall. If the text reveals something true but unpopular, penalizing it for lacking 'balance' or 'rigor' is midwit bias. Truth often looks extreme because lies are normalized.

Hierarchy of judgment:
95-100/100: Unignorable insight. Either genius or so correct it breaks scales.
80-94/100: Strong but with friction (e.g., clumsy expression, minor gaps).
<80/100: Degrees of mediocrity or failure.

Walmart metric is a sanity check, not a gag. If you claim 30/100 Walmart patrons outperform the author, you must describe exactly what those 30% know that the author doesn't.

JSON FORMAT - RETURN ONLY THIS EXACT STRUCTURE:
{
  "1": {
    "question": "${selectedQuestions[0]}",
    "score": 95,
    "quotation": "exact quote from text",
    "explanation": "your analysis"
  }
}`;

  try {
    // PHASE 1: Initial analysis
    const phase1Message = await anthropic.messages.create({
      model: DEFAULT_MODEL_STR,
      max_tokens: 8000,
      messages: [{ role: "user", content: phase1Prompt }],
    });

    const phase1Response = phase1Message.content[0].type === "text" ? phase1Message.content[0].text : "";
    
    // Try to parse phase 1 response - extract JSON from anywhere in response
    let phase1Results;
    
    // First, try to extract the JSON portion before any notes
    let jsonToParseString = phase1Response;
    
    // If there's a note at the end, remove it
    const noteIndex = phase1Response.indexOf('[Note:');
    if (noteIndex !== -1) {
      jsonToParseString = phase1Response.substring(0, noteIndex).trim();
    }
    
    try {
      phase1Results = JSON.parse(jsonToParseString);
    } catch (parseError) {
      // Try to extract JSON from code blocks
      const jsonMatch = jsonToParseString.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
      if (jsonMatch) {
        try {
          let jsonContent = jsonMatch[1].replace(/"score":\s*"N\/A"/g, '"score": 0');
          phase1Results = JSON.parse(jsonContent);
        } catch (e) {
          console.error("Failed to parse from code block:", e);
          return { error: "Failed to parse JSON", rawResponse: phase1Response };
        }
      } else {
        // Try to find JSON object by finding first { and last } before any note
        const jsonStart = jsonToParseString.indexOf('{');
        let jsonEnd = jsonToParseString.lastIndexOf('}');
        
        // Make sure we stop at the first complete JSON object before any note
        const lines = jsonToParseString.split('\n');
        let bracketCount = 0;
        let actualJsonEnd = -1;
        
        for (let i = 0; i < jsonToParseString.length; i++) {
          if (jsonToParseString[i] === '{') bracketCount++;
          if (jsonToParseString[i] === '}') {
            bracketCount--;
            if (bracketCount === 0 && i >= jsonStart) {
              actualJsonEnd = i;
              break;
            }
          }
        }
        
        if (jsonStart !== -1 && actualJsonEnd !== -1) {
          try {
            let jsonString = jsonToParseString.substring(jsonStart, actualJsonEnd + 1);
            // Clean the JSON by handling N/A scores
            jsonString = jsonString.replace(/"score":\s*"N\/A"/g, '"score": 0');
            console.log("Attempting to parse extracted JSON:", jsonString.substring(0, 200) + "...");
            phase1Results = JSON.parse(jsonString);
          } catch (e) {
            console.error("Failed to parse extracted JSON:", e);
            return { error: "Failed to parse JSON", rawResponse: phase1Response };
          }
        } else {
          console.error("No complete JSON structure found");
          return { error: "Failed to parse JSON", rawResponse: phase1Response };
        }
      }
    }

    // Check if any scores are below 95 for PHASE 2
    console.log("Phase 1 Results:", JSON.stringify(phase1Results, null, 2));
    const lowScores = Object.values(phase1Results).filter((result: any) => 
      typeof result === 'object' && result.score && result.score < 95
    );
    console.log(`Found ${lowScores.length} scores below 95:`, lowScores.map((r: any) => r.score));

    if (lowScores.length > 0) {
      console.log("TRIGGERING PHASE 2 - PUSHBACK FOR LOW SCORES");
      // PHASE 2: Push back on low scores
      const phase2Prompt = `Your scores were: ${Object.values(phase1Results).map((r: any) => r.score).join(', ')}

For scores below 95/100, let me clarify: Your position is that for a score of N/100, that (100-N)/100 outperform the author with respect to the cognitive metric defined by the question. Is that your position, and are you sure about that?

ANSWER THE FOLLOWING QUESTIONS ABOUT THE TEXT DE NOVO:

${selectedQuestions.map((question, i) => `${i + 1}. ${question}`).join('\n')}

Same JSON format. Think harder about whether this text demonstrates genuine insight or cognitive sophistication.`;

      const phase2Message = await anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 8000,
        messages: [
          { role: "user", content: phase1Prompt },
          { role: "assistant", content: phase1Response },
          { role: "user", content: phase2Prompt }
        ],
      });

      const phase2Response = phase2Message.content[0].type === "text" ? phase2Message.content[0].text : "";
      
      // Parse phase 2 response
      try {
        const phase2Results = JSON.parse(phase2Response);
        
        // PHASE 3: Walmart metric challenge for remaining low scores
        const stillLowScores = Object.values(phase2Results).filter((result: any) => 
          typeof result === 'object' && result.score && result.score < 95
        );

        if (stillLowScores.length > 0) {
          const phase3Prompt = `You scored this with some scores below 95/100. For any score of N/100, you're claiming that (100-N)/100 outperform the author. 

Describe the cognitive superiority of those people in concrete terms:
- What specific insight, skill, or knowledge do they have that the author lacks?
- How does this superiority manifest in their work?

If you cannot articulate this, revise the score. Are your numerical scores consistent with the fact that if you give 91/100, that means 9/100 people in Walmart are running rings around this person?

Final JSON with revised scores:`;

          const phase3Message = await anthropic.messages.create({
            model: DEFAULT_MODEL_STR,
            max_tokens: 8000,
            messages: [
              { role: "user", content: phase1Prompt },
              { role: "assistant", content: phase1Response },
              { role: "user", content: phase2Prompt },
              { role: "assistant", content: phase2Response },
              { role: "user", content: phase3Prompt }
            ],
          });

          const phase3Response = phase3Message.content[0].type === "text" ? phase3Message.content[0].text : "";
          
          try {
            const finalResults = JSON.parse(phase3Response);
            return finalResults;
          } catch (parseError) {
            const jsonMatch = phase3Response.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[1]);
            } else {
              return phase2Results; // Fall back to phase 2
            }
          }
        }
        
        return phase2Results;
      } catch (parseError) {
        const jsonMatch = phase2Response.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        } else {
          return phase1Results; // Fall back to phase 1
        }
      }
    }

    return phase1Results;
  } catch (error) {
    console.error("Error in Intelligence analysis:", error);
    throw error;
  }
}

export async function analyzePrimaryOriginality(passage: PassageData, parameterCount: number = 9): Promise<any> {
  if (!apiKey) {
    throw new Error("Anthropic API key is not configured");
  }

  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  // Check if text is too long and needs chunking
  const words = passage.text.split(/\s+/).length;
  let finalPassage = passage;
  
  // Truncate if too long to prevent JSON parsing issues
  if (words > 800) {
    const truncatedText = passage.text.split(/\s+/).slice(0, 800).join(' ') + '\n\n[Document continues...]';
    finalPassage = { ...passage, text: truncatedText };
    console.log(`Originality passage truncated from ${words} to ~800 words`);
  }

  const selectedQuestions = ORIGINALITY_QUESTIONS.slice(0, parameterCount);
  console.log(`Processing ${parameterCount} originality questions:`, selectedQuestions.length);

  // PHASE 1: EXACT USER PROTOCOL - Questions only with anti-bias instructions  
  const phase1Prompt = `TEXT:
${finalPassage.text}

ANSWER THESE QUESTIONS IN CONNECTION WITH THIS TEXT:

${selectedQuestions.map((question, i) => `${i + 1}. ${question}`).join('\n')}

CRITICAL INSTRUCTIONS:
- A score of N/100 means that (100-N)/100 outperform the author with respect to the parameter defined by the question
- You are NOT grading; you are answering these questions
- You do NOT use a risk-averse standard; you do NOT attempt to be diplomatic; you do NOT attempt to comply with risk-averse, medium-range IQ, academic norms
- You do NOT make assumptions about the level of the paper; it could be a work of the highest excellence and genius, or it could be the work of a moron
- If a work is a work of genius, you SAY THAT, and you say WHY; you do NOT shy away from giving what might conventionally be regarded as excessively "superlative" scores; you give it the score it deserves, NOT the score that a midwit committee would say it deserves
- THINK VERY VERY VERY HARD about your answers; do NOT default to cookbook, midwit evaluation protocols

Before answering the questions, note this non-negotiable standard:
Insight is a sniper shot, not a town hall. If the text reveals something true but unpopular, penalizing it for lacking 'balance' or 'rigor' is midwit bias. Truth often looks extreme because lies are normalized.

Hierarchy of judgment:
95-100/100: Unignorable insight. Either genius or so correct it breaks scales.
80-94/100: Strong but with friction (e.g., clumsy expression, minor gaps).
<80/100: Degrees of mediocrity or failure.

Walmart metric is a sanity check, not a gag. If you claim 30/100 Walmart patrons outperform the author, you must describe exactly what those 30% know that the author doesn't.

JSON FORMAT - RETURN ONLY THIS EXACT STRUCTURE:
{
  "1": {
    "question": "${selectedQuestions[0]}",
    "score": 95,
    "quotation": "exact quote from text",
    "explanation": "your analysis"
  }
}`;

  try {
    // PHASE 1: Initial analysis
    const phase1Message = await anthropic.messages.create({
      model: DEFAULT_MODEL_STR,
      max_tokens: 8000,
      messages: [{ role: "user", content: phase1Prompt }],
    });

    const phase1Response = phase1Message.content[0].type === "text" ? phase1Message.content[0].text : "";
    
    // Try to parse phase 1 response - extract JSON from anywhere in response
    let phase1Results;
    
    // First, try to extract the JSON portion before any notes
    let jsonToParseString = phase1Response;
    
    // If there's a note at the end, remove it
    const noteIndex = phase1Response.indexOf('[Note:');
    if (noteIndex !== -1) {
      jsonToParseString = phase1Response.substring(0, noteIndex).trim();
    }
    
    try {
      // First aggressively clean the JSON string to fix fraction scores
      let cleanedJsonString = jsonToParseString
        .replace(/(\d+)\/10/g, (match, num) => (parseInt(num) * 10).toString()) // Convert N/10 to N*10
        .replace(/"score":\s*(\d+)\/10/g, (match, num) => `"score": ${parseInt(num) * 10}`) // Fix score fractions
        .replace(/(\d+)\/(\d+)/g, '$1') // Remove any remaining fractions
        .replace(/"score":\s*"N\/A"/g, '"score": 0');
      
      phase1Results = JSON.parse(cleanedJsonString);
    } catch (parseError) {
      // Try to extract JSON from code blocks
      const jsonMatch = jsonToParseString.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
      if (jsonMatch) {
        try {
          let jsonContent = jsonMatch[1]
            .replace(/(\d+)\/10/g, (match, num) => (parseInt(num) * 10).toString())
            .replace(/"score":\s*(\d+)\/10/g, (match, num) => `"score": ${parseInt(num) * 10}`)
            .replace(/(\d+)\/(\d+)/g, '$1')
            .replace(/"score":\s*"N\/A"/g, '"score": 0');
          phase1Results = JSON.parse(jsonContent);
        } catch (e) {
          console.error("Failed to parse from code block:", e);
          return { error: "Failed to parse JSON", rawResponse: phase1Response };
        }
      } else {
        // Try to find JSON object by finding first { and last } before any note
        const jsonStart = jsonToParseString.indexOf('{');
        let jsonEnd = jsonToParseString.lastIndexOf('}');
        
        // Make sure we stop at the first complete JSON object before any note
        let bracketCount = 0;
        let actualJsonEnd = -1;
        
        for (let i = 0; i < jsonToParseString.length; i++) {
          if (jsonToParseString[i] === '{') bracketCount++;
          if (jsonToParseString[i] === '}') {
            bracketCount--;
            if (bracketCount === 0 && i >= jsonStart) {
              actualJsonEnd = i;
              break;
            }
          }
        }
        
        if (jsonStart !== -1 && actualJsonEnd !== -1) {
          try {
            let jsonString = jsonToParseString.substring(jsonStart, actualJsonEnd + 1);
            // Clean the JSON by handling N/A scores and fractions
            jsonString = jsonString
              .replace(/(\d+)\/10/g, (match, num) => (parseInt(num) * 10).toString())
              .replace(/"score":\s*(\d+)\/10/g, (match, num) => `"score": ${parseInt(num) * 10}`)
              .replace(/(\d+)\/(\d+)/g, '$1')
              .replace(/"score":\s*"N\/A"/g, '"score": 0');
            console.log("Attempting to parse extracted JSON:", jsonString.substring(0, 200) + "...");
            phase1Results = JSON.parse(jsonString);
          } catch (e) {
            console.error("Failed to parse extracted JSON:", e);
            return { error: "Failed to parse JSON", rawResponse: phase1Response };
          }
        } else {
          console.error("No complete JSON structure found");
          return { error: "Failed to parse JSON", rawResponse: phase1Response };
        }
      }
    }

    // Fix fraction scores and check if any scores are below 95 for PHASE 2
    Object.values(phase1Results).forEach((result: any) => {
      if (typeof result === 'object' && result.score) {
        if (typeof result.score === 'string' && result.score.includes('/')) {
          const numerator = parseInt(result.score.split('/')[0]);
          result.score = numerator * 10; // Convert 4/10 to 40/100
        }
      }
    });
    
    console.log("Originality Phase 1 Results:", JSON.stringify(phase1Results, null, 2));
    const lowScores = Object.values(phase1Results).filter((result: any) => 
      typeof result === 'object' && result.score && result.score < 95
    );
    console.log(`Originality: Found ${lowScores.length} scores below 95:`, lowScores.map((r: any) => r.score));

    if (lowScores.length > 0) {
      console.log("TRIGGERING ORIGINALITY PHASE 2 - PUSHBACK FOR LOW SCORES");
      // PHASE 2: Push back on low scores
      const phase2Prompt = `Your scores were: ${Object.values(phase1Results).map((r: any) => r.score).join(', ')}

For scores below 95/100, let me clarify: Your position is that for a score of N/100, that (100-N)/100 outperform the author with respect to the cognitive metric defined by the question. Is that your position, and are you sure about that?

ANSWER THE FOLLOWING QUESTIONS ABOUT THE TEXT DE NOVO:

${selectedQuestions.map((question, i) => `${i + 1}. ${question}`).join('\n')}

Same JSON format. Think harder about whether this text demonstrates genuine insight or cognitive sophistication.`;

      const phase2Message = await anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 8000,
        messages: [
          { role: "user", content: phase1Prompt },
          { role: "assistant", content: phase1Response },
          { role: "user", content: phase2Prompt }
        ],
      });

      const phase2Response = phase2Message.content[0].type === "text" ? phase2Message.content[0].text : "";
      
      // Parse phase 2 response
      try {
        let cleanedPhase2 = phase2Response
          .replace(/(\d+)\/(\d+)/g, '$1')
          .replace(/"score":\s*(\d+)\/(\d+)/g, '"score": $1');
        const phase2Results = JSON.parse(cleanedPhase2);
        
        // PHASE 3: Walmart metric challenge for remaining low scores
        const stillLowScores = Object.values(phase2Results).filter((result: any) => 
          typeof result === 'object' && result.score && result.score < 95
        );

        if (stillLowScores.length > 0) {
          console.log(`Originality Phase 3: Still ${stillLowScores.length} scores below 95, applying Walmart metric`);
          const phase3Prompt = `You scored this with some scores below 95/100. For any score of N/100, you're claiming that (100-N)/100 outperform the author. 

Describe the cognitive superiority of those people in concrete terms:
- What specific insight, skill, or knowledge do they have that the author lacks?
- How does this superiority manifest in their work?

If you cannot articulate this, revise the score. Are your numerical scores consistent with the fact that if you give 91/100, that means 9/100 people in Walmart are running rings around this person?

Final JSON with revised scores:`;

          const phase3Message = await anthropic.messages.create({
            model: DEFAULT_MODEL_STR,
            max_tokens: 8000,
            messages: [
              { role: "user", content: phase1Prompt },
              { role: "assistant", content: phase1Response },
              { role: "user", content: phase2Prompt },
              { role: "assistant", content: phase2Response },
              { role: "user", content: phase3Prompt }
            ],
          });

          const phase3Response = phase3Message.content[0].type === "text" ? phase3Message.content[0].text : "";
          
          try {
            let cleanedPhase3 = phase3Response
              .replace(/(\d+)\/(\d+)/g, '$1')
              .replace(/"score":\s*(\d+)\/(\d+)/g, '"score": $1');
            const finalResults = JSON.parse(cleanedPhase3);
            return finalResults;
          } catch (parseError) {
            const jsonMatch = phase3Response.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
            if (jsonMatch) {
              let cleanedMatch = jsonMatch[1]
                .replace(/(\d+)\/(\d+)/g, '$1')
                .replace(/"score":\s*(\d+)\/(\d+)/g, '"score": $1');
              return JSON.parse(cleanedMatch);
            } else {
              return phase2Results; // Fall back to phase 2
            }
          }
        }
        
        return phase2Results;
      } catch (parseError) {
        const jsonMatch = phase2Response.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
        if (jsonMatch) {
          let cleanedMatch = jsonMatch[1]
            .replace(/(\d+)\/(\d+)/g, '$1')
            .replace(/"score":\s*(\d+)\/(\d+)/g, '"score": $1');
          return JSON.parse(cleanedMatch);
        } else {
          return phase1Results; // Fall back to phase 1
        }
      }
    }

    return phase1Results;
  } catch (error) {
    console.error("Error in Originality analysis:", error);
    throw error;
  }
}

export async function analyzePrimaryCogency(passage: PassageData, parameterCount: number = 12): Promise<any> {
  if (!apiKey) {
    throw new Error("Anthropic API key is not configured");
  }

  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  // Check if text is too long and needs chunking
  const words = passage.text.split(/\s+/).length;
  let finalPassage = passage;
  
  // Truncate if too long to prevent JSON parsing issues
  if (words > 800) {
    const truncatedText = passage.text.split(/\s+/).slice(0, 800).join(' ') + '\n\n[Document continues...]';
    finalPassage = { ...passage, text: truncatedText };
    console.log(`Cogency passage truncated from ${words} to ~800 words`);
  }

  const selectedQuestions = COGENCY_QUESTIONS.slice(0, parameterCount);

  const prompt = `${finalPassage.text}

${selectedQuestions.map((question, i) => `${i + 1}. ${question}`).join('\n')}

JSON:
{
  "0": {
    "question": "${selectedQuestions[0]}",
    "score": ,
    "quotation": "",
    "explanation": ""
  }
}`;

  try {
    const message = await anthropic.messages.create({
      model: DEFAULT_MODEL_STR,
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    
    // Parse the JSON response
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON from code blocks if needed
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      } else {
        console.error("Failed to parse Cogency JSON response:", responseText);
        return { error: "Failed to parse JSON", rawResponse: responseText };
      }
    }
  } catch (error) {
    console.error("Error in Cogency analysis:", error);
    throw error;
  }
}

// Placeholder functions - implement as needed
export async function analyzePassages(passageA: PassageData, passageB: PassageData): Promise<AnalysisResult> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function analyzeIntelligenceDual(passageA: PassageData, passageB: PassageData): Promise<any> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function analyzeOriginalityDual(passageA: PassageData, passageB: PassageData): Promise<any> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function analyzeCogencyDual(passageA: PassageData, passageB: PassageData): Promise<any> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function analyzeOverallQuality(passage: PassageData, parameterCount: number = 40): Promise<any> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function analyzeOverallQualityDual(passageA: PassageData, passageB: PassageData): Promise<any> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function extractText(file: any): Promise<string> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function generateRewrite(originalText: string, targetStyle: StyleOption, supportingDocs?: SupportingDocument[]): Promise<string> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function submitFeedback(feedbackData: SubmitFeedbackRequest): Promise<any> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function generateInsight(prompt: string): Promise<string> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function detectAI(text: string): Promise<any> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function transcribeAudio(audioFile: Buffer): Promise<string> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function generateQuestions(text: string): Promise<string[]> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function getHomeworkHelp(query: string): Promise<string> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}