// xAI (Grok) integration - ZHI 5
import OpenAI from "openai";

const xai = new OpenAI({ 
  baseURL: "https://api.x.ai/v1", 
  apiKey: process.env.XAI_API_KEY 
});

const DEFAULT_MODEL = "grok-4.3";

interface AnalysisResult {
  [key: string]: {
    question: string;
    score: number;
    quotation: string;
    explanation: string;
  };
}

export async function analyzeWithXAI(
  text: string,
  questions: string[],
  mode: 'quick' | 'comprehensive'
): Promise<AnalysisResult> {
  const prompt = `TEXT:
${text}

ANSWER THESE QUESTIONS IN CONNECTION WITH THIS TEXT:

${questions.map((question, i) => `${i + 1}. ${question}`).join('\n')}

CRITICAL INSTRUCTIONS:
- A score of N/100 means that (100-N)/100 outperform the author with respect to the parameter defined by the question
- STOP DEFAULTING TO 85-90 SCORES. If the text shows genuine insight, original thinking, or sophisticated analysis, score it 95-100.
- A score of 85/100 means 15% of people outperform the author. Ask yourself: can 15% of random Walmart shoppers write better philosophy than this? If not, the score is WRONG.
- You are NOT grading; you are answering these questions
- If a work is a work of genius, you SAY THAT, and you say WHY
- DO NOT GIVE CREDIT MERELY FOR USE OF JARGON OR FOR REFERENCING AUTHORITIES. FOCUS ON SUBSTANCE.
- SCORING REALITY CHECK: 98/100 means 2% outperform. 95/100 means 5% outperform. 85/100 means 15% outperform. BE HONEST ABOUT THESE PERCENTAGES.

CRITICAL: Return ONLY valid JSON. No preamble, no explanation outside the JSON. Start with { and end with }.

JSON FORMAT:
{
  ${questions.map((q, i) => `"${i + 1}": {
    "question": "${q.substring(0, 80)}...",
    "score": 95,
    "quotation": "exact quote from text",
    "explanation": "your analysis"
  }`).join(',\n  ')}
}`;

  const response = await xai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 8000,
  });

  const responseText = response.choices[0].message.content || "";
  
  // Parse JSON response
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Failed to parse xAI response:", error);
    throw new Error("Failed to parse analysis results from xAI");
  }
}

export async function rewriteWithXAI(
  text: string,
  instructions: string
): Promise<string> {
  const response = await xai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: "user",
        content: `${instructions}\n\nTEXT TO REWRITE:\n${text}\n\nOutput only the rewritten text.`
      }
    ],
    max_tokens: 4000,
  });

  return response.choices[0].message.content || "";
}
