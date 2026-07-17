import OpenAI from "openai";

export interface GenreClassification {
  genre: string;
  confidence: number;
  reasoning: string;
  evaluationWeights: {
    inferentialStructure: number;
    conceptualControl: number;
    argumentativeIntegrity: number;
    synthesisIntegration: number;
  };
  scoringCriteria: {
    inferentialStructure: string;
    conceptualControl: string;
    argumentativeIntegrity: string;
    synthesisIntegration: string;
  };
}

export async function detectGenreAndGetCriteria(text: string): Promise<GenreClassification> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const prompt = `You are an expert in academic genre classification. Analyze this text and determine its genre/disciplinary mode, then provide appropriate evaluation criteria.

TEXT TO CLASSIFY: ${text.substring(0, 3000)}

GENRE OPTIONS:
- Mathematical Logic/Formal Proof
- Philosophical Argumentation  
- Empirical Research/Analysis
- Literary/Textual Criticism
- Theological/Religious Discourse
- Scientific Theory/Hypothesis
- Legal Argumentation
- Historical Analysis
- Mixed/Interdisciplinary

For each genre, use these evaluation principles:

MATHEMATICAL LOGIC/FORMAL PROOF:
- Inferential Structure (40%): Proof validity, logical steps, mathematical rigor
- Conceptual Control (35%): Definition precision, formal notation consistency  
- Argumentative Integrity (15%): Proof completeness, addressing scope
- Synthesis Integration (10%): Connection to broader mathematical context

PHILOSOPHICAL ARGUMENTATION:
- Inferential Structure (25%): Layered reasoning, recursive critique, resolution of tensions
- Conceptual Control (30%): Precise distinctions, consistent terminology, conceptual innovation
- Argumentative Integrity (25%): Addressing objections, completing inferential trajectories, philosophical closure
- Synthesis Integration (20%): Integration of philosophical traditions, theoretical synthesis

EMPIRICAL RESEARCH:
- Inferential Structure (25%): Data analysis validity, causal reasoning
- Conceptual Control (20%): Operational definitions, methodology clarity
- Argumentative Integrity (30%): Evidence support, limitation acknowledgment
- Synthesis Integration (25%): Literature integration, broader implications

LITERARY/TEXTUAL CRITICISM:
- Inferential Structure (20%): Interpretive reasoning, textual evidence
- Conceptual Control (25%): Theoretical framework clarity
- Argumentative Integrity (25%): Sustained reading, textual support
- Synthesis Integration (30%): Theoretical synthesis, cultural context

Return ONLY valid JSON:
{
  "genre": "detected genre",
  "confidence": 0.95,
  "reasoning": "why this genre classification",
  "evaluationWeights": {
    "inferentialStructure": 40,
    "conceptualControl": 35,
    "argumentativeIntegrity": 15,
    "synthesisIntegration": 10
  },
  "scoringCriteria": {
    "inferentialStructure": "what to evaluate for this parameter in this genre",
    "conceptualControl": "what to evaluate for this parameter in this genre",
    "argumentativeIntegrity": "what to evaluate for this parameter in this genre", 
    "synthesisIntegration": "what to evaluate for this parameter in this genre"
  }
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 1500
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No response content from OpenAI");
  }

  return JSON.parse(content);
}