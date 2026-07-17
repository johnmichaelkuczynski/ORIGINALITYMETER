import fs from 'fs';
import path from 'path';
import os from 'os';

// Check for AssemblyAI API key
const apiKey = process.env.ASSEMBLYAI_API_KEY;
console.log("AssemblyAI API Key status:", apiKey ? `Present (${apiKey.substring(0, 5)}...)` : "Missing");

// Add a verification function to test the API key
export async function verifyAssemblyAIApiKey(): Promise<boolean> {
  try {
    if (!apiKey) {
      console.error("AssemblyAI API key is not configured");
      return false;
    }

    // Make a simple API call to verify the key works
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'GET',
      headers: {
        'Authorization': apiKey
      }
    });

    if (response.ok) {
      console.log("AssemblyAI API key verified successfully");
      return true;
    } else {
      const errorBody = await response.text();
      console.error("AssemblyAI API key verification failed:", errorBody);
      return false;
    }
  } catch (error) {
    console.error("Error verifying AssemblyAI API key:", error);
    return false;
  }
}

interface TranscriptionResponse {
  id: string;
  status: string;
  text: string;
  error?: string;
}

/**
 * Transcribes audio using AssemblyAI's API with optimizations for streaming
 * @param audioBuffer - Audio file as a buffer
 * @param isStreaming - If true, use faster options for real-time streaming
 * @returns Promise containing the transcribed text
 */
export async function transcribeAudioWithAssemblyAI(audioBuffer: Buffer, isStreaming: boolean = false): Promise<string> {
  try {
    if (!apiKey) {
      throw new Error("AssemblyAI API key is not configured");
    }

    console.log(`Beginning AssemblyAI transcription${isStreaming ? ' (streaming mode)' : ''}...`);
    console.log('Audio buffer size:', audioBuffer.length, 'bytes');
    
    // Step 1: Upload the audio file to AssemblyAI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/octet-stream', // Explicitly set the content type
      },
      body: audioBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload error response:', errorText);
      throw new Error(`Failed to upload audio: ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    const audioUrl = uploadData.upload_url;
    
    console.log('Audio uploaded successfully, audio URL:', audioUrl);

    // Step 2: Start the transcription with enhanced options
    // For streaming, we use more optimized settings for faster processing
    const transcriptionOptions = {
      audio_url: audioUrl,
      language_code: 'en',
      punctuate: !isStreaming, // Only add punctuation in full mode
      format_text: !isStreaming, // Format text only in full mode
      filter_profanity: false,  // Don't filter profanity to maintain accuracy
      // Streaming mode gets faster but less accurate results
      // Note: whisper-fast model might not exist, using standard model
      auto_highlights: !isStreaming
    };

    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transcriptionOptions),
    });

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error('Transcription start error:', errorText);
      throw new Error(`Failed to start transcription: ${errorText}`);
    }

    const transcriptData = await transcriptResponse.json();
    const transcriptId = transcriptData.id;
    
    console.log('Transcription started, transcript ID:', transcriptId);

    // Step 3: Poll the transcription status until it's done
    let transcriptResult: TranscriptionResponse | null = null;
    
    // Streaming mode uses fewer polling attempts and shorter intervals for faster response
    const maxAttempts = isStreaming ? 60 : 120; // 30 seconds for streaming, 60 seconds for full
    const pollingInterval = isStreaming ? 250 : 500; // 250ms for streaming, 500ms for full
    
    for (let i = 0; i < maxAttempts; i++) {
      const pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        method: 'GET',
        headers: {
          'Authorization': apiKey,
        },
      });

      if (!pollingResponse.ok) {
        const errorText = await pollingResponse.text();
        console.error('Polling error:', errorText);
        throw new Error(`Failed to poll transcription: ${errorText}`);
      }

      const pollingData = await pollingResponse.json() as TranscriptionResponse;
      console.log(`Poll attempt ${i+1}, status: ${pollingData.status}`);
      
      if (pollingData.status === 'completed') {
        transcriptResult = pollingData;
        break;
      } else if (pollingData.status === 'error') {
        console.error('Transcription error from AssemblyAI:', pollingData.error);
        throw new Error(`Transcription error: ${pollingData.error}`);
      }

      // For streaming mode, if we're taking too long, we might want to timeout sooner
      if (isStreaming && i > 30) { // After 7.5 seconds in streaming mode
        throw new Error('Streaming transcription taking too long, aborting');
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
    }

    if (!transcriptResult) {
      throw new Error('Transcription timed out');
    }

    console.log(`AssemblyAI transcription completed successfully${isStreaming ? ' (streaming mode)' : ''}`);
    console.log('Transcription text:', transcriptResult.text);
    
    if (transcriptResult.text.trim() === '') {
      console.warn('Warning: Received empty transcription from AssemblyAI');
      return isStreaming ? "" : "No speech detected. Please try again and speak clearly.";
    }
    
    return transcriptResult.text;
  } catch (error) {
    console.error(`Error in AssemblyAI transcription${isStreaming ? ' (streaming mode)' : ''}:`, error);
    throw error;
  }
}

/**
 * Process an audio file from a multipart/form-data request
 * @param file - The file from the request
 * @param isStreaming - If true, use faster options for real-time streaming
 * @returns Promise containing the transcribed text
 */
export async function processAudioFile(file: Express.Multer.File, isStreaming: boolean = false): Promise<string> {
  try {
    // Transcribe the audio content
    const transcribedText = await transcribeAudioWithAssemblyAI(file.buffer, isStreaming);
    return transcribedText;
  } catch (error) {
    console.error(`Error processing audio file${isStreaming ? ' (streaming mode)' : ''}:`, error);
    throw error;
  }
}