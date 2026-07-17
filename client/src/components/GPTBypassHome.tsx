import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, Zap, RefreshCw, Download, Copy, Share2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTextSharing } from "@/context/TextSharingContext";

// Import our components and data
import { TextBox } from './gpt-bypass/TextBox';
import { StyleMixingSection } from './gpt-bypass/StyleMixingSection';
import { InstructionPresetsSection } from './gpt-bypass/InstructionPresetsSection';
import { ChatInterface } from './gpt-bypass/ChatInterface';
import { ResultsDisplay } from './gpt-bypass/ResultsDisplay';

// Import types
import type { 
  TextChunk, 
  RewriteRequest, 
  RewriteResponse, 
  ChatMessage,
  ProcessedFile 
} from '@shared/schema';

interface AIScoreData {
  aiScore: number;
  isAI: boolean;
  confidence: number;
  needsChunking: boolean;
  chunks: TextChunk[];
  wordCount: number;
}

type MixingMode = 'style' | 'content' | 'both';
type AIProvider = 'anthropic' | 'openai' | 'perplexity' | 'deepseek';

export function GPTBypassHome() {
  // Core state
  const [inputText, setInputText] = useState('');
  const [rewrittenText, setRewrittenText] = useState('');
  const [styleText, setStyleText] = useState('');
  
  // Text sharing context
  const { consumeHumanizerText } = useTextSharing();
  const [contentMixText, setContentMixText] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [selectedChunkIds, setSelectedChunkIds] = useState<string[]>([]);
  const [mixingMode, setMixingMode] = useState<MixingMode>('style');
  const [aiProvider, setAiProvider] = useState<AIProvider>('openai');
  
  // UI state
  const [activeTab, setActiveTab] = useState('input');
  const [showChunks, setShowChunks] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  
  // Data state
  const [analysisData, setAnalysisData] = useState<AIScoreData | null>(null);
  const [lastRewriteResponse, setLastRewriteResponse] = useState<RewriteResponse | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text analysis mutation - automatic, no loading state needed
  const analyzeTextMutation = useMutation({
    mutationFn: async (text: string): Promise<AIScoreData> => {
      const response = await apiRequest('POST', '/api/gpt-bypass/analyze-text', { text });
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisData(data);
      if (data.needsChunking) {
        setShowChunks(true);
      }
    },
    onError: (error: any) => {
      // Silent fail for automatic analysis
      console.error('Analysis failed:', error);
    }
  });

  // Check for incoming text from other components
  useEffect(() => {
    const incomingText = consumeHumanizerText();
    if (incomingText) {
      setInputText(incomingText);
    }
  }, [consumeHumanizerText]);

  // Auto-analyze text whenever it changes
  useEffect(() => {
    if (inputText.trim() && inputText.trim().length > 10) {
      const timeoutId = setTimeout(() => {
        analyzeTextMutation.mutate(inputText);
      }, 1000); // Debounce for 1 second
      
      return () => clearTimeout(timeoutId);
    }
  }, [inputText]);

  // File upload mutation  
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File): Promise<ProcessedFile> => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/gpt-bypass/upload-file', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setInputText(data.content);
      toast({
        title: "File Uploaded",
        description: `Successfully processed ${data.filename} (${data.wordCount} words)`
      });
      // Auto-analyze after upload
      setInputText(data.content);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed", 
        description: error.message || "Failed to upload file",
        variant: "destructive"
      });
    }
  });

  // Main rewrite mutation
  const rewriteMutation = useMutation({
    mutationFn: async (request: RewriteRequest): Promise<RewriteResponse> => {
      const response = await apiRequest('POST', '/api/gpt-bypass/rewrite', request);
      return response.json();
    },
    onSuccess: (data) => {
      setRewrittenText(data.rewrittenText);
      setLastRewriteResponse(data);
      setActiveTab('results');
      toast({
        title: "Rewrite Complete",
        description: `AI score reduced from ${data.inputAiScore}% to ${data.outputAiScore}%`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Rewrite Failed",
        description: error.message || "Failed to rewrite text", 
        variant: "destructive"
      });
    }
  });

  // Re-rewrite mutation
  const reRewriteMutation = useMutation({
    mutationFn: async (params: {
      jobId: string;
      customInstructions?: string;
      selectedPresets?: string[];
      provider?: AIProvider;
    }): Promise<RewriteResponse> => {
      const { jobId, ...body } = params;
      const response = await apiRequest('POST', `/api/gpt-bypass/re-rewrite/${jobId}`, body);
      return response.json();
    },
    onSuccess: (data) => {
      setRewrittenText(data.rewrittenText);
      setLastRewriteResponse(data);
      toast({
        title: "Re-rewrite Complete",
        description: `New AI score: ${data.outputAiScore}%`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Re-rewrite Failed",
        description: error.message || "Failed to re-rewrite text",
        variant: "destructive"
      });
    }
  });

  // Event handlers
  // Remove manual analysis - it's now automatic

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const allowedTypes = ['.txt', '.pdf', '.doc', '.docx'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExt)) {
      toast({
        title: "Invalid File",
        description: "Please upload a TXT, PDF, DOC, or DOCX file",
        variant: "destructive"
      });
      return;
    }

    uploadFileMutation.mutate(file);
  }, [uploadFileMutation, toast]);

  const handleRewrite = useCallback(() => {
    if (!inputText.trim()) {
      toast({
        title: "No Text",
        description: "Please enter text to rewrite",
        variant: "destructive"
      });
      return;
    }

    setIsRewriting(true);
    const rewriteRequest: RewriteRequest = {
      inputText,
      styleText: styleText || undefined,
      contentMixText: contentMixText || undefined,
      customInstructions: customInstructions || undefined,
      selectedPresets: selectedPresets.length > 0 ? selectedPresets : undefined,
      provider: aiProvider,
      selectedChunkIds: selectedChunkIds.length > 0 ? selectedChunkIds : undefined,
      mixingMode,
    };

    rewriteMutation.mutate(rewriteRequest, {
      onSettled: () => setIsRewriting(false)
    });
  }, [inputText, styleText, contentMixText, customInstructions, selectedPresets, aiProvider, selectedChunkIds, mixingMode, rewriteMutation, toast]);

  const handleReRewrite = useCallback((customInstructions?: string, selectedPresets?: string[], provider?: AIProvider) => {
    if (!lastRewriteResponse?.jobId) {
      toast({
        title: "No Previous Job",
        description: "No previous rewrite job found",
        variant: "destructive"
      });
      return;
    }

    console.log("🔴 RE-HUMANIZE CLICKED - Current state:");
    console.log("  styleText length:", styleText?.length || 0);
    console.log("  styleText preview:", styleText?.substring(0, 80) || "NONE");
    console.log("  contentMixText length:", contentMixText?.length || 0);
    console.log("  selectedPresets:", selectedPresets || "NONE from button");
    console.log("  currentInstructions:", customInstructions || "NONE");

    // Create a new rewrite request with CURRENT state values
    const rewriteRequest: RewriteRequest = {
      inputText,
      styleText: styleText || undefined,
      contentMixText: contentMixText || undefined,
      customInstructions: customInstructions || undefined,
      selectedPresets: selectedPresets || undefined,
      provider: provider || aiProvider,
      selectedChunkIds: selectedChunkIds.length > 0 ? selectedChunkIds : undefined,
      mixingMode,
    };

    console.log("🔴 SENDING REWRITE REQUEST:", JSON.stringify({
      hasStyleText: !!rewriteRequest.styleText,
      hasContentMix: !!rewriteRequest.contentMixText,
      hasPresets: !!rewriteRequest.selectedPresets,
      provider: rewriteRequest.provider
    }));

    // Use the main rewrite mutation instead of re-rewrite
    setIsRewriting(true);
    rewriteMutation.mutate(rewriteRequest, {
      onSettled: () => setIsRewriting(false)
    });
  }, [inputText, styleText, contentMixText, selectedChunkIds, mixingMode, aiProvider, lastRewriteResponse, rewriteMutation, toast]);

  const handleCopyText = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard"
    });
  }, [toast]);

  const handleClearResults = useCallback(() => {
    setRewrittenText('');
    setLastRewriteResponse(null);
    toast({
      title: "Cleared!",
      description: "Results have been cleared"
    });
  }, [toast]);

  const getAIScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-600';
  };

  const getAIScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'destructive';
    if (score >= 60) return 'secondary';
    return 'default';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Zap className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">AI Text Humanization</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Transform AI-generated content into natural, human-like text while maintaining quality and meaning.
          Choose from multiple AI providers and advanced styling options.
        </p>
      </div>

      {/* Main Interface - Single Column Layout */}
      <div className="space-y-6">

        {/* Text Input Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Text Input</CardTitle>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadFileMutation.isPending}
                variant="outline"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload File
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TextBox
              value={inputText}
              onChange={setInputText}
              placeholder="Enter your text here or upload a file... (AI detection will happen automatically)"
              minHeight="300px"
              showWordCount
              showCharCount
            />
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* AI Detection - Always visible when there's text */}
            {inputText.trim().length > 10 && (
              <div className="mt-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-blue-900">AI Detection (Automatic)</h4>
                  {analyzeTextMutation.isPending ? (
                    <Badge variant="secondary" className="animate-pulse">
                      Analyzing...
                    </Badge>
                  ) : analysisData ? (
                    <Badge 
                      variant={getAIScoreBadgeVariant(analysisData.aiScore)}
                      className="text-lg px-3 py-1"
                    >
                      {analysisData.aiScore}% AI
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      Waiting...
                    </Badge>
                  )}
                </div>
                {analysisData && (
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-700 font-medium">Status: </span>
                      <span className={analysisData.isAI ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                        {analysisData.isAI ? 'AI' : 'Human'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">Confidence: </span>
                      <span className="font-semibold">{Math.round(analysisData.confidence * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">Words: </span>
                      <span className="font-semibold">{analysisData.wordCount}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Prominent Humanize Button */}
            {inputText.trim() && (
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={handleRewrite}
                  disabled={isRewriting || !inputText.trim()}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isRewriting ? (
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-5 w-5 mr-2" />
                  )}
                  {isRewriting ? 'Humanizing...' : 'Humanize This Text'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compact Settings Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Very Compact AI Provider */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">AI Provider</label>
            <div className="grid grid-cols-2 gap-0.5">
              {(['anthropic', 'openai', 'deepseek', 'perplexity'] as AIProvider[]).map((provider) => (
                <Button
                  key={provider}
                  onClick={() => setAiProvider(provider)}
                  variant={aiProvider === provider ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-6 px-1"
                >
                  {provider === 'anthropic' && 'ZHI 1'}
                  {provider === 'openai' && 'ZHI 2'}
                  {provider === 'deepseek' && 'ZHI 3'}
                  {provider === 'perplexity' && 'ZHI 4'}
                </Button>
              ))}
            </div>
          </div>

          {/* Style Mixing Mode */}
          <div className="space-y-1 lg:col-span-3">
            <label className="text-xs font-medium text-gray-600">Style Mixing Mode</label>
            <div className="flex gap-1">
              <Button
                variant={mixingMode === 'style' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMixingMode('style')}
                className="text-xs h-6 px-2"
              >
                Style Only
              </Button>
              <Button
                variant={mixingMode === 'content' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMixingMode('content')}
                className="text-xs h-6 px-2"
              >
                Content Only
              </Button>
              <Button
                variant={mixingMode === 'both' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMixingMode('both')}
                className="text-xs h-6 px-2"
              >
                Both
              </Button>
            </div>
          </div>
        </div>

        {/* Style Mixing Section */}
        <StyleMixingSection
          styleText={styleText}
          setStyleText={setStyleText}
          contentMixText={contentMixText}
          setContentMixText={setContentMixText}
          mixingMode={mixingMode}
          setMixingMode={setMixingMode}
        />

        {/* Instruction Presets */}
        <InstructionPresetsSection
          selectedPresets={selectedPresets}
          setSelectedPresets={setSelectedPresets}
          customInstructions={customInstructions}
          setCustomInstructions={setCustomInstructions}
        />

        {/* Results Display */}
        {lastRewriteResponse && (
          <ResultsDisplay
            inputText={inputText}
            rewrittenText={rewrittenText}
            response={lastRewriteResponse}
            onCopy={handleCopyText}
            onClear={handleClearResults}
            onReRewrite={handleReRewrite}
            isReRewriting={reRewriteMutation.isPending}
            currentStyleText={styleText}
            currentContentMixText={contentMixText}
            currentSelectedPresets={selectedPresets}
          />
        )}

      </div>

      {/* Action Bar */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {analysisData && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Current AI Score:</span>
                  <Badge variant={getAIScoreBadgeVariant(analysisData.aiScore)}>
                    {analysisData.aiScore}%
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRewrite}
                disabled={isRewriting || !inputText.trim()}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isRewriting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Rewriting...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Humanize Text
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GPTBypassHome;