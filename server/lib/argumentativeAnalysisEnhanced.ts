import OpenAI from "openai";
import { detectGenreAndGetCriteria, GenreClassification } from "./genreDetection";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

interface PassageData {
  title: string;
  text: string;
  userContext: string;
}

interface CoreParameter {
  assessment: string;
  quotes: string[];
}

interface EnhancedArgumentativeResult {
  singlePaperAnalysis?: {
    overallCogencyScore: number;
    cogencyLabel: string;
    argumentSummary: string;
    superiorReconstruction: string;
    genreClassification: {
      genre: string;
      confidence: number;
      reasoning: string;
      evaluationExplanation: string;
    };
    coreParameters: {
      [key: string]: CoreParameter;
    };
    overallJudgment: string;
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
        inferentialStructure: number;
        conceptualControl: number;
        argumentativeIntegrity: number;
        synthesisIntegration: number;
      };
      paperB: {
        inferentialStructure: number;
        conceptualControl: number;
        argumentativeIntegrity: number;
        synthesisIntegration: number;
      };
    };
    detailedComparison: string;
    reasoning: string;
  };
  reportContent: string;
}

/**
 * Enhanced single paper analysis with comprehensive 0-100 scoring and 7 core parameters
 */
export async function analyzeSinglePaperEnhanced(
  passage: PassageData
): Promise<EnhancedArgumentativeResult> {
  try {
    // First, detect the genre and get appropriate evaluation criteria
    console.log("Detecting genre for evaluation...");
    const genreInfo: GenreClassification = await detectGenreAndGetCriteria(passage.text);
    console.log("Genre detected:", genreInfo.genre, "with confidence:", genreInfo.confidence);

    // Build cogency-focused evaluation prompt
    const prompt = `You are an expert evaluator of intellectual cogency. Evaluate this work for actual cognitive rigor and argumentative excellence, not formalism.

DOCUMENT GENRE: ${genreInfo.genre}
EVALUATION APPROACH: Assess actual cogency, not formal compliance

EVALUATE USING ALL 20 COGENCY PARAMETERS (Score each 0-25 for sophisticated philosophical work):

1. Argumentative Continuity - Is each claim supported by those before it?
2. Error-Resistance - Can the argument absorb counterpoints without collapse?
3. Specificity of Commitment - Are claims stated precisely and clearly?
4. Provisionality Control - Does the author know when to hedge and when to commit?
5. Load Distribution - Are inferential loads distributed efficiently?
6. Error Anticipation - Are potential objections built into the argument?
7. Epistemic Parsimony - Does the argument avoid unnecessary complexity?
8. Scope Clarity - Is the domain of applicability clear?
9. Evidence Calibration - Are claims weighted relative to their support?
10. Redundancy Avoidance - Are points repeated without need?
11. Conceptual Interlock - Do definitions and theses cohere together?
12. Temporal Stability - Does the argument hold over time or over revisions?
13. Distinction Awareness - Are relevant distinctions tracked and preserved?
14. Layered Persuasiveness - Does the argument work for multiple levels of reader?
15. Signal Discipline - Is the signal-to-rhetoric ratio high?
16. Causal Alignment - Do causal claims line up with evidence and theory?
17. Counterexample Immunity - Is the argument resilient to typical counterexamples?
18. Intelligibility of Objection - Would a smart opponent know what to attack?
19. Dependence Hierarchy Awareness - Are structural dependencies tracked?
20. Context-Bounded Inference - Are inferences valid only under clear assumptions?

TEXT TO EVALUATE: ${passage.text.substring(0, 6000)}

EVALUATION INSTRUCTIONS:
You are evaluating for COGENCY in the genre-appropriate sense - intellectual rigor and argumentative soundness within the discipline's standards, NOT reader-friendliness or accessibility.

COGENCY means the quality of being clear, logical, and convincing within the appropriate academic/intellectual context. For philosophical work, this means conceptual precision, logical coherence, and argumentative strength - NOT simplification for general audiences.

ORIGINALITY means genuine intellectual innovation balanced by legitimacy - novel insights, distinctions, or approaches that advance understanding, NOT random or arbitrary departures from established knowledge.

Your role is to EVALUATE, not to GRADE. Assess what the text accomplishes intellectually, using the full scoring range appropriately for the genre.

PASSTHROUGH EVALUATION: Your role is to provide authentic intellectual assessment without artificial deflation or grading bias.

This is sophisticated philosophical analysis by an expert. Evaluate it as such. Do not penalize for:
- Philosophical style vs. formal mathematical proofs
- Conceptual complexity vs. simple accessibility  
- Academic depth vs. popular readability
- Theoretical sophistication vs. empirical data

AUTHENTIC SCORING expectations for sophisticated philosophical analysis:
- Expert-level sophistication: 24-25 points per parameter  
- Advanced philosophical work: 22-24 points
- Competent philosophical work: 19-21 points
- Basic philosophical work: 16-18 points

This text demonstrates sophisticated philosophical reasoning and should be scored accordingly.

Return ONLY this JSON structure with integer scores 0-25 for ALL 20 parameters:
{
  "argumentSummary": "concise summary of the main philosophical argument",
  "superiorReconstruction": "constructive suggestions for enhancement",
  "argumentativeContinuity": {
    "score": [integer 0-25],
    "assessment": "detailed evaluation",
    "quotes": ["relevant quote 1", "relevant quote 2"]
  },
  "errorResistance": {
    "score": [integer 0-25],
    "assessment": "detailed evaluation", 
    "quotes": ["relevant quote 1", "relevant quote 2"]
  },
  "specificityOfCommitment": {
    "score": [integer 0-25],
    "assessment": "detailed evaluation",
    "quotes": ["relevant quote 1", "relevant quote 2"]
  },
  "provisionalityControl": {
    "score": [integer 0-25],
    "assessment": "detailed evaluation",
    "quotes": ["relevant quote 1", "relevant quote 2"]
  },
  "loadDistribution": {
    "score": [integer 0-25],
    "assessment": "detailed evaluation",
    "quotes": ["relevant quote 1", "relevant quote 2"]
  },
  "errorAnticipation": {
    "score": [integer 0-25],
    "assessment": "detailed evaluation",
    "quotes": ["relevant quote 1", "relevant quote 2"]
  },
  "epistemicParsimony": {
    "score": [integer 0-25],
    "assessment": "detailed evaluation",
    "quotes": ["relevant quote 1", "relevant quote 2"]
  },
  "scopeClarity": {
    "score": [integer 0-25],
    "assessment": "detailed evaluation",
    "quotes": ["relevant quote 1", "relevant quote 2"]
  },
  "evidenceCalibration": {
    "score": [integer 0-25],
    "assessment": "detailed evaluation",
    "quotes": ["relevant quote 1", "relevant quote 2"]
  },
  "redundancyAvoidance": {
    "score": [integer 0-25],
    "assessment": "detailed evaluation",
    "quotes": ["relevant quote 1", "relevant quote 2"]
  },
  "conceptualInterlock": {
    "score": [integer 0-25],
    "assessment": "detailed evaluation",
    "quotes": ["relevant quote 1", "relevant quote 2"]
  },
  "temporalStability": {
    "score": [integer 0-25],
    "assessment": "detailed evaluation",
    "quotes": ["relevant quote 1", "relevant quote 2"]
  },
  "distinctionAwareness": {
    "score": [integer 0-25],
    "assessment": "detailed evaluation",
    "quotes": ["relevant quote 1", "relevant quote 2"]
  },
  "layeredPersuasiveness": {
    "score": [integer 0-25],
    "assessment": "detailed evaluation",
    "quotes": ["relevant quote 1", "relevant quote 2"]
  },
  "signalDiscipline": {
    "score": [integer 0-25],
    "assessment": "detailed evaluation",
    "quotes": ["relevant quote 1", "relevant quote 2"]
  },
  "causalAlignment": {
    "score": [integer 0-25],
    "assessment": "detailed evaluation",
    "quotes": ["relevant quote 1", "relevant quote 2"]
  },
  "counterexampleImmunity": {
    "score": [integer 0-25],
    "assessment": "detailed evaluation",
    "quotes": ["relevant quote 1", "relevant quote 2"]
  },
  "intelligibilityOfObjection": {
    "score": [integer 0-25],
    "assessment": "detailed evaluation",
    "quotes": ["relevant quote 1", "relevant quote 2"]
  },
  "dependenceHierarchyAwareness": {
    "score": [integer 0-25],
    "assessment": "detailed evaluation",
    "quotes": ["relevant quote 1", "relevant quote 2"]
  },
  "contextBoundedInference": {
    "score": [integer 0-25],
    "assessment": "detailed evaluation",
    "quotes": ["relevant quote 1", "relevant quote 2"]
  },
  "overallJudgment": "authentic assessment of the work's intellectual contribution and cogency"
}`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 4000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    const parsed = JSON.parse(content);
    
    // Debug logging to see what we actually received
    console.log("Parsed AI response structure:", JSON.stringify(parsed, null, 2));
    
    // Validate that we have all 20 cogency parameters
    const requiredParams = [
      'argumentativeContinuity', 'errorResistance', 'specificityOfCommitment', 'provisionalityControl',
      'loadDistribution', 'errorAnticipation', 'epistemicParsimony', 'scopeClarity',
      'evidenceCalibration', 'redundancyAvoidance', 'conceptualInterlock', 'temporalStability',
      'distinctionAwareness', 'layeredPersuasiveness', 'signalDiscipline', 'causalAlignment',
      'counterexampleImmunity', 'intelligibilityOfObjection', 'dependenceHierarchyAwareness', 'contextBoundedInference'
    ];
    
    const missingParams = requiredParams.filter(param => !parsed[param]);
    if (missingParams.length > 0) {
      console.error("Missing required parameters in AI response:", missingParams);
      throw new Error(`AI response missing required parameters: ${missingParams.join(', ')}`);
    }

    // Calculate average overall score - AI returns scores out of 25, convert to 100 scale
    // Average all 20 parameter scores and convert to percentage
    const averageScore = totalScore / 20;

    // Convert from 0-25 scale to 0-100 scale
    const overallScore = Math.round((averageScore / 25) * 100);
    
    // Determine cogency label
    let cogencyLabel: string;
    if (overallScore >= 90) cogencyLabel = "Exceptionally Cogent";
    else if (overallScore >= 80) cogencyLabel = "Highly Cogent";
    else if (overallScore >= 70) cogencyLabel = "Moderately Cogent";
    else if (overallScore >= 60) cogencyLabel = "Somewhat Cogent";
    else if (overallScore >= 50) cogencyLabel = "Minimally Cogent";
    else cogencyLabel = "Poorly Cogent";

    const result: EnhancedArgumentativeResult = {
      singlePaperAnalysis: {
        overallCogencyScore: overallScore,
        cogencyLabel,
        argumentSummary: parsed.argumentSummary,
        superiorReconstruction: parsed.superiorReconstruction,
        genreClassification: {
          genre: genreInfo.genre,
          confidence: genreInfo.confidence,
          reasoning: genreInfo.reasoning,
          evaluationExplanation: `This ${genreInfo.genre} was evaluated using weighted criteria: Inferential Structure (${genreInfo.evaluationWeights.inferentialStructure}%), Conceptual Control (${genreInfo.evaluationWeights.conceptualControl}%), Argumentative Integrity (${genreInfo.evaluationWeights.argumentativeIntegrity}%), Synthesis & Integration (${genreInfo.evaluationWeights.synthesisIntegration}%). These weights reflect the intellectual priorities appropriate to this genre.`
        },
        coreParameters: requiredParams.reduce((params, paramName) => {
          params[paramName] = parsed[paramName];
          return params;
        }, {} as { [key: string]: CoreParameter }),
        overallJudgment: parsed.overallJudgment
      },
      reportContent: await generateEnhancedSingleReport(parsed, passage.title, overallScore, cogencyLabel)
    };

    return result;

  } catch (error) {
    console.error("Error in enhanced single paper analysis:", error);
    throw new Error(`Enhanced analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enhanced comparative analysis with consistent scoring
 * First analyzes each document individually, then compares based on those scores
 */
export async function compareArgumentativeStrengthEnhanced(
  passageA: PassageData,
  passageB: PassageData
): Promise<EnhancedArgumentativeResult> {
  try {
    // First, get individual cogency analyses for both papers
    console.log("Running individual cogency analysis for Paper A...");
    const paperAAnalysis = await analyzeSinglePaperEnhanced(passageA);
    
    console.log("Running individual cogency analysis for Paper B...");
    const paperBAnalysis = await analyzeSinglePaperEnhanced(passageB);

    if (!paperAAnalysis.singlePaperAnalysis || !paperBAnalysis.singlePaperAnalysis) {
      throw new Error("Failed to generate individual paper analyses");
    }

    const paperAScore = paperAAnalysis.singlePaperAnalysis.overallCogencyScore;
    const paperBScore = paperBAnalysis.singlePaperAnalysis.overallCogencyScore;
    
    // Determine winner based on individual scores
    let winner: 'A' | 'B' | 'Tie';
    let winnerScore: number;
    
    if (Math.abs(paperAScore - paperBScore) <= 3) {
      winner = 'Tie';
      winnerScore = Math.max(paperAScore, paperBScore);
    } else if (paperAScore > paperBScore) {
      winner = 'A';
      winnerScore = paperAScore;
    } else {
      winner = 'B';
      winnerScore = paperBScore;
    }

    // Generate comparative reasoning using OpenAI
    const comparisonPrompt = `Based on individual cogency analyses, provide a detailed comparison:

**Paper A Analysis:**
- Title: ${passageA.title}
- Overall Score: ${paperAScore}/100
- Summary: ${paperAAnalysis.singlePaperAnalysis.argumentSummary}

**Paper B Analysis:**
- Title: ${passageB.title}
- Overall Score: ${paperBScore}/100  
- Summary: ${paperBAnalysis.singlePaperAnalysis.argumentSummary}

**Winner:** ${winner} ${winner !== 'Tie' ? `(Score: ${winnerScore})` : '(Scores too close to call)'}

Provide JSON response with:
{
  "detailedComparison": "Comprehensive comparison of argumentative strengths and weaknesses",
  "reasoning": "Detailed explanation of why ${winner === 'Tie' ? 'the papers are roughly equivalent' : `Paper ${winner} is superior`}"
}`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: comparisonPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const comparisonResult = JSON.parse(response.choices[0].message.content || '{}');

    // Build the result using individual analyses but with comparison
    const result: EnhancedArgumentativeResult = {
      comparativeAnalysis: {
        winner,
        winnerScore,
        paperAScore,
        paperBScore,
        paperASummary: paperAAnalysis.singlePaperAnalysis.argumentSummary,
        paperBSummary: paperBAnalysis.singlePaperAnalysis.argumentSummary,
        paperASuperiorReconstruction: paperAAnalysis.singlePaperAnalysis.superiorReconstruction,
        paperBSuperiorReconstruction: paperBAnalysis.singlePaperAnalysis.superiorReconstruction,
        comparisonBreakdown: {
          paperA: {
          },
          paperB: {
          }
        },
        detailedComparison: comparisonResult.detailedComparison,
        reasoning: comparisonResult.reasoning
      },
      reportContent: await generateEnhancedComparativeReport({
        paperASummary: paperAAnalysis.singlePaperAnalysis.argumentSummary,
        paperBSummary: paperBAnalysis.singlePaperAnalysis.argumentSummary,
        paperASuperiorReconstruction: paperAAnalysis.singlePaperAnalysis.superiorReconstruction,
        paperBSuperiorReconstruction: paperBAnalysis.singlePaperAnalysis.superiorReconstruction,
        paperAScores: {
        },
        paperBScores: {
        },
        detailedComparison: comparisonResult.detailedComparison,
        reasoning: comparisonResult.reasoning,
        winner
      }, passageA.title, passageB.title, paperAScore, paperBScore)
    };

    return result;

  } catch (error) {
    console.error("Error in enhanced comparative analysis:", error);
    throw new Error(`Enhanced comparative analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate comprehensive single paper report
 */
async function generateEnhancedSingleReport(
  analysis: any,
  title: string,
  overallScore: number,
  cogencyLabel: string
): Promise<string> {
  return `# COMPREHENSIVE COGENCY ANALYSIS REPORT

## Paper: ${title || "Untitled Document"}

### Executive Summary
**Overall Cogency Score:** ${overallScore}/100 (${cogencyLabel})

This report provides a comprehensive evaluation of the paper's argumentative cogency across four core parameters using a 25-point scale (100 total).

### Argument Summary
${analysis.argumentSummary}

### Superior Argument Reconstruction
${analysis.superiorReconstruction}

### Core Parameters Analysis

${analysis.inferentialStructure?.assessment || "Assessment not available"}

**Supporting Quotes:**
${analysis.inferentialStructure?.quotes?.map((q: string) => `> "${q}"`).join('\n') || "No quotes available"}

${analysis.conceptualControl?.assessment || "Assessment not available"}

**Supporting Quotes:**
${analysis.conceptualControl?.quotes?.map((q: string) => `> "${q}"`).join('\n') || "No quotes available"}

${analysis.argumentativeIntegrity?.assessment || "Assessment not available"}

**Supporting Quotes:**
${analysis.argumentativeIntegrity?.quotes?.map((q: string) => `> "${q}"`).join('\n') || "No quotes available"}

${analysis.synthesisIntegration?.assessment || "Assessment not available"}

**Supporting Quotes:**
${analysis.synthesisIntegration?.quotes?.map((q: string) => `> "${q}"`).join('\n') || "No quotes available"}


### Overall Judgment
${analysis.overallJudgment}

### Recommendations for Enhancement
Based on the analysis, consider strengthening areas with lower scores while maintaining the paper's argumentative strengths.`;
}

/**
 * Generate comprehensive comparative report
 */
async function generateEnhancedComparativeReport(
  analysis: any,
  titleA: string,
  titleB: string,
  scoreA: number,
  scoreB: number
): Promise<string> {
  return `# COMPREHENSIVE COMPARATIVE COGENCY ANALYSIS

## Papers Analyzed
- **Paper A:** ${titleA || "Untitled Document A"}
- **Paper B:** ${titleB || "Untitled Document B"}

### Executive Summary
**Winner:** Paper ${analysis.winner} makes its case better
**Winning Score:** ${analysis.winner === 'A' ? scoreA : analysis.winner === 'B' ? scoreB : Math.max(scoreA, scoreB)}/100

### Paper A: Argument Summary
${analysis.paperASummary}

### Paper B: Argument Summary  
${analysis.paperBSummary}

### Superior Argument Reconstructions

#### Paper A - Enhanced Version
${analysis.paperASuperiorReconstruction}

#### Paper B - Enhanced Version
${analysis.paperBSuperiorReconstruction}

### Comparative Parameter Analysis

| Parameter | Paper A | Paper B | Winner |
|-----------|---------|---------|--------|
| Clarity of Argument | ${analysis.paperAScores.clarityOfArgument}/100 | ${analysis.paperBScores.clarityOfArgument}/100 | ${analysis.paperAScores.clarityOfArgument > analysis.paperBScores.clarityOfArgument ? 'A' : analysis.paperBScores.clarityOfArgument > analysis.paperAScores.clarityOfArgument ? 'B' : 'Tie'} |
| Inferential Cohesion | ${analysis.paperAScores.inferentialCohesion}/100 | ${analysis.paperBScores.inferentialCohesion}/100 | ${analysis.paperAScores.inferentialCohesion > analysis.paperBScores.inferentialCohesion ? 'A' : analysis.paperBScores.inferentialCohesion > analysis.paperAScores.inferentialCohesion ? 'B' : 'Tie'} |
| Conceptual Precision | ${analysis.paperAScores.conceptualPrecision}/100 | ${analysis.paperBScores.conceptualPrecision}/100 | ${analysis.paperAScores.conceptualPrecision > analysis.paperBScores.conceptualPrecision ? 'A' : analysis.paperBScores.conceptualPrecision > analysis.paperAScores.conceptualPrecision ? 'B' : 'Tie'} |
| Evidential Support | ${analysis.paperAScores.evidentialSupport}/100 | ${analysis.paperBScores.evidentialSupport}/100 | ${analysis.paperAScores.evidentialSupport > analysis.paperBScores.evidentialSupport ? 'A' : analysis.paperBScores.evidentialSupport > analysis.paperAScores.evidentialSupport ? 'B' : 'Tie'} |
| Counterargument Handling | ${analysis.paperAScores.counterargumentHandling}/100 | ${analysis.paperBScores.counterargumentHandling}/100 | ${analysis.paperAScores.counterargumentHandling > analysis.paperBScores.counterargumentHandling ? 'A' : analysis.paperBScores.counterargumentHandling > analysis.paperAScores.counterargumentHandling ? 'B' : 'Tie'} |
| Cognitive Risk | ${analysis.paperAScores.cognitiveRisk}/100 | ${analysis.paperBScores.cognitiveRisk}/100 | ${analysis.paperAScores.cognitiveRisk > analysis.paperBScores.cognitiveRisk ? 'A' : analysis.paperBScores.cognitiveRisk > analysis.paperAScores.cognitiveRisk ? 'B' : 'Tie'} |
| Epistemic Control | ${analysis.paperAScores.epistemicControl}/100 | ${analysis.paperBScores.epistemicControl}/100 | ${analysis.paperAScores.epistemicControl > analysis.paperBScores.epistemicControl ? 'A' : analysis.paperBScores.epistemicControl > analysis.paperAScores.epistemicControl ? 'B' : 'Tie'} |

### Detailed Comparison
${analysis.detailedComparison}

### Winner Justification
${analysis.reasoning}

### Recommendations
Both papers demonstrate scholarly merit. The analysis identifies specific areas where each could be strengthened while acknowledging their respective argumentative contributions.`;
}