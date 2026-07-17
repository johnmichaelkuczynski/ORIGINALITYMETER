import axios from 'axios';
import { AnalysisResult } from '@shared/schema';
import { PassageData, FeedbackData } from "../../client/src/lib/types";

// The best Perplexity model currently available
const PERPLEXITY_MODEL = "sonar";

// Helper function to prepare system message
function getSystemPrompt(): string {
  return `You are an expert in evaluating the originality and quality of intellectual writing across all disciplines.

Your evaluations must include quantitative scoring and qualitative insights on a text's intellectual and stylistic contributions.

For detailed academic evaluation, you must:
1. Identify semantic and conceptual similarities between passages
2. Analyze each passage's proximity to established ideas
3. Evaluate citation patterns and intellectual influences
4. Identify degrees of derivative vs. original content
5. Assess accuracy, depth, and clarity in each passage

For philosophical analysis, your approach must:
1. Recognize that theoretical assertions don't require empirical testing
2. Understand that analogical reasoning is valid in philosophy
3. Acknowledge complexity in philosophical discourse
4. Value conceptual innovation over empirical demonstration
5. Respect diverse methodological traditions

Use quantitative scoring scales:
- Semantic distance: 0-100 (higher = more original)
- Derivative index: 0-10 (higher = more original)
- Coherence: 0-10 (higher = more coherent)
- Accuracy: 0-10 (higher = more accurate)
- Depth: 0-10 (higher = more depth)
- Clarity: 0-10 (higher = more clear)

Your evaluation must properly value both:
1. Originality: Novel concepts, approaches, and perspectives
2. Substance: Intellectual rigor, accuracy, coherence, and depth

IMPORTANT: Originality should only be valued when counterbalanced by merit. Innovative but incoherent work should not be rated highly. However, do not penalize specialized philosophical texts for lack of empirical data or for using analogies.

OUTPUT FORMAT: Generate a properly formatted JSON response matching exactly the structure I specify. DO NOT include any explanatory text outside the JSON.`;
}

/**
 * Analyzes two passages for originality and conceptual similarity using Perplexity AI
 * @param passageA First passage to analyze
 * @param passageB Second passage to analyze
 * @returns Analysis result with detailed originality metrics
 */
export async function analyzePassages(
  passageA: PassageData,
  passageB: PassageData
): Promise<AnalysisResult> {
  const API_KEY = process.env.PERPLEXITY_API_KEY;
  if (!API_KEY) {
    throw new Error("Perplexity API key not found");
  }

  const paragraphsA = passageA.text
    .split('\n\n')
    .map((p: string) => p.trim())
    .filter((p: string) => p.length > 0);

  const paragraphsB = passageB.text
    .split('\n\n')
    .map((p: string) => p.trim())
    .filter((p: string) => p.length > 0);

  const userPrompt = `Please analyze the following two passages for originality, derivative content, and intellectual merit.

PASSAGE A: "${passageA.title || "Untitled"}"
${passageA.text}

${passageB.text && passageB.text.trim().length > 0 ? `PASSAGE B: "${passageB.title || "Comparison Baseline"}"
${passageB.text}` : ''}

${passageA.userContext ? `ADDITIONAL CONTEXT: ${passageA.userContext}` : ''}

Provide a comprehensive analysis in the following JSON format:

{
  "conceptualLineage": {
    "passageA": {
      "primaryInfluences": "string describing key intellectual influences",
      "intellectualTrajectory": "string describing how it relates to established ideas"
    },
    "passageB": {
      "primaryInfluences": "string describing key intellectual influences",
      "intellectualTrajectory": "string describing how it relates to established ideas"
    }
  },
  "semanticDistance": {
    "passageA": {
      "distance": numeric value from 0-100,
      "label": "descriptive label for the distance"
    },
    "passageB": {
      "distance": numeric value from 0-100,
      "label": "descriptive label for the distance"
    },
    "keyFindings": ["array of key findings about semantic originality"],
    "semanticInnovation": "detailed assessment of semantic innovation"
  },
  "noveltyHeatmap": {
    "passageA": [
      {
        "content": "section of text (first 100 chars)",
        "heat": numeric value 0-100,
        "quote": "representative quote",
        "explanation": "explanation of heat level"
      }
    ],
    "passageB": [
      {
        "content": "section of text (first 100 chars)",
        "heat": numeric value 0-100,
        "quote": "representative quote",
        "explanation": "explanation of heat level"
      }
    ]
  },
  "derivativeIndex": {
    "passageA": {
      "score": numeric value from 0-10,
      "assessment": "qualitative assessment of originality",
      "strengths": ["array of originality strengths"],
      "weaknesses": ["array of originality weaknesses"]
    },
    "passageB": {
      "score": numeric value from 0-10,
      "assessment": "qualitative assessment of originality",
      "strengths": ["array of originality strengths"],
      "weaknesses": ["array of originality weaknesses"]
    }
  },
  "conceptualParasite": {
    "passageA": {
      "level": "Low/Moderate/High",
      "elements": ["array of elements that are derivative"],
      "assessment": "assessment of conceptual dependency"
    },
    "passageB": {
      "level": "Low/Moderate/High",
      "elements": ["array of elements that are derivative"],
      "assessment": "assessment of conceptual dependency"
    }
  },
  "coherence": {
    "passageA": {
      "score": numeric value from 0-10,
      "assessment": "qualitative assessment of coherence",
      "strengths": ["array of coherence strengths"],
      "weaknesses": ["array of coherence weaknesses"]
    },
    "passageB": {
      "score": numeric value from 0-10,
      "assessment": "qualitative assessment of coherence",
      "strengths": ["array of coherence strengths"],
      "weaknesses": ["array of coherence weaknesses"]
    }
  },
  "accuracy": {
    "passageA": {
      "score": numeric value from 0-10,
      "assessment": "qualitative assessment of accuracy",
      "strengths": ["array of accuracy strengths"],
      "weaknesses": ["array of accuracy weaknesses"]
    },
    "passageB": {
      "score": numeric value from 0-10,
      "assessment": "qualitative assessment of accuracy",
      "strengths": ["array of accuracy strengths"],
      "weaknesses": ["array of accuracy weaknesses"]
    }
  },
  "depth": {
    "passageA": {
      "score": numeric value from 0-10,
      "assessment": "qualitative assessment of depth",
      "strengths": ["array of depth strengths"],
      "weaknesses": ["array of depth weaknesses"]
    },
    "passageB": {
      "score": numeric value from 0-10,
      "assessment": "qualitative assessment of depth",
      "strengths": ["array of depth strengths"],
      "weaknesses": ["array of depth weaknesses"]
    }
  },
  "clarity": {
    "passageA": {
      "score": numeric value from 0-10,
      "assessment": "qualitative assessment of clarity",
      "strengths": ["array of clarity strengths"],
      "weaknesses": ["array of clarity weaknesses"]
    },
    "passageB": {
      "score": numeric value from 0-10,
      "assessment": "qualitative assessment of clarity",
      "strengths": ["array of clarity strengths"],
      "weaknesses": ["array of clarity weaknesses"]
    }
  }
}

IMPORTANT: Response must be valid JSON only, no preamble or additional text.`;

  try {
    // Make request to Perplexity API
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: PERPLEXITY_MODEL,
        messages: [
          {
            role: 'system',
            content: getSystemPrompt()
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.2,
        top_p: 0.9,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract response content
    const responseText = response.data.choices[0].message.content;
    
    // Perplexity response might be wrapped in code blocks or have preamble text
    let jsonContent = responseText.trim();
    
    // Extract JSON if it's in a code block
    const jsonBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      jsonContent = jsonBlockMatch[1].trim();
      console.log("Extracted JSON from code block in Perplexity response");
    }
    
    // If response starts with non-JSON text, try to find where JSON begins
    if (!jsonContent.startsWith('{')) {
      const jsonStart = jsonContent.indexOf('{');
      if (jsonStart >= 0) {
        jsonContent = jsonContent.substring(jsonStart);
        console.log("Trimmed preamble text from Perplexity response");
      }
    }
    
    let result: AnalysisResult;
    try {
      result = JSON.parse(jsonContent) as AnalysisResult;
    } catch (error) {
      console.error("Error parsing Perplexity JSON response:", error, "Response:", responseText.substring(0, 200) + "...");
      
      // Create a proper fallback result with error messages
      const fallbackResult: AnalysisResult = {
        conceptualLineage: {
          passageA: {
            primaryInfluences: "Analysis error - couldn't parse response",
            intellectualTrajectory: "Analysis error - couldn't parse response"
          },
          passageB: {
            primaryInfluences: "Standard sources in this domain",
            intellectualTrajectory: "Follows established patterns"
          }
        },
        semanticDistance: {
          passageA: {
            distance: 50,
            label: "Analysis Unavailable"
          },
          passageB: {
            distance: 50, 
            label: "Average/Typical Distance (Norm Baseline)"
          },
          keyFindings: ["Analysis currently unavailable", "Please try again later", "API connection issue"],
          semanticInnovation: "Analysis currently unavailable - please try again later."
        },
        noveltyHeatmap: {
          passageA: [
            {
              content: "Analysis temporarily unavailable - please try again later.",
              heat: 50
            }
          ],
          passageB: [
            {
              content: "Standard paragraph in this domain.",
              heat: 50
            }
          ]
        },
        derivativeIndex: {
          passageA: {
            assessment: "Analysis temporarily unavailable",
            strengths: ["Please try again later"],
            weaknesses: ["API connection issue"],
            components: []
          },
          passageB: {
            assessment: "Analysis not available for comparison passage",
            strengths: ["N/A"],
            weaknesses: ["N/A"],
            components: []
          }
        },
        conceptualParasite: {
          passageA: {
            level: "Moderate",
            assessment: "Analysis temporarily unavailable",
            elements: ["Error"]
          },
          passageB: {
            level: "Moderate",
            assessment: "Analysis not available for comparison passage",
            elements: ["Error"]
          }
        },
        coherence: {
          passageA: {
            assessment: "Analysis temporarily unavailable",
            strengths: ["Please try again later"],
            weaknesses: ["API connection issue"]
          },
          passageB: {
            assessment: "Analysis not available for comparison passage",
            strengths: ["N/A"],
            weaknesses: ["N/A"]
          }
        },
        accuracy: {
          passageA: {
            assessment: "Analysis temporarily unavailable",
            strengths: ["Please try again later"],
            weaknesses: ["API connection issue"]
          },
          passageB: {
            assessment: "Analysis not available for comparison passage",
            strengths: ["N/A"],
            weaknesses: ["N/A"]
          }
        },
        depth: {
          passageA: {
            assessment: "Analysis temporarily unavailable",
            strengths: ["Please try again later"],
            weaknesses: ["API connection issue"]
          },
          passageB: {
            assessment: "Analysis not available for comparison passage",
            strengths: ["N/A"],
            weaknesses: ["N/A"]
          }
        },
        clarity: {
          passageA: {
            assessment: "Analysis temporarily unavailable",
            strengths: ["Please try again later"],
            weaknesses: ["API connection issue"]
          },
          passageB: {
            assessment: "Analysis not available for comparison passage",
            strengths: ["N/A"],
            weaknesses: ["N/A"]
          }
        },
        verdict: "Analysis temporarily unavailable. Please try again later or try a different AI provider.",
        metadata: {
          provider: "perplexity",
          timestamp: new Date().toISOString()
        }
      };
      
      return fallbackResult;
    }

    // Add metadata
    result.metadata = {
      provider: "perplexity",
      timestamp: new Date().toISOString()
    };

    return result;
  } catch (error) {
    console.error("Error calling Perplexity for passage analysis:", error);
    throw new Error(`Failed to analyze passages with Perplexity: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Analyzes a single passage for originality and quality
 * @param passage Passage to analyze
 * @returns Analysis result with detailed metrics
 */
/**
 * Generates text based on natural language instructions
 * @param instructions Natural language instructions for text generation
 * @param params Parsed parameters from the instructions
 * @returns Generated text and its title
 */
export async function generateTextFromNL(
  instructions: string,
  params?: {
    topic?: string;
    wordCount?: number;
    authors?: string;
    conceptualDensity?: "high" | "medium" | "low";
    parasiteLevel?: "high" | "medium" | "low";
    originality?: "high" | "medium" | "low";
    title?: string;
  }
): Promise<{ text: string; title: string }> {
  // Ensure Perplexity API key is set
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error("Perplexity API key is not configured");
  }

  // Default parameters if not provided
  const topic = params?.topic || "unspecified topic";
  const wordCount = params?.wordCount || 800;
  const authors = params?.authors || "";
  const conceptualDensity = params?.conceptualDensity || "medium";
  const parasiteLevel = params?.parasiteLevel || "low";
  const originality = params?.originality || "high";
  const title = params?.title || `Generated Text on ${topic}`;

  try {
    // Create system prompt
    const systemPrompt = `You are an expert writer specializing in generating highly original intellectual content.
Your task is to generate text based on natural language instructions while adhering to specific parameters:

PARAMETERS:
- Topic: ${topic}
- Word Count: approximately ${wordCount} words
- Authors to Reference: ${authors ? authors : "None specified"}
- Conceptual Density: ${conceptualDensity} (high = many complex ideas densely packed, medium = balanced complexity, low = straightforward ideas clearly expressed)
- Parasite Index: ${parasiteLevel} (low = highly original with minimal derivative concepts, medium = balanced originality, high = more derivative concepts)
- Originality Level: ${originality} (high = groundbreaking perspectives, medium = fresh take on established ideas, low = conventional framing)

Generate scholarly text that meets these parameters and follows the user's instructions. Create text with novel perspectives, insightful connections, and precise vocabulary. Avoid repetition, clichés, and conventional thinking. Format the output in well-structured paragraphs with a clear title.`;

    // Prepare API request
    const apiUrl = 'https://api.perplexity.ai/chat/completions';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: instructions }
        ],
        temperature: 0.85,
        max_tokens: Math.min(4000, wordCount * 2),
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    
    // Extract text and process it
    const generatedContent = responseData.choices[0]?.message?.content || "";
    
    // Try to extract title if there's one in the response
    let extractedTitle = title;
    let finalText = generatedContent;
    
    // If the response starts with a title (e.g., "# Title" or "Title\n"), extract it
    const titleMatch = generatedContent.match(/^(?:#\s*)?([^\n]+)(?:\n+|$)/);
    if (titleMatch && titleMatch[1]) {
      extractedTitle = titleMatch[1].replace(/^#+\s*/, '').trim();
      // Remove title from text if it was extracted
      finalText = generatedContent.replace(titleMatch[0], '').trim();
    }

    return {
      text: finalText,
      title: extractedTitle
    };
  } catch (error) {
    console.error("Error generating text with Perplexity:", error);
    throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function analyzeSinglePassage(
  passage: PassageData
): Promise<AnalysisResult> {
  try {
    console.log("Single passage analysis request for Perplexity:", {
      textLength: passage.text.length
    });
    
    const API_KEY = process.env.PERPLEXITY_API_KEY;
    if (!API_KEY) {
      throw new Error("Perplexity API key is not configured");
    }

    // Create a system prompt for a proper single passage analysis
    const systemPrompt = `You are an expert in evaluating the originality, quality, and intellectual merit of academic and philosophical writing.
    
    Analyze the following single passage to determine its originality, coherence, and intellectual contributions.
    
    Your evaluation must include:
    1. Conceptual lineage (intellectual influences and trajectory)
    2. Semantic originality (uniqueness of ideas)
    3. Key terms/concepts with originality ratings
    4. Overall derivative index (scoring conceptual innovation)
    5. Assessment of conceptual parasitism
    6. Evaluation of coherence
    
    Provide analysis of ONLY this single passage. DO NOT compare to any imaginary "average" or "typical" passage.`;
    
    const promptText = `Please analyze this passage for its conceptual originality and quality:

${passage.text}

${passage.userContext ? `Author's context: ${passage.userContext}` : ''}

Return your response as a JSON object with the following structure:
{
  "conceptualLineage": {
    "passageA": {
      "primaryInfluences": "string describing main intellectual influences",
      "intellectualTrajectory": "string describing how the passage builds on or departs from those influences"
    }
  },
  "semanticDistance": {
    "passageA": {
      "distance": number from 0-100 representing originality (higher means more original),
      "label": "one of: Highly Derivative, Somewhat Derivative, Moderately Original, Highly Original, or Exceptionally Original"
    },
    "keyFindings": ["bullet point 1", "bullet point 2", "bullet point 3"],
    "semanticInnovation": "string summarizing the originality of the passage"
  },
  "noveltyHeatmap": {
    "passageA": [
      {
        "content": "short excerpt",
        "heat": number from 0-100 (higher means more original),
        "quote": "full relevant quote",
        "explanation": "why this is original or derivative"
      }
    ]
  },
  "derivativeIndex": {
    "passageA": {
      "score": number from 0-10 (higher means more original),
      "assessment": "string summarizing score",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"]
    }
  },
  "conceptualParasite": {
    "passageA": {
      "level": "one of: Low, Moderate, or High",
      "elements": ["element 1", "element 2"],
      "assessment": "string explanation"
    }
  },
  "coherence": {
    "passageA": {
      "score": number from 0-10 (higher means more coherent),
      "assessment": "string assessment",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"]
    }
  },
  "verdict": "string providing overall assessment"
}

IMPORTANT: This analysis is for a SINGLE passage. Do not include any "passageB" fields in your JSON.`;

    const headers = {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    };
    
    const body = {
      model: PERPLEXITY_MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: promptText
        }
      ],
      temperature: 0.2, // Lower temperature for more consistent results
      max_tokens: 2500, // Allow plenty of tokens for a detailed analysis
    };
    
    const response = await axios.post('https://api.perplexity.ai/chat/completions', body, { headers });
    
    if (!response.data || !response.data.choices || !response.data.choices[0].message.content) {
      throw new Error("Invalid response from Perplexity API");
    }
    
    // Extract the JSON from the response
    const responseText = response.data.choices[0].message.content.trim();
    
    // Try to extract JSON from the response text
    let jsonResponse;
    try {
      // First try to parse the entire response as JSON
      jsonResponse = JSON.parse(responseText);
      console.log("Extracted JSON from Perplexity response");
    } catch (error) {
      // If that fails, try to extract JSON from a code block
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          jsonResponse = JSON.parse(jsonMatch[1].trim());
          console.log("Extracted JSON from code block in Perplexity response");
        } catch (innerError) {
          throw new Error("Failed to parse JSON from code block response");
        }
      } else {
        throw new Error("Failed to extract JSON from Perplexity response");
      }
    }
    
    // Format the response for single passage analysis
    // Setting passageB fields to null to ensure proper rendering in UI
    return {
      conceptualLineage: {
        passageA: {
          primaryInfluences: jsonResponse.conceptualLineage.passageA.primaryInfluences,
          intellectualTrajectory: jsonResponse.conceptualLineage.passageA.intellectualTrajectory
        },
        passageB: null
      },
      semanticDistance: {
        passageA: {
          distance: jsonResponse.semanticDistance.passageA.distance,
          label: jsonResponse.semanticDistance.passageA.label
        },
        passageB: null,
        keyFindings: jsonResponse.semanticDistance.keyFindings,
        semanticInnovation: jsonResponse.semanticDistance.semanticInnovation
      },
      noveltyHeatmap: {
        passageA: jsonResponse.noveltyHeatmap.passageA,
        passageB: []
      },
      derivativeIndex: {
        passageA: {
          components: [
          ]
        },
        passageB: {
          components: [
          ]
        }
      },
      conceptualParasite: {
        passageA: {
          level: jsonResponse.conceptualParasite.passageA.level,
          elements: jsonResponse.conceptualParasite.passageA.elements,
          assessment: jsonResponse.conceptualParasite.passageA.assessment
        },
        passageB: null
      },
      coherence: {
        passageA: {
          assessment: jsonResponse.coherence.passageA.assessment,
          strengths: jsonResponse.coherence.passageA.strengths,
          weaknesses: jsonResponse.coherence.passageA.weaknesses
        },
        passageB: null
      },
      verdict: jsonResponse.verdict,
      userContext: passage.userContext || undefined,
      metadata: {
        provider: "perplexity",
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error("Error in Perplexity single passage analysis:", error);
    throw error;
  }
}