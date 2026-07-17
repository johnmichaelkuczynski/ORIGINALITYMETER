import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Extracts text and mathematical content from images using OpenAI's vision model
 * @param base64Image - Base64 encoded image
 * @returns Promise containing extracted text with proper mathematical notation
 */
export async function extractTextFromImage(base64Image: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert OCR system specialized in extracting text and mathematical content from images. 

CRITICAL INSTRUCTIONS:
1. Extract ALL visible text exactly as it appears, preserving formatting and structure
2. For mathematical equations, formulas, and symbols, convert them to proper LaTeX notation
3. Maintain the original document structure (paragraphs, headings, lists, etc.)
4. If you see mathematical expressions, write them in LaTeX format: $inline math$ or $$display math$$
5. For complex mathematical notation, use appropriate LaTeX commands
6. Preserve any special formatting, subscripts, superscripts, fractions, etc.
7. If text is unclear, make your best interpretation and note uncertainty with [?]
8. Output the complete extracted content as plain text with embedded LaTeX for math

Return ONLY the extracted text content, no explanations or meta-commentary.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text and mathematical content from this image. Convert any mathematical expressions to proper LaTeX notation."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_tokens: 4000,
      temperature: 0.1, // Lower temperature for more accurate OCR
    });

    const extractedText = response.choices[0].message.content || "";
    
    if (!extractedText.trim()) {
      throw new Error("No text could be extracted from the image");
    }

    return extractedText;
  } catch (error) {
    console.error("Error in OCR processing:", error);
    throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Processes an image file buffer and extracts text content
 * @param buffer - Image file buffer
 * @returns Promise containing extracted text
 */
export async function processImageFile(buffer: Buffer): Promise<string> {
  try {
    const base64Image = buffer.toString('base64');
    return await extractTextFromImage(base64Image);
  } catch (error) {
    console.error("Error processing image file:", error);
    throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}