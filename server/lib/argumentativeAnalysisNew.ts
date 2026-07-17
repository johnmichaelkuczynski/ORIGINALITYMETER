import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type LLMProvider = "openai" | "anthropic" | "perplexity";

interface PassageData {
  title: string;
  text: string;
  userContext: string;
}

interface ArgumentReconstruction {
  originalReconstruction: string;
  improvedArgument: string;
  improvementReasoning: string;
}

interface ValidationResult {
  isValid: boolean;
  feedback: string;
  accurateReconstruction: boolean;
  superiorImprovement: boolean;
}

interface ArgumentativeResult {
  singlePaperAnalysis?: {
    overallCogencyScore: number;
    cogencyLabel: string;
    argumentSummary: string;
    superiorReconstruction: string;
    coreParameters: {
      clarityOfArgument: {
        assessment: string;
        quotes: string[];
      };
      inferentialCohesion: {
        assessment: string;
        quotes: string[];
      };
      conceptualPrecision: {
        assessment: string;
        quotes: string[];
      };
      evidentialSupport: {
        assessment: string;
        quotes: string[];
      };
      counterargumentHandling: {
        assessment: string;
        quotes: string[];
      };
      cognitiveRisk: {
        assessment: string;
        quotes: string[];
      };
      epistemicControl: {
        assessment: string;
        quotes: string[];
      };
    };
    overallJudgment: string;
    argumentReconstruction: ArgumentReconstruction;
  };
  comparativeAnalysis?: {
    winner: 'A' | 'B' | 'Tie';
    winnerScore: number;
    paperAScore: number;
    paperBScore: number;
    paperASummary: string;
    paperBSummary: string;
    paperASuperiorReconstruction: string;
    paperBSuperiorReconstruction: string;
    comparisonBreakdown: {
      paperA: {
        clarityOfArgument: number;
        inferentialCohesion: number;
        conceptualPrecision: number;
        evidentialSupport: number;
        counterargumentHandling: number;
        cognitiveRisk: number;
        epistemicControl: number;
      };
      paperB: {
        clarityOfArgument: number;
        inferentialCohesion: number;
        conceptualPrecision: number;
        evidentialSupport: number;
        counterargumentHandling: number;
        cognitiveRisk: number;
        epistemicControl: number;
      };
    };
    detailedComparison: string;
    reasoning: string;
    argumentReconstructionA: ArgumentReconstruction;
    argumentReconstructionB: ArgumentReconstruction;
  };
  reportContent: string;
}

/**
 * Step 1: Reconstruct the original argument and create an improved version
 */
async function reconstructAndImproveArgument(
  text: string, 
  title: string, 
  previousFeedback?: string
): Promise<ArgumentReconstruction> {
  const prompt = `You are an expert in argument analysis and reconstruction. Your task is to:

1. **RECONSTRUCT the original argument** presented in this text
2. **CREATE an improved version** of that argument  
3. **EXPLAIN why** the improved version is superior

${previousFeedback ? `**Previous feedback to address:** ${previousFeedback}` : ''}

**Paper Title:** ${title || "Untitled Document"}
**Paper Content:** ${text}

**TASK REQUIREMENTS:**

**1. ORIGINAL ARGUMENT RECONSTRUCTION**
Identify and clearly state the main argument(s) the paper presents. Include:
- The central thesis or claim
- Key premises and supporting points
- The logical structure connecting premises to conclusion
- Any sub-arguments that support the main thesis

**2. IMPROVED ARGUMENT VERSION**
Create a superior version of the same argument by:
- Strengthening weak premises with better evidence or reasoning
- Addressing potential counterarguments more thoroughly
- Improving logical connections between premises
- Adding missing steps in the reasoning chain
- Clarifying ambiguous terms or concepts

**3. IMPROVEMENT REASONING**
Explain specifically why your improved version is better:
- What weaknesses in the original you addressed
- How your changes strengthen the argument
- Why the improved version is more persuasive or logically sound

Respond in JSON format:
{
  "originalReconstruction": "Detailed reconstruction of the original argument",
  "improvedArgument": "Your improved version of the argument", 
  "improvementReasoning": "Specific explanation of why the improved version is superior"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error in argument reconstruction:', error);
    throw new Error('Failed to reconstruct argument');
  }
}

/**
 * Step 2: Validate the reconstruction and improvement with the LLM
 */
async function validateReconstruction(
  originalText: string,
  reconstruction: ArgumentReconstruction
): Promise<ValidationResult> {
  const prompt = `You are an expert evaluator. You must validate whether an argument reconstruction and improvement are accurate and genuinely superior.

**ORIGINAL TEXT:** ${originalText}

**PROPOSED RECONSTRUCTION:** ${reconstruction.originalReconstruction}

**PROPOSED IMPROVED VERSION:** ${reconstruction.improvedArgument}

**REASONING FOR IMPROVEMENT:** ${reconstruction.improvementReasoning}

**VALIDATION QUESTIONS:**

1. **Is the reconstruction accurate?** Does it faithfully represent the actual argument(s) made in the original text?

2. **Is the improved version genuinely superior?** Does it actually strengthen the argument in meaningful ways while maintaining the same core thesis?

Be strict in your evaluation. Only approve if BOTH the reconstruction is accurate AND the improvement is genuinely superior.

Respond in JSON format:
{
  "isValid": true/false,
  "feedback": "Specific feedback on what needs to be corrected if invalid",
  "accurateReconstruction": true/false,
  "superiorImprovement": true/false
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error in validation:', error);
    return {
      isValid: false,
      feedback: "Validation failed due to technical error",
      accurateReconstruction: false,
      superiorImprovement: false
    };
  }
}

/**
 * Analyzes a single paper for cogency and argumentative strength
 */
export async function analyzeSinglePaperCogency(
  passage: PassageData,
  title: string
): Promise<ArgumentativeResult> {
  try {
    // Step 1: Reconstruct and improve the argument
    console.log("Step 1: Reconstructing argument...");
    let reconstructionResult = await reconstructAndImproveArgument(passage.text, title);
    
    // Step 2: Validate the reconstruction
    console.log("Step 2: Validating reconstruction...");
    let validationResult = await validateReconstruction(passage.text, reconstructionResult);
    
    // Retry if validation fails (up to 2 attempts)
    let attempts = 0;
    while (!validationResult.isValid && attempts < 2) {
      attempts++;
      console.log(`Validation failed, retrying (attempt ${attempts})...`);
      reconstructionResult = await reconstructAndImproveArgument(
        passage.text, 
        title, 
        validationResult.feedback
      );
      validationResult = await validateReconstruction(passage.text, reconstructionResult);
    }
    
    // Step 3: Perform evaluation based on validated reconstruction
    console.log("Step 3: Performing final evaluation...");
    const evaluationPrompt = `You are an expert evaluator of academic and scholarly writing. You have access to a validated argument reconstruction. Evaluate the original paper's cogency.

**CRITICAL EVALUATION PRINCIPLES:**
- Academic excellence is measured by intellectual rigor, not conventional acceptance
- Complex, technical arguments are SUPERIOR to simplified explanations
- Papers addressing fundamental questions deserve HIGH scores (9-10) regardless of accessibility
- Original research and novel argumentation should receive top scores (9-10)
- Do NOT penalize papers for challenging conventional wisdom or being intellectually demanding
- Quality academic work typically scores 8-10, with 9-10 for exceptional scholarship

**Paper Title:** ${title || "Untitled Document"}
**Validated Original Argument:** ${reconstructionResult.originalReconstruction}
**Improved Argument:** ${reconstructionResult.improvedArgument}
**Why Improved Version is Better:** ${reconstructionResult.improvementReasoning}

**SCORING GUIDELINES - BE GENEROUS WITH HIGH SCORES:**
- Papers on logic, mathematics, philosophy, semantics, consciousness = inherently 9-10 worthy goals
- Rigorous formal proofs and logical arguments = 9-10 proof strength
- Novel theoretical contributions = 9-10 non-triviality
- Clear academic writing with complex ideas = 9-10 writing quality
- Successfully advancing knowledge = 9-10 proves what it sets out

**EVALUATION CRITERIA (Rate each 1-10, with 9-10 being typical for quality academic work):**

1. **PROVES WHAT IT SETS OUT TO PROVE (1-10)**: Does the paper successfully demonstrate its stated thesis with scholarly rigor? **Strong academic arguments = 9-10**

2. **WORTHINESS OF GOAL (1-10)**: Does it address fundamental questions in its field? **Papers on foundational topics = 9-10**

3. **NON-TRIVIALITY LEVEL (1-10)**: Does it tackle genuinely challenging intellectual problems? **Original academic research = 9-10**

4. **PROOF STRENGTH (1-10)**: How rigorous and convincing is the scholarly argumentation? **Formal proofs and logical reasoning = 9-10**

5. **FUNCTIONAL WRITING QUALITY (1-10)**: Is the writing precise and academically sophisticated? **Clear academic writing = 9-10**

Provide your analysis in JSON format:

{
  "overallCogencyScore": <average of 5 dimensions>,
  "cogencyLabel": "<Exceptional (9-10) | Strong (7-8) | Adequate (5-6) | Weak (3-4) | Poor (1-2)>",
  "proofQuality": {
    "provesWhatItSetsOut": <score>,
    "worthinessOfGoal": <score>,
    "nonTrivialityLevel": <score>,
    "proofStrength": <score>,
    "functionalWritingQuality": <score>
  },
  "detailedAssessment": {
    "thesisClarity": "<assessment based on reconstruction>",
    "evidenceQuality": "<assessment of evidence quality>",
    "logicalStructure": "<assessment of logical flow>",
    "counterargumentHandling": "<assessment of counterarguments>",
    "significanceOfContribution": "<assessment of intellectual contribution>"
  },
  "overallJudgment": "<comprehensive evaluation summary>"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: evaluationPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const analysisResult = JSON.parse(response.choices[0].message.content || '{}');
    
    // Generate comprehensive report
    const reportContent = await generateSinglePaperReport(
      analysisResult, 
      reconstructionResult, 
      passage, 
      title
    );
    
    return {
      singlePaperAnalysis: {
        ...analysisResult,
        argumentReconstruction: reconstructionResult
      },
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
  try {
    // Step 1: Reconstruct both arguments
    console.log("Reconstructing arguments for both papers...");
    const [reconstructionA, reconstructionB] = await Promise.all([
      reconstructAndImproveArgument(passageA.text, titleA),
      reconstructAndImproveArgument(passageB.text, titleB)
    ]);
    
    // Step 2: Validate both reconstructions
    console.log("Validating both reconstructions...");
    const [validationA, validationB] = await Promise.all([
      validateReconstruction(passageA.text, reconstructionA),
      validateReconstruction(passageB.text, reconstructionB)
    ]);
    
    // Handle validation failures (simplified for comparison)
    let finalReconstructionA = reconstructionA;
    let finalReconstructionB = reconstructionB;
    
    // Step 3: Perform comparative evaluation
    const comparisonPrompt = `You are an expert evaluator of academic and scholarly writing. Compare these two papers based on their validated argument reconstructions.

**CRITICAL EVALUATION PRINCIPLES:**
- Academic excellence is measured by intellectual rigor, not conventional acceptance
- Complex, technical arguments are SUPERIOR to simplified explanations
- Papers addressing fundamental questions deserve HIGH scores (9-10) regardless of accessibility
- Original research and novel argumentation should receive top scores (9-10)
- Do NOT penalize papers for challenging conventional wisdom or being intellectually demanding
- Quality academic work typically scores 8-10, with 9-10 for exceptional scholarship

**Paper A:** ${titleA || "Paper A"}
**Paper A Argument:** ${finalReconstructionA.originalReconstruction}
**Paper A Improved:** ${finalReconstructionA.improvedArgument}

**Paper B:** ${titleB || "Paper B"}
**Paper B Argument:** ${finalReconstructionB.originalReconstruction}
**Paper B Improved:** ${finalReconstructionB.improvedArgument}

**SCORING GUIDELINES - BE GENEROUS WITH HIGH SCORES:**
- Papers on logic, mathematics, philosophy, semantics, consciousness = inherently 9-10 worthy goals
- Rigorous formal proofs and logical arguments = 9-10 proof strength
- Novel theoretical contributions = 9-10 non-triviality
- Clear academic writing with complex ideas = 9-10 writing quality
- Successfully advancing knowledge = 9-10 proves what it sets out

**EVALUATION CRITERIA (Rate each 1-10, with 9-10 being typical for quality academic work):**

1. **PROVES WHAT IT SETS OUT TO PROVE (1-10)**: Strong academic arguments = 9-10
2. **WORTHINESS OF GOAL (1-10)**: Papers on foundational topics = 9-10
3. **NON-TRIVIALITY LEVEL (1-10)**: Original academic research = 9-10
4. **PROOF STRENGTH (1-10)**: Formal proofs and logical reasoning = 9-10
5. **FUNCTIONAL WRITING QUALITY (1-10)**: Clear academic writing = 9-10

Determine which paper makes its case better based on scholarly merit and rigorous argumentation.

Respond in JSON format:
{
  "winner": "A/B/Tie",
  "winnerScore": <overall score 1-10>,
  "paperAScore": <overall score 1-10>,
  "paperBScore": <overall score 1-10>,
  "comparisonBreakdown": {
    "paperA": {
      "provesWhatItSetsOut": <score>,
      "worthinessOfGoal": <score>,
      "nonTrivialityLevel": <score>,
      "proofStrength": <score>,
      "functionalWritingQuality": <score>
    },
    "paperB": {
      "provesWhatItSetsOut": <score>,
      "worthinessOfGoal": <score>,
      "nonTrivialityLevel": <score>,
      "proofStrength": <score>,
      "functionalWritingQuality": <score>
    }
  },
  "detailedComparison": "<detailed comparison analysis>",
  "reasoning": "<explanation of why winner was chosen>"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: comparisonPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const comparisonResult = JSON.parse(response.choices[0].message.content || '{}');
    
    // Generate comprehensive comparative report
    const reportContent = await generateComparativeReport(
      comparisonResult,
      finalReconstructionA,
      finalReconstructionB,
      passageA,
      passageB,
      titleA,
      titleB
    );
    
    return {
      comparativeAnalysis: {
        ...comparisonResult,
        argumentReconstructionA: finalReconstructionA,
        argumentReconstructionB: finalReconstructionB
      },
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
  reconstruction: ArgumentReconstruction,
  passage: PassageData,
  title: string
): Promise<string> {
  const prompt = `Generate a comprehensive academic report analyzing the cogency and argumentative strength of this paper. 

**CRITICAL FORMATTING REQUIREMENTS:**
- Use markdown-style formatting with clear headers (##, ###)
- Insert double line breaks (\\n\\n) between all sections
- Structure content in distinct, readable paragraphs
- Each section should be 2-3 paragraphs minimum
- Use bullet points and numbered lists where appropriate
- Make the report substantial and detailed (1000+ words)

**Paper Title:** ${title || "Untitled Document"}
**Original Argument Reconstruction:** ${reconstruction.originalReconstruction}
**Improved Argument:** ${reconstruction.improvedArgument}
**Improvement Reasoning:** ${reconstruction.improvementReasoning}
**Analysis Results:** ${JSON.stringify(analysis, null, 2)}

**REQUIRED STRUCTURE - Follow this format exactly:**

## COMPREHENSIVE COGENCY ANALYSIS REPORT

### Executive Summary

[Write 2-3 detailed paragraphs providing overall assessment and key findings]

### Original Argument Reconstruction

[Write 2-3 paragraphs presenting the reconstructed argument clearly with specific details]

### Proposed Superior Argument

[Write 2-3 paragraphs presenting the improved version and explaining why it's superior]

### Thesis and Scope Analysis

[Write 2-3 paragraphs analyzing the paper's central thesis and scope]

### Evidence and Support Evaluation

[Write 2-3 paragraphs evaluating the quality and strength of evidence presented]

### Logical Structure Assessment

[Write 2-3 paragraphs assessing the logical flow and organization]

### Counterargument Analysis

[Write 2-3 paragraphs examining how counterarguments are addressed]

### Significance and Contribution Review

[Write 2-3 paragraphs reviewing the paper's intellectual contribution]

### Writing Quality Assessment

[Write 2-3 paragraphs assessing clarity, style, and academic sophistication]

### Dimensional Scoring Justification

[Write detailed justification for each of the 5 scores with specific reasoning]

### Overall Cogency Evaluation

[Write 3-4 paragraphs providing comprehensive final assessment]

### Recommendations for Enhancement

[Write 2-3 paragraphs suggesting specific areas for improvement]

**FORMATTING REQUIREMENTS:**
- Use ## for main title, ### for section headers
- Insert \\n\\n between every section
- Write in full paragraphs, not bullet points for main content
- Make each section substantial with detailed analysis
- Ensure proper line breaks for readability`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
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
  reconstructionA: ArgumentReconstruction,
  reconstructionB: ArgumentReconstruction,
  passageA: PassageData,
  passageB: PassageData,
  titleA: string,
  titleB: string
): Promise<string> {
  const prompt = `Generate a comprehensive comparative analysis report determining which paper makes its case better.

**CRITICAL FORMATTING REQUIREMENTS:**
- Use markdown-style formatting with clear headers (##, ###)
- Insert double line breaks (\\n\\n) between all sections
- Structure content in distinct, readable paragraphs
- Each section should be 3-4 paragraphs minimum
- Make the report substantial and detailed (1500+ words)
- Include specific quotes and examples from both papers

**Paper A:** ${titleA || "Paper A"}
**Paper A Argument:** ${reconstructionA.originalReconstruction}
**Paper A Improvement:** ${reconstructionA.improvedArgument}

**Paper B:** ${titleB || "Paper B"}  
**Paper B Argument:** ${reconstructionB.originalReconstruction}
**Paper B Improvement:** ${reconstructionB.improvedArgument}

**Comparison Results:** ${JSON.stringify(comparison, null, 2)}

**REQUIRED STRUCTURE - Follow this format exactly:**

## COMPREHENSIVE COMPARATIVE ANALYSIS REPORT

### Executive Summary with Winner Declaration

[Write 3-4 detailed paragraphs declaring the winner and providing comprehensive key findings with specific reasoning]

### Paper A: Complete Argument Reconstruction

[Write 3-4 paragraphs presenting Paper A's reconstructed argument with detailed analysis and specific examples]

### Paper B: Complete Argument Reconstruction

[Write 3-4 paragraphs presenting Paper B's reconstructed argument with detailed analysis and specific examples]

### Proposed Superior Arguments

[Write 3-4 paragraphs comparing the improved versions of both arguments and explaining the enhancements]

### Comparative Thesis Analysis

[Write 3-4 paragraphs comparing the scope, significance, and intellectual depth of both theses]

### Evidence and Support Comparison

[Write 3-4 paragraphs comparing evidence quality, logical support, and argumentation strength between papers]

### Logical Structure and Methodology Comparison

[Write 3-4 paragraphs comparing logical flow, organizational structure, and methodological approaches]

### Proof Strength and Rigor Assessment

[Write 3-4 paragraphs assessing which paper provides stronger proof with detailed justification]

### Writing Quality and Academic Sophistication

[Write 3-4 paragraphs comparing clarity, style, and academic sophistication between papers]

### Detailed Dimensional Scoring Breakdown

[Write comprehensive justification for each of the 5 scores for both papers with specific reasoning]

### Winner Justification and Reasoning

[Write 4-5 paragraphs explaining why the winner was chosen with detailed, specific reasoning]

### Individual Recommendations for Enhancement

[Write 3-4 paragraphs suggesting specific improvements for each paper separately]

**FORMATTING REQUIREMENTS:**
- Use ## for main title, ### for section headers
- Insert \\n\\n between every section
- Write in full paragraphs with detailed analysis
- Make each section substantial with comprehensive comparison
- Include specific examples and reasoning throughout`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating comparative report:', error);
    return 'Comparative report generation failed';
  }
}