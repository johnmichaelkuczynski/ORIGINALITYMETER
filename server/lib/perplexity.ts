import type { AnalysisResult } from "../../shared/schema";

interface PassageData {
  title: string;
  text: string;
}

const apiKey = process.env.PERPLEXITY_API_KEY;
console.log("Perplexity API Key status:", apiKey ? "Present" : "Missing");

// EXACT USER PROTOCOL QUESTIONS - NO MODIFICATIONS
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

export async function analyzePassages(
  passageA: PassageData,
  passageB: PassageData
): Promise<AnalysisResult> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function analyzeOriginality(passage: PassageData): Promise<any> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function analyzePrimaryOriginality(passage: PassageData, parameterCount: number = 9): Promise<any> {
  if (!apiKey) {
    throw new Error("Perplexity API key is not configured");
  }

  // Check if text is too long and needs chunking
  const words = passage.text.split(/\s+/).length;
  let finalPassage = passage;
  
  // Truncate if too long to prevent JSON parsing issues
  if (words > 800) {
    const truncatedText = passage.text.split(/\s+/).slice(0, 800).join(' ') + '\n\n[Document continues...]';
    finalPassage = { ...passage, text: truncatedText };
    console.log(`Perplexity Originality passage truncated from ${words} to ~800 words`);
  }

  const selectedQuestions = ORIGINALITY_QUESTIONS.slice(0, parameterCount);

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
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 8000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.choices[0].message.content;
    
    // Parse the JSON response
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON from code blocks if needed
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      } else {
        console.error("Failed to parse Perplexity Originality JSON response:", responseText);
        return { error: "Failed to parse JSON", rawResponse: responseText };
      }
    }
  } catch (error) {
    console.error("Error in Perplexity Originality analysis:", error);
    throw error;
  }
}

export async function analyzePrimaryIntelligence(passage: PassageData, parameterCount: number = 18): Promise<any> {
  if (!apiKey) {
    throw new Error("Perplexity API key is not configured");
  }

  // Check if text is too long and needs chunking
  const words = passage.text.split(/\s+/).length;
  let finalPassage = passage;
  
  // Truncate if too long to prevent JSON parsing issues
  if (words > 800) {
    const truncatedText = passage.text.split(/\s+/).slice(0, 800).join(' ') + '\n\n[Document continues...]';
    finalPassage = { ...passage, text: truncatedText };
    console.log(`Perplexity Intelligence passage truncated from ${words} to ~800 words`);
  }

  const selectedQuestions = INTELLIGENCE_QUESTIONS.slice(0, parameterCount);

  const prompt = `${finalPassage.text}

${selectedQuestions.map((question, i) => `${i + 1}. ${question}`).join('\n')}

Return ONLY valid JSON:
{
  "1": {
    "question": "${selectedQuestions[0]}",
    "score": 85,
    "quotation": "relevant quote",
    "explanation": "analysis"
  }
}`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 8000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.choices[0].message.content;
    
    // Parse the JSON response
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON from code blocks if needed
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      } else {
        console.error("Failed to parse Perplexity Intelligence JSON response:", responseText);
        return { error: "Failed to parse JSON", rawResponse: responseText };
      }
    }
  } catch (error) {
    console.error("Error in Perplexity Intelligence analysis:", error);
    throw error;
  }
}

export async function analyzePrimaryCogency(passage: PassageData, parameterCount: number = 12): Promise<any> {
  if (!apiKey) {
    throw new Error("Perplexity API key is not configured");
  }

  // Check if text is too long and needs chunking
  const words = passage.text.split(/\s+/).length;
  let finalPassage = passage;
  
  // Truncate if too long to prevent JSON parsing issues
  if (words > 800) {
    const truncatedText = passage.text.split(/\s+/).slice(0, 800).join(' ') + '\n\n[Document continues...]';
    finalPassage = { ...passage, text: truncatedText };
    console.log(`Perplexity Cogency passage truncated from ${words} to ~800 words`);
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
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 8000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.choices[0].message.content;
    
    // Parse the JSON response
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON from code blocks if needed
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      } else {
        console.error("Failed to parse Perplexity Cogency JSON response:", responseText);
        return { error: "Failed to parse JSON", rawResponse: responseText };
      }
    }
  } catch (error) {
    console.error("Error in Perplexity Cogency analysis:", error);
    throw error;
  }
}

export async function analyzeOriginalityDual(passageA: PassageData, passageB: PassageData): Promise<any> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function analyzeIntelligence(passage: PassageData): Promise<any> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function analyzeIntelligenceDual(passageA: PassageData, passageB: PassageData): Promise<any> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function analyzeCogency(passage: PassageData): Promise<any> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function analyzeCogencyDual(passageA: PassageData, passageB: PassageData): Promise<any> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function analyzeOverallQuality(passage: PassageData): Promise<any> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function analyzeOverallQualityDual(passageA: PassageData, passageB: PassageData): Promise<any> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

// Additional utility functions that might be needed
export async function extractText(file: any): Promise<string> {
  throw new Error("CANNED_FALLBACK_BLOCKED: remove this and call the provider.");
}

export async function generateRewrite(
  originalText: string, 
  targetStyle: StyleOption,
  supportingDocs?: SupportingDocument[]
): Promise<string> {
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