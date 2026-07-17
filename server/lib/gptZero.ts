export interface GPTZeroResult {
  aiScore: number; // Percentage (0-100)
  isAI: boolean;
  confidence: number;
}

export class GPTZeroService {
  private readonly API_KEY = process.env.GPTZERO_API_KEY;
  private readonly API_URL = "https://api.gptzero.me/v2/predict/text";

  async analyzeText(text: string): Promise<GPTZeroResult> {
    if (!this.API_KEY) {
      throw new Error('GPTZero API key not configured');
    }

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': this.API_KEY,
        },
        body: JSON.stringify({
          document: text,
          multilingual: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GPTZero API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      // Log the full response for debugging
      console.log('GPTZero full response:', JSON.stringify(data, null, 2));
      
      // Parse GPTZero response based on actual API format
      const document = data.documents[0];
      console.log('Document data:', JSON.stringify(document, null, 2));
      
      // Use the appropriate probability based on classification
      let aiScore = 0;
      let isAI = false;
      
      if (document.document_classification === 'AI_ONLY') {
        // Pure AI content - use class_probabilities.ai or high value
        aiScore = Math.round((document.class_probabilities?.ai || document.completely_generated_prob || 0.95) * 100);
        isAI = true;
      } else if (document.document_classification === 'MIXED') {
        // Mixed content - use completely_generated_prob which shows AI involvement
        aiScore = Math.round((document.completely_generated_prob || 0.5) * 100);
        isAI = true; // Mixed content still has AI involvement
      } else {
        // Human content
        aiScore = Math.round((document.class_probabilities?.ai || 0) * 100);
        isAI = false;
      }
      
      const isHighConfidence = document.confidence_category === 'high';
      
      console.log('Parsed values:', {
        originalAiProb: document.class_probabilities?.ai,
        completelyGenerated: document.completely_generated_prob,
        finalAiScore: aiScore,
        classification: document.document_classification,
        confidenceCategory: document.confidence_category
      });
      
      return {
        aiScore,
        isAI,
        confidence: isHighConfidence ? 0.9 : document.confidence_category === 'medium' ? 0.7 : 0.5,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('GPTZero API error:', errorMessage);
      throw new Error(`Failed to analyze text with GPTZero: ${errorMessage}`);
    }
  }

  async analyzeBatch(texts: string[]): Promise<GPTZeroResult[]> {
    const results = await Promise.all(
      texts.map(text => this.analyzeText(text))
    );
    return results;
  }
}

export const gptZeroService = new GPTZeroService();