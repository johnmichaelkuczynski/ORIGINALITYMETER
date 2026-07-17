import { useState, useEffect, useRef } from "react";
import { PassageData } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { VoiceDictation } from "@/components/ui/voice-dictation";
import useAIDetection from "@/hooks/use-ai-detection";
import AIDetectionBadge from "@/components/AIDetectionBadge";

interface PassageInputProps {
  passage: PassageData;
  onChange: (data: PassageData) => void;
  label: string;
  disabled?: boolean;
  showUserContext?: boolean;
}

export default function PassageInput({
  passage,
  onChange,
  label,
  disabled = false,
  showUserContext = false,
}: PassageInputProps) {
  const [wordCount, setWordCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // AI detection
  const { 
    detectAIContent, 
    getDetectionResult, 
    isDetecting 
  } = useAIDetection();
  
  // Generate unique ID for this passage
  const passageId = `passage-${label || 'main'}`;

  // Use a ref to track the last text we analyzed
  const lastAnalyzedText = useRef<string>('');
  
  useEffect(() => {
    const text = passage.text.trim();
    const count = text.length > 0 ? text.split(/\s+/).length : 0;
    setWordCount(count);
    
    // Only detect AI content if:
    // 1. There's sufficient text (more than 100 characters)
    // 2. The text has changed significantly (first 100 chars different)
    if (text.length > 100 && text.substring(0, 100) !== lastAnalyzedText.current.substring(0, 100)) {
      lastAnalyzedText.current = text;
      detectAIContent(text, passageId);
    }
  }, [passage.text, passageId, detectAIContent]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...passage,
      text: e.target.value,
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...passage,
      title: e.target.value,
    });
  };
  
  const handleUserContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...passage,
      userContext: e.target.value,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 20MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (fileType !== 'txt' && fileType !== 'docx' && fileType !== 'pdf' && fileType !== 'mp3') {
      toast({
        title: "Unsupported file format",
        description: "Please upload a .txt, .docx, .pdf, or .mp3 file",
        variant: "destructive",
      });
      return;
    }
    
    // Create form data to send to the server
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Show loading toast
      toast({
        title: "Processing file",
        description: `Please wait while we process your ${fileType.toUpperCase()} file...`,
      });

      // Send file to server for processing
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      // Check if response is valid JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned an invalid response format");
      }

      // Parse the JSON response
      const data = await response.json();
      
      // Check for errors
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process file');
      }
        
      // Update with processed file content
      onChange({
        ...passage,
        title: data.title || file.name.split('.')[0], // Use filename as title
        text: data.text,
      });

      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been processed and loaded.`,
        variant: "default",
      });
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Error processing file",
        description: error instanceof Error ? error.message : "Failed to process the file. Please try again.",
        variant: "destructive",
      });
    }
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="w-full relative">
            <input
              type="text"
              placeholder={label ? `Passage ${label} Title (Optional)` : "Passage Title (Optional)"}
              className="w-full border-0 p-0 focus:ring-0 bg-transparent text-secondary-800 font-medium placeholder-gray-400 pr-8"
              value={passage.title}
              onChange={handleTitleChange}
              disabled={disabled}
            />
            {passage.title && !disabled && (
              <button
                type="button"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => onChange({ ...passage, title: "" })}
                aria-label="Clear title"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              </button>
            )}
          </div>
          <div className="ml-2 text-secondary-500 text-sm">
            <span>{wordCount}</span> words
          </div>
        </div>
      </div>
      <CardContent className="p-4 pt-8 flex-grow relative">
        {/* AI Detection Badge - Positioned above the text area */}
        <div className="absolute top-1 right-2 z-10">
          <AIDetectionBadge
            result={getDetectionResult(passageId)}
            isDetecting={isDetecting}
            textId={passageId}
            onDetect={() => {
              const text = passage.text.trim();
              if (text.length > 50) {
                detectAIContent(text, passageId);
              }
            }}
          />
        </div>
          
        <div className="relative">
          <textarea
            rows={12}
            placeholder={label ? `Paste or type the ${label === "A" ? "first" : "second"} passage here...` : "Paste or type your passage here..."}
            className="w-full p-0 border-0 focus:ring-0 resize-none bg-transparent text-secondary-800"
            value={passage.text}
            onChange={handleTextChange}
            disabled={disabled}
          />
          {passage.text && !disabled && (
            <button
              type="button"
              className="absolute top-4 right-4 bg-white bg-opacity-75 rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              onClick={() => onChange({ ...passage, text: "" })}
              aria-label="Clear text"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </button>
          )}
        </div>
      </CardContent>
      
      {/* Optional User Context Input */}
      {showUserContext && (
        <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-blue-800">
              Optional: Tell us anything you want about the text you're uploading
            </label>
            <div className="relative">
              <textarea
                rows={3}
                placeholder="Examples: 'This is a draft', 'I'm looking for feedback on the argument structure', 'This is an excerpt from a longer paper'"
                className="w-full p-2 border border-blue-200 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-secondary-800 text-sm"
                value={passage.userContext || ""}
                onChange={handleUserContextChange}
                disabled={disabled}
              />
              {passage.userContext && !disabled && (
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-white bg-opacity-75 rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  onClick={() => onChange({ ...passage, userContext: "" })}
                  aria-label="Clear context"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M15 9l-6 6M9 9l6 6" />
                  </svg>
                </button>
              )}
            </div>
            <p className="text-xs text-blue-700">
              This helps our AI better evaluate your text. For example, we won't penalize drafts for style issues or excerpts for being incomplete.
            </p>
          </div>
        </div>
      )}
      
      {/* File Upload and Dictation Controls */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-wrap gap-2">
            <FileDropzone
              onFileSelect={(file) => {
                // Create a synthetic event that has the minimal properties needed
                const syntheticEvent = {
                  target: { files: [file] },
                  preventDefault: () => {}
                } as unknown as React.ChangeEvent<HTMLInputElement>;
                handleFileUpload(syntheticEvent);
              }}
              accept=".txt,.docx,.mp3,.pdf"
              disabled={disabled}
              maxSizeInMB={20}
              className="bg-white"
              showFileInput={false}
              showButton={true}
              buttonText="Upload File"
            />
            
            {/* Voice Dictation Component */}
            <VoiceDictation
              onTranscriptionComplete={(text) => {
                // Append the dictated text to the existing text with a space if needed
                const updatedText = passage.text 
                  ? passage.text.trim() + (passage.text.endsWith('.') ? ' ' : '. ') + text
                  : text;
                
                onChange({
                  ...passage,
                  text: updatedText,
                });
                
                toast({
                  title: "Dictation added",
                  description: "Your dictated text has been added to the passage.",
                });
              }}
              disabled={disabled}
            />
          </div>
          
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onChange({ ...passage, title: "", text: "", userContext: "" })}
            disabled={disabled || (!passage.title && !passage.text && !passage.userContext)}
            className="ml-2"
          >
            Clear All
          </Button>
        </div>
        
        {/* Keep the hidden input for backward compatibility */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".txt,.docx,.mp3,.pdf"
          onChange={handleFileUpload}
          className="hidden"
          disabled={disabled}
        />
      </div>
    </Card>
  );
}
