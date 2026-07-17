import { ChangeEvent, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { VoiceDictation } from "@/components/ui/voice-dictation";

interface CorpusComparisonInputProps {
  passage: {
    title: string;
    text: string;
    userContext?: string;
  };
  corpus: {
    title: string;
    text: string;
  };
  onPassageChange: (data: { title: string; text: string; userContext?: string }) => void;
  onCorpusChange: (data: { title: string; text: string }) => void;
  disabled?: boolean;
}

export default function CorpusComparisonInput({
  passage,
  corpus,
  onPassageChange,
  onCorpusChange,
  disabled = false,
}: CorpusComparisonInputProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePassageTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onPassageChange({ ...passage, title: e.target.value });
  };

  const handlePassageTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onPassageChange({ ...passage, text: e.target.value });
  };
  
  const handleUserContextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onPassageChange({ ...passage, userContext: e.target.value });
  };

  const handleCorpusTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onCorpusChange({ ...corpus, title: e.target.value });
  };

  const handleCorpusTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onCorpusChange({ ...corpus, text: e.target.value });
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, isPassage: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 20MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    const validTypes = [
      "text/plain", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "audio/mpeg", // MP3 file MIME type
      "application/pdf", // PDF file MIME type
    ];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt, .docx, .pdf, or .mp3 file",
        variant: "destructive",
      });
      return;
    }
    
    // Special handling notice for MP3 files
    if (file.type === "audio/mpeg") {
      toast({
        title: "Processing audio file",
        description: "Your audio file will be transcribed. This may take a moment...",
        variant: "default",
      });
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      
      // Extract file extension
      const fileExtension = file.name.split('.').pop() || '';
      formData.append("fileType", fileExtension);

      setUploadProgress(30);

      // Send the file to the server
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(70);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      setUploadProgress(100);

      // Update either passage or corpus with file content based on isPassage flag
      if (isPassage) {
        onPassageChange({
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension for title
          text: data.text,
          userContext: passage.userContext // Preserve any existing user context
        });
        toast({
          title: "Upload successful",
          description: `'${file.name}' has been loaded as your passage`,
        });
      } else {
        onCorpusChange({
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension for title
          text: data.text,
        });
        toast({
          title: "Upload successful",
          description: `'${file.name}' has been loaded as your reference corpus`,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process the file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Function to clear all content
  const clearAllContent = () => {
    onPassageChange({ title: "", text: "", userContext: "" });
    onCorpusChange({ title: "", text: "" });
    toast({
      title: "All content cleared",
      description: "Passage and corpus content have been cleared.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Clear Everything Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="destructive"
          onClick={clearAllContent}
          disabled={disabled || ((!passage.title && !passage.text && !passage.userContext) && (!corpus.title && !corpus.text))}
          className="mb-2"
        >
          Clear Everything
        </Button>
      </div>
    
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Passage Input */}
        <Card className="shadow-md border border-green-100">
          <CardContent className="p-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-primary-700 mb-1 flex items-center">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-2">
                  <span className="text-green-600 font-bold text-sm">A</span>
                </div>
                Your Passage
              </h2>
              <p className="text-sm text-gray-500">
                Enter the passage you want to analyze against the reference corpus
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="passageTitle" className="font-medium">
                  Title (Optional)
                </Label>
                <div className="relative">
                  <Input
                    id="passageTitle"
                    placeholder="Enter a title for your passage"
                    value={passage.title}
                    onChange={handlePassageTitleChange}
                    disabled={disabled}
                    className="mt-1 pr-8"
                  />
                  {passage.title && !disabled && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => onPassageChange({ ...passage, title: "" })}
                      aria-label="Clear title"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M15 9l-6 6M9 9l6 6" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-b border-dashed border-gray-200 py-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-medium block">Upload Passage File</Label>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onPassageChange({ title: "", text: "", userContext: "" })}
                    disabled={disabled || (!passage.title && !passage.text && !passage.userContext)}
                  >
                    Clear Passage
                  </Button>
                </div>
                <div className="flex flex-col space-y-2">
                  <FileDropzone
                    onFileSelect={(file) => {
                      // Create a synthetic event with minimal properties needed
                      const syntheticEvent = {
                        target: { files: [file] },
                        preventDefault: () => {}
                      } as unknown as ChangeEvent<HTMLInputElement>;
                      handleFileUpload(syntheticEvent, true);
                    }}
                    accept=".txt,.docx,.mp3,.pdf" 
                    disabled={disabled}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                    maxSizeInMB={20}
                    className="bg-white"
                    showButton={true}
                    buttonText="Upload Passage File"
                  />
                  
                  {/* Voice Dictation for Passage */}
                  <div className="mt-2">
                    <VoiceDictation
                      onTranscriptionComplete={(text) => {
                        // Append the dictated text to the existing text with a space if needed
                        const updatedText = passage.text 
                          ? passage.text.trim() + (passage.text.endsWith('.') ? ' ' : '. ') + text
                          : text;
                        
                        onPassageChange({
                          ...passage,
                          text: updatedText,
                        });
                        
                        toast({
                          title: "Dictation added to passage",
                          description: "Your dictated text has been added to the passage.",
                        });
                      }}
                      disabled={disabled || isUploading}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="passageText" className="font-medium">
                  Passage Text
                </Label>
                <div className="relative">
                  <Textarea
                    id="passageText"
                    placeholder="Enter or paste your passage text here"
                    value={passage.text}
                    onChange={handlePassageTextChange}
                    disabled={disabled}
                    className="min-h-[200px] resize-y mt-1 pr-8"
                  />
                  {passage.text && !disabled && (
                    <button
                      type="button"
                      className="absolute right-2 top-6 text-gray-400 hover:text-gray-600"
                      onClick={() => onPassageChange({ ...passage, text: "" })}
                      aria-label="Clear text"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M15 9l-6 6M9 9l6 6" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <VoiceDictation
                    onTranscriptionComplete={(text) => {
                      const updatedText = passage.text 
                        ? passage.text.trim() + (passage.text.endsWith('.') ? ' ' : '. ') + text
                        : text;
                      onPassageChange({
                        ...passage,
                        text: updatedText,
                      });
                      toast({
                        title: "Voice input added to passage",
                        description: "Your dictated text has been added to the passage.",
                      });
                    }}
                    disabled={disabled || isUploading}
                  />
                </div>
              </div>

              {/* User Context */}
              <div className="mt-4 pt-4 border-t border-dashed border-blue-100">
                <Label htmlFor="userContext" className="font-medium text-blue-700">
                  Optional: Tell us anything you want about the text you're uploading
                </Label>
                <div className="relative mt-2">
                  <Textarea
                    id="userContext"
                    placeholder="Examples: 'This is a draft', 'I'm looking for feedback on the argument structure', 'This is an excerpt from a longer paper'"
                    value={passage.userContext || ""}
                    onChange={handleUserContextChange}
                    disabled={disabled}
                    className="min-h-[100px] resize-y mt-1 border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-blue-50/30"
                  />
                  {passage.userContext && !disabled && (
                    <button
                      type="button"
                      className="absolute right-2 top-6 text-gray-400 hover:text-gray-600"
                      onClick={() => onPassageChange({ ...passage, userContext: "" })}
                      aria-label="Clear context"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M15 9l-6 6M9 9l6 6" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <VoiceDictation
                    onTranscriptionComplete={(text) => {
                      const updatedContext = passage.userContext 
                        ? passage.userContext.trim() + (passage.userContext.endsWith('.') ? ' ' : '. ') + text
                        : text;
                      onPassageChange({
                        ...passage,
                        userContext: updatedContext,
                      });
                      toast({
                        title: "Voice context added",
                        description: "Your dictated context has been added.",
                      });
                    }}
                    disabled={disabled}
                  />
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  This helps our AI better evaluate your text. For example, we won't penalize drafts for style issues or excerpts for being incomplete.
                </p>
              </div>

              <div className="text-right">
                <span className="text-sm text-gray-500">
                  {passage.text.length} characters
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Corpus Input */}
        <Card className="shadow-md border border-blue-100">
          <CardContent className="p-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-blue-700 mb-1 flex items-center">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                  <span className="text-blue-600 font-bold text-sm">C</span>
                </div>
                Reference Corpus
              </h2>
              <p className="text-sm text-gray-500">
                Enter or upload a larger body of text to compare against your passage
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="corpusTitle" className="font-medium">
                  Corpus Title
                </Label>
                <div className="relative">
                  <Input
                    id="corpusTitle"
                    placeholder="E.g., 'Nietzsche's Complete Works' or 'Course Textbook'"
                    value={corpus.title}
                    onChange={handleCorpusTitleChange}
                    disabled={disabled || isUploading}
                    className="mt-1 pr-8"
                  />
                  {corpus.title && !disabled && !isUploading && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => onCorpusChange({ ...corpus, title: "" })}
                      aria-label="Clear title"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M15 9l-6 6M9 9l6 6" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-b border-dashed border-gray-200 py-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-medium block">Upload Reference Corpus</Label>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onCorpusChange({ title: "", text: "" })}
                    disabled={disabled || isUploading || (!corpus.title && !corpus.text)}
                  >
                    Clear Corpus
                  </Button>
                </div>
                <div className="flex flex-col space-y-2">
                  <FileDropzone
                    onFileSelect={(file) => {
                      // Create a synthetic event with minimal properties needed
                      const syntheticEvent = {
                        target: { files: [file] },
                        preventDefault: () => {}
                      } as unknown as ChangeEvent<HTMLInputElement>;
                      handleFileUpload(syntheticEvent, false);
                    }}
                    accept=".txt,.docx,.mp3,.pdf"
                    disabled={disabled || isUploading}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                    maxSizeInMB={20}
                    className="bg-white"
                    showButton={true}
                    buttonText="Upload Corpus File"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="corpusText" className="font-medium">
                  Corpus Text
                </Label>
                <div className="relative">
                  <Textarea
                    id="corpusText"
                    placeholder="Enter or paste your reference corpus here"
                    value={corpus.text}
                    onChange={handleCorpusTextChange}
                    disabled={disabled || isUploading}
                    className="min-h-[300px] resize-y mt-1 pr-8"
                  />
                  {corpus.text && !disabled && !isUploading && (
                    <button
                      type="button"
                      className="absolute right-2 top-6 text-gray-400 hover:text-gray-600"
                      onClick={() => onCorpusChange({ ...corpus, text: "" })}
                      aria-label="Clear text"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M15 9l-6 6M9 9l6 6" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <VoiceDictation
                    onTranscriptionComplete={(text) => {
                      const updatedText = corpus.text 
                        ? corpus.text.trim() + (corpus.text.endsWith('.') ? ' ' : '. ') + text
                        : text;
                      onCorpusChange({
                        ...corpus,
                        text: updatedText,
                      });
                      toast({
                        title: "Voice input added to corpus",
                        description: "Your dictated text has been added to the corpus.",
                      });
                    }}
                    disabled={disabled || isUploading}
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Tip: For best results, the corpus should be a larger body of work with consistent style
                </span>
                <span className="text-sm text-gray-500">
                  {corpus.text.length} characters
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}