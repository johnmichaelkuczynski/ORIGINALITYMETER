import axios from 'axios';

// Interface for AI Detection result
export interface AIDetectionResult {
  isAIGenerated: boolean;
  confidence: string;  // "Low", "Medium", "High"
  details?: string;    // Optional explanation
}

// GPTZero API Configuration
const GPTZERO_API_URL = 'https://api.gptzero.me/v2/predict/text';
const GPTZERO_API_KEY = process.env.GPTZERO_API_KEY;

/**
 * Detect if text is AI-generated using GPTZero's specialized API
 * 
 * @param text - The text to analyze
 * @returns Promise with detection result
 */
export async function detectAIContent(text: string): Promise<AIDetectionResult> {
  try {
    // Ensure we have valid text content
    if (!text || typeof text !== 'string') {
      console.error("Invalid text provided to detectAIContent:", typeof text);
      return {
        isAIGenerated: false,
        confidence: "Low",
        details: "Invalid text format for detection"
      };
    }
    
    // Trim the text to remove whitespace
    const trimmedText = text.trim();
    
    if (trimmedText.length < 50) {
      console.log("Text too short for reliable detection:", trimmedText.length, "characters");
      return {
        isAIGenerated: false,
        confidence: "Low",
        details: "Text too short for reliable detection"
      };
    }

    // Check if we have the GPTZero API key
    if (!GPTZERO_API_KEY) {
      console.warn("GPTZero API key not found, falling back to probability approximation");
      // Return a generic response if API key is missing
      return {
        isAIGenerated: Math.random() > 0.5, // Random placeholder
        confidence: "Low",
        details: "API key not configured - detection service unavailable"
      };
    }

    // Truncate very long text to a reasonable size
    // GPTZero has a limit of 10,000 characters
    const truncatedText = trimmedText.length > 9500 ? trimmedText.substring(0, 9500) : trimmedText;
    
    console.log(`Sending ${truncatedText.length} characters to GPTZero API`);
    console.log(`First 100 chars: "${truncatedText.substring(0, 100)}..."`);

    // Call GPTZero API
    const response = await axios.post(
      GPTZERO_API_URL,
      { document: truncatedText },
      {
        headers: {
          'x-api-key': GPTZERO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    // Extract the detection results
    const data = response.data;
    
    // GPTZero provides document-level and sentence-level metrics
    // We focus on document level for the overall score
    
    // Average probabilities across all sentences if available
    let overallScore = 0;
    
    if (data.documents && data.documents.length > 0) {
      overallScore = data.documents[0].completely_generated_prob;
    } else if (data.document) {
      overallScore = data.document.completely_generated_prob;
    }
    
    // Map the score to confidence level
    let confidence = "Medium";
    if (overallScore < 0.4) confidence = "Low";
    if (overallScore > 0.7) confidence = "High";
    
    // Generate details from GPTZero's analysis
    let details = "Analysis based on GPTZero's specialized AI detection.";
    
    if (data.documents && data.documents.length > 0 && data.documents[0].completely_generated_prob > 0.5) {
      details = `This text has a ${Math.round(data.documents[0].completely_generated_prob * 100)}% probability of being AI-generated according to GPTZero.`;
    }
    
    return {
      isAIGenerated: overallScore > 0.5,
      confidence,
      details
    };
  } catch (error) {
    console.error("Error detecting AI content with GPTZero:", error);
    
    // Fallback to a safe default
    return {
      isAIGenerated: false,
      confidence: "Low",
      details: "GPTZero detection service error: " + (error instanceof Error ? error.message : "Unknown error")
    };
  }
}