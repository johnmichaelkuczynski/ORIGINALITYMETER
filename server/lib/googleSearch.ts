import axios from 'axios';

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  pagemap?: {
    cse_thumbnail?: Array<{
      src: string;
      width: string;
      height: string;
    }>;
    metatags?: Array<Record<string, string>>;
  };
}

export interface GoogleSearchResponse {
  items: SearchResult[];
  searchInformation?: {
    totalResults: string;
  };
}

/**
 * Performs a Google search using the Custom Search API
 * @param query The search query
 * @param numResults Number of results to return (max 10)
 * @returns Promise with search results
 */
export async function performGoogleSearch(query: string, numResults: number = 5): Promise<SearchResult[]> {
  try {
    if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_CSE_ID) {
      throw new Error('Google API credentials not found');
    }
    
    // Ensure numResults is within bounds (1-10)
    const limit = Math.min(Math.max(1, numResults), 10);
    
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: process.env.GOOGLE_API_KEY,
        cx: process.env.GOOGLE_CSE_ID,
        q: query,
        num: limit,
      },
    });

    if (response.status !== 200) {
      throw new Error(`Google API returned status code ${response.status}`);
    }

    const data = response.data as GoogleSearchResponse;
    return data.items || [];
  } catch (error) {
    console.error('Google search error:', error);
    throw new Error(`Failed to perform Google search: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extracts content from a web page
 * @param url The URL to fetch content from
 * @returns Promise with the extracted text content
 */
export async function fetchWebpageContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url);
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch webpage, status code: ${response.status}`);
    }
    
    // For HTML content, we would ideally use a library like cheerio to parse
    // For now, this is a basic implementation that returns the raw content
    return response.data;
  } catch (error) {
    console.error('Error fetching webpage:', error);
    throw new Error(`Failed to fetch webpage content: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generates relevant search queries based on passage content
 * @param passage The passage to analyze for search queries
 * @param provider The AI provider to use for generating queries
 * @returns Promise with an array of search queries
 */
export async function generateSearchQueries(passage: string, provider: 'openai' | 'anthropic' | 'perplexity' = 'openai'): Promise<string[]> {
  // This function will use the selected AI provider to generate search queries
  // based on the content of the passage
  // For now, returning a placeholder implementation
  
  // TODO: Implement actual query generation using the selected AI provider
  
  // Extract some keywords from the passage for basic search
  const words = passage.split(/\s+/).filter(word => word.length > 5);
  const uniqueWords = Array.from(new Set(words));
  const selectedWords = uniqueWords
    .slice(0, Math.min(uniqueWords.length, 20))
    .filter(word => !['should', 'would', 'could', 'about', 'their', 'there', 'these', 'those', 'which', 'where'].includes(word.toLowerCase()));
  
  // Create some basic search queries
  return [
    selectedWords.slice(0, 3).join(' '),
    selectedWords.slice(3, 6).join(' '),
    selectedWords.slice(6, 9).join(' ')
  ].filter(query => query.length > 0);
}