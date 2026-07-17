// Test script for Perplexity API
import fetch from 'node-fetch';

async function testPerplexityAPI() {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!apiKey) {
      console.error("PERPLEXITY_API_KEY environment variable is not set");
      process.exit(1);
    }
    
    console.log("Testing Perplexity API with a simple query...");
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant."
          },
          {
            role: "user",
            content: "What is the capital of France?"
          }
        ],
        temperature: 0.2,
        max_tokens: 100
      })
    });
    
    const statusCode = response.status;
    console.log(`Response status code: ${statusCode}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
      process.exit(1);
    }
    
    const responseData = await response.json();
    console.log("API response successful!");
    console.log(JSON.stringify(responseData, null, 2));
    
    console.log("\nPerplexity API is working correctly!");
  } catch (error) {
    console.error("Error testing Perplexity API:", error);
    process.exit(1);
  }
}

testPerplexityAPI();