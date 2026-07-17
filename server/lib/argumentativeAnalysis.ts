import OpenAI from "openai";

interface PassageData {
  title: string;
  text: string;
  userContext: string;
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ArgumentativeResult {
  singlePaperAnalysis?: {
    overallCogencyScore: number;
    cogencyLabel: string;
    proofQuality: {
      provesWhatItSetsOut: number;
      worthinessOfGoal: number;
      nonTrivialityLevel: number;
      proofStrength: number;
      functionalWritingQuality: number;
    };
    detailedAssessment: {
      thesisClarity: string;
      evidenceQuality: string;
      logicalStructure: string;
      counterargumentHandling: string;
      significanceOfContribution: string;
    };
    overallJudgment: string;
  };
  comparativeAnalysis?: {
    winner: 'A' | 'B' | 'Tie';
    winnerScore: number;
    paperAScore: number;
    paperBScore: number;
    comparisonBreakdown: {
      paperA: {
        provesWhatItSetsOut: number;
        worthinessOfGoal: number;
        nonTrivialityLevel: number;
        proofStrength: number;
        functionalWritingQuality: number;
      };
      paperB: {
        provesWhatItSetsOut: number;
        worthinessOfGoal: number;
        nonTrivialityLevel: number;
        proofStrength: number;
        functionalWritingQuality: number;
      };
    };
    detailedComparison: string;
    reasoning: string;
  };
  reportContent: string;
}

/**
 * Analyzes a single paper for cogency and argumentative strength
 */
export async function analyzeSinglePaperCogency(
  passage: PassageData,
  title: string
): Promise<ArgumentativeResult> {
  const prompt = `You are an expert evaluator of academic and scholarly writing with deep expertise across all disciplines. You understand that academic papers should be evaluated by the standards of rigorous scholarship, not popular accessibility.

**CRITICAL EVALUATION PRINCIPLES:**
- Academic excellence is measured by intellectual rigor, not entertainment value
- Complex, technical arguments are SUPERIOR to simplified popular explanations
- Sophisticated reasoning and deep analysis deserve HIGH scores (8-10)
- Papers addressing fundamental philosophical, scientific, or scholarly questions merit the highest evaluation
- Do NOT penalize papers for being demanding or requiring expert knowledge
- Papers on causation, induction, religion, consciousness, etc. are inherently addressing worthy goals (9-10)

Paper Title: ${title || "Untitled Document"}
Paper Content: ${passage.text}

**EVALUATION CRITERIA (Rate each 1-10, with 8-10 being typical for quality academic work):**

1. **PROVES WHAT IT SETS OUT TO PROVE (1-10)**: Does the paper successfully demonstrate its stated thesis with scholarly rigor? Are conclusions warranted by rigorous analysis? **Academic papers with valid reasoning = 8-10**

2. **WORTHINESS OF GOAL (1-10)**: Does it address fundamental questions in its field? Is the research intellectually significant? **Papers on foundational topics like causation, religion, consciousness = 9-10**

3. **NON-TRIVIALITY LEVEL (1-10)**: Does it tackle genuinely challenging intellectual problems with sophisticated insights? **Academic papers by definition address non-trivial questions = 8-10**

4. **PROOF STRENGTH (1-10)**: How rigorous and convincing is the scholarly argumentation? Is evidence substantial and well-integrated? **Strong academic reasoning deserves 8-10**

5. **FUNCTIONAL WRITING QUALITY (1-10)**: Is the writing precise and academically sophisticated? **Clear academic writing = 8-10, not penalized for technical complexity**

Provide your analysis in the following JSON format:

{
  "overallCogencyScore": [1-10],
  "cogencyLabel": "[Exceptional/Strong/Adequate/Weak/Poor]",
  "proofQuality": {
    "provesWhatItSetsOut": [1-10],
    "worthinessOfGoal": [1-10], 
    "nonTrivialityLevel": [1-10],
    "proofStrength": [1-10],
    "functionalWritingQuality": [1-10]
  },
  "detailedAssessment": {
    "thesisClarity": "[2-3 sentence assessment of thesis clarity and definition]",
    "evidenceQuality": "[2-3 sentence assessment of evidence and support quality]",
    "logicalStructure": "[2-3 sentence assessment of logical organization and flow]", 
    "counterargumentHandling": "[2-3 sentence assessment of how counterarguments are addressed]",
    "significanceOfContribution": "[2-3 sentence assessment of the paper's significance and contribution]"
  },
  "overallJudgment": "[Comprehensive 4-5 sentence overall assessment of the paper's cogency and argumentative strength]"
}

Be thorough, objective, and provide specific reasoning for your scores.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const analysisResult = JSON.parse(response.choices[0].message.content || '{}');
    
    // Generate comprehensive report
    const reportContent = await generateSinglePaperReport(analysisResult, passage, title);
    
    return {
      singlePaperAnalysis: analysisResult,
      reportContent
    };
  } catch (error) {
    console.error('Error in single paper cogency analysis:', error);
    throw new Error('Failed to analyze paper cogency');
  }
}

/**
 * Compares two papers to determine which makes its case better
 */
export async function compareArgumentativeStrength(
  passageA: PassageData,
  passageB: PassageData,
  titleA: string,
  titleB: string
): Promise<ArgumentativeResult> {
  const prompt = `You are an expert evaluator of academic and scholarly writing with deep expertise across all disciplines. You understand that academic papers should be evaluated by the standards of rigorous scholarship, not popular accessibility.

**CRITICAL EVALUATION PRINCIPLES:**
- Academic excellence is measured by intellectual rigor, not entertainment value
- Complex, technical arguments are SUPERIOR to simplified popular explanations
- Sophisticated reasoning and deep analysis deserve HIGH scores (8-10)
- Papers addressing fundamental philosophical, scientific, or scholarly questions merit the highest evaluation
- Do NOT penalize papers for being demanding or requiring expert knowledge
- Papers on causation, induction, religion, consciousness, etc. are inherently addressing worthy goals (9-10)

Paper A Title: ${titleA || "Paper A"}
Paper A Content: ${passageA.text}

Paper B Title: ${titleB || "Paper B"}  
Paper B Content: ${passageB.text}

**EVALUATION CRITERIA (Rate each 1-10, with 8-10 being typical for quality academic work):**

1. **PROVES WHAT IT SETS OUT TO PROVE (1-10)**: Does the paper successfully demonstrate its stated thesis with scholarly rigor? **Academic papers with valid reasoning = 8-10**

2. **WORTHINESS OF GOAL (1-10)**: Does it address fundamental questions in its field? **Papers on foundational topics = 9-10**

3. **NON-TRIVIALITY LEVEL (1-10)**: Does it tackle genuinely challenging intellectual problems? **Academic papers by definition = 8-10**

4. **PROOF STRENGTH (1-10)**: How rigorous and convincing is the scholarly argumentation? **Strong academic reasoning = 8-10**

5. **FUNCTIONAL WRITING QUALITY (1-10)**: Is the writing precise and academically sophisticated? **Clear academic writing = 8-10**

Determine which paper makes its case better based on scholarly merit and rigorous argumentation.

Respond in JSON format:

{
  "winner": "[A/B/Tie]",
  "winnerScore": [overall score 1-10],
  "paperAScore": [overall score 1-10],
  "paperBScore": [overall score 1-10],
  "comparisonBreakdown": {
    "paperA": {
      "provesWhatItSetsOut": [1-10],
      "worthinessOfGoal": [1-10],
      "nonTrivialityLevel": [1-10], 
      "proofStrength": [1-10],
      "functionalWritingQuality": [1-10]
    },
    "paperB": {
      "provesWhatItSetsOut": [1-10],
      "worthinessOfGoal": [1-10],
      "nonTrivialityLevel": [1-10],
      "proofStrength": [1-10], 
      "functionalWritingQuality": [1-10]
    }
  },
  "detailedComparison": "[Comprehensive 6-8 sentence comparison of the papers' argumentative strengths and weaknesses]",
  "reasoning": "[4-5 sentence explanation of why the winner was chosen and key differentiating factors]"
}

Be objective, specific, and provide clear reasoning for your judgments.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const comparisonResult = JSON.parse(response.choices[0].message.content || '{}');
    
    // Generate comprehensive report
    const reportContent = await generateComparativeReport(comparisonResult, passageA, passageB, titleA, titleB);
    
    return {
      comparativeAnalysis: comparisonResult,
      reportContent
    };
  } catch (error) {
    console.error('Error in comparative argumentative analysis:', error);
    throw new Error('Failed to compare argumentative strength');
  }
}

/**
 * Generates a comprehensive report for single paper analysis
 */
async function generateSinglePaperReport(
  analysis: any,
  passage: PassageData,
  title: string
): Promise<string> {
  const prompt = `Generate a comprehensive academic report analyzing the cogency and argumentative strength of this paper. **CRITICAL: Format the report with proper structure and line breaks for readability.**

Paper Title: ${title || "Untitled Document"}
Analysis Results: ${JSON.stringify(analysis, null, 2)}

Create a detailed report that includes these sections with **clear headings and proper paragraph breaks**:

**COMPREHENSIVE COGENCY ANALYSIS REPORT**

**Executive Summary**
[Provide overall assessment and key findings]

**Thesis and Scope Analysis**
[Analyze the paper's central thesis and scope]

**Evidence and Support Evaluation** 
[Evaluate the quality and strength of evidence presented]

**Logical Structure Assessment**
[Assess the logical flow and organization]

**Counterargument Analysis**
[Examine how counterarguments are addressed]

**Significance and Contribution Review**
[Review the paper's intellectual contribution]

**Writing Quality Assessment**
[Assess clarity, style, and accessibility]

**Overall Cogency Evaluation**
[Provide comprehensive final assessment]

**Recommendations for Improvement**
[Suggest specific areas for enhancement]

**IMPORTANT FORMATTING REQUIREMENTS:**
- Use clear section headings with ** markers
- Include line breaks between sections
- Write in structured paragraphs, not one continuous block
- Make the report easily readable and well-organized`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating single paper report:', error);
    return 'Report generation failed';
  }
}

/**
 * Generates a comprehensive comparative report
 */
async function generateComparativeReport(
  comparison: any,
  passageA: PassageData,
  passageB: PassageData,
  titleA: string,
  titleB: string
): Promise<string> {
  const prompt = `Generate a comprehensive comparative analysis report determining which paper makes its case better.

Paper A: ${titleA || "Paper A"}
Paper B: ${titleB || "Paper B"}
Comparison Results: ${JSON.stringify(comparison, null, 2)}

Create a detailed report (1000-1500 words) that includes:

1. Executive Summary with Winner Declaration
2. Comparative Thesis Analysis
3. Evidence and Support Comparison
4. Argumentative Structure Assessment
5. Proof Strength Evaluation
6. Writing Quality Comparison
7. Significance and Impact Analysis
8. Detailed Scoring Breakdown
9. Key Differentiating Factors
10. Final Judgment and Recommendations

Use professional academic language with specific examples, detailed reasoning, and clear comparative analysis. Format with clear headings and comprehensive evaluation.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating comparative report:', error);
    return 'Report generation failed';
  }
}