import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { AnalysisResult, PassageData, StyleOption, GeneratedPassageResult } from '@/lib/types';
import { Loader2, Download, RefreshCcw, Sparkle, Wand2, Copy, Trash2, Search, Globe, Settings, FileText, RotateCcw, Plus } from 'lucide-react';
import useAIDetection from '@/hooks/use-ai-detection';
import AIDetectionBadge from '@/components/AIDetectionBadge';
import CustomRewriteSearch from '@/components/CustomRewriteSearch';
import { ChunkSelector } from '@/components/ChunkSelector';
import { printHtmlDocument, escapeHtml, toParagraphs } from "@/lib/printToPdf";

interface PassageGeneratorProps {
  analysisResult: AnalysisResult;
  passage: PassageData;
  onReanalyze: (passage: PassageData) => void;
}

export default function PassageGenerator({ analysisResult, passage, onReanalyze }: PassageGeneratorProps) {
  const [styleOption, setStyleOption] = useState<StyleOption>('prioritize-originality');
  const [activeTab, setActiveTab] = useState<string>('original');
  const [generatedResult, setGeneratedResult] = useState<GeneratedPassageResult | null>(null);
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [showCustomInstructions, setShowCustomInstructions] = useState<boolean>(false);
  const [showSearchMode, setShowSearchMode] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showChunkSelector, setShowChunkSelector] = useState<boolean>(false);
  const [showRewriteDialog, setShowRewriteDialog] = useState<boolean>(false);
  const [rewriteInstructions, setRewriteInstructions] = useState<string>('');
  const { toast } = useToast();

  // Check if document should be chunked (more than 1000 words)
  const shouldUseChunking = passage.text.split(/\s+/).filter(word => word.length > 0).length > 1000;
  
  // AI detection
  const { 
    detectAIContent,
    getDetectionResult,
    isDetecting
  } = useAIDetection();
  
  // Keep track of text IDs for AI detection
  const originalTextId = 'original-passage';
  const improvedTextId = 'improved-passage';
  
  // Detect AI content only when there are substantial changes
  useEffect(() => {
    // Only detect if passage text has reasonable length
    if (passage.text && passage.text.trim().length > 100) {
      detectAIContent(passage.text, originalTextId);
    }
  }, [passage.text, detectAIContent, originalTextId]);
  
  // Separate effect for the improved passage
  useEffect(() => {
    // Only detect if improved passage is available and has reasonable length
    if (generatedResult?.improvedPassage?.text && 
        generatedResult.improvedPassage.text.trim().length > 100) {
      detectAIContent(generatedResult.improvedPassage.text, improvedTextId);
    }
  }, [generatedResult?.improvedPassage?.text, detectAIContent, improvedTextId]);

  // Mutation for generating a more original passage
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        'POST',
        '/api/generate-original',
        {
          passage,
          analysisResult,
          styleOption,
          customInstructions: showCustomInstructions ? customInstructions.trim() : undefined
        }
      );
      const data = await response.json();
      return data as GeneratedPassageResult;
    },
    onSuccess: (data) => {
      setGeneratedResult(data);
      setActiveTab('improved');
      toast({
        title: 'New version generated',
        description: 'A more original passage has been created',
      });
    },
    onError: (error) => {
      console.error('Failed to generate passage:', error);
      toast({
        title: 'Generation failed',
        description: 'There was a problem generating a more original passage. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Rewrite mutation for iterative rewriting
  const rewriteMutation = useMutation({
    mutationFn: async (instructions: string) => {
      if (!generatedResult?.improvedPassage) throw new Error('No passage to rewrite');
      
      const response = await apiRequest(
        'POST',
        '/api/generate-original',
        {
          passage: generatedResult.improvedPassage,
          analysisResult,
          styleOption,
          customInstructions: instructions.trim()
        }
      );
      const data = await response.json();
      return data as GeneratedPassageResult;
    },
    onSuccess: (data) => {
      setGeneratedResult(data);
      setActiveTab('improved');
      setShowRewriteDialog(false);
      setRewriteInstructions('');
      toast({
        title: 'Rewrite completed',
        description: 'Your text has been rewritten with the new instructions',
      });
    },
    onError: (error) => {
      console.error('Failed to rewrite passage:', error);
      toast({
        title: 'Rewrite failed',
        description: 'There was a problem rewriting the passage. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleGenerate = () => {
    if (generateMutation.isPending) return;
    generateMutation.mutate();
  };
  
  // Handle search results from the CustomRewriteSearch component
  const handleApplySearchResults = (selectedResults: any[], searchInstructions: string) => {
    // Format the search results and instructions into custom instructions
    const formattedInstructions = `
USE THE FOLLOWING ONLINE SEARCH RESULTS IN YOUR REWRITE:

${selectedResults.map((result, index) => `
[RESULT ${index + 1}]
Title: ${result.title}
URL: ${result.link}
Description: ${result.snippet}
`).join('\n')}

CUSTOM INSTRUCTIONS FOR USING THESE SOURCES:
${searchInstructions || "Please incorporate relevant information from these sources to improve the originality and depth of the passage."}
`;

    // Set the custom instructions with the search results
    setCustomInstructions(formattedInstructions);
    
    // Make sure custom instructions are shown
    setShowCustomInstructions(true);
    
    // Close the search mode
    setShowSearchMode(false);
    
    toast({
      title: "Search results applied",
      description: `${selectedResults.length} sources have been added to your custom instructions.`,
    });
  };

  // Handler for when chunks are processed and result is generated
  const handleChunksGenerated = (result: GeneratedPassageResult) => {
    setGeneratedResult(result);
    setActiveTab('improved');
    setShowChunkSelector(false);
    toast({
      title: 'Improved version generated',
      description: 'A more original version has been created from your selected chunks',
    });
  };

  // Download improved passage as PDF
  const handleDownloadPDF = () => {
    if (!generatedResult?.improvedPassage?.text) return;
    
    try {
      const title = generatedResult.improvedPassage.title || "Improved Passage";
      const body = `
        <h1>${escapeHtml(title)}</h1>
        ${toParagraphs(generatedResult.improvedPassage.text)}
        <hr />
        <p class="muted">Generated by Originality Meter</p>
      `;
      printHtmlDocument(title, body, { withMathJax: true });

      const fileName = `improved_${title.replace(/\s+/g, '_').toLowerCase()}.pdf`;
      toast({
        title: "PDF downloaded",
        description: `Your improved passage has been saved as "${fileName}"`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Download failed",
        description: "There was a problem creating the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Download improved passage as Word document
  const handleDownloadWord = () => {
    if (!generatedResult?.improvedPassage?.text) return;
    
    try {
      const title = generatedResult.improvedPassage.title || "Improved Passage";
      const content = `${title}\n\n${generatedResult.improvedPassage.text}\n\n---\nGenerated by Originality Meter`;
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `improved_${title.replace(/\s+/g, '_').toLowerCase()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Text file downloaded",
        description: `Your improved passage has been saved as a text file`,
      });
    } catch (error) {
      console.error("Error generating text file:", error);
      toast({
        title: "Download failed",
        description: "There was a problem creating the text file. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle rewrite with custom instructions
  const handleRewrite = () => {
    if (!rewriteInstructions.trim()) {
      toast({
        title: "Instructions required",
        description: "Please enter instructions for rewriting the text",
        variant: "destructive",
      });
      return;
    }
    
    rewriteMutation.mutate(rewriteInstructions);
  };

  // Add improved passage back to input for new analysis
  const handleAddToInput = () => {
    if (!generatedResult?.improvedPassage?.text) return;
    
    const newPassage: PassageData = {
      title: generatedResult.improvedPassage.title || "Rewritten Passage",
      text: generatedResult.improvedPassage.text
    };
    
    onReanalyze(newPassage);
    toast({
      title: "Added to input",
      description: "The rewritten passage has been sent for new analysis",
    });
  };

  const handleReanalyze = () => {
    if (!generatedResult) return;
    
    // Make sure we have text to analyze
    if (!generatedResult.improvedPassage.text || generatedResult.improvedPassage.text.trim() === '') {
      toast({
        title: "Error",
        description: "Cannot analyze empty text. Please try generating a passage first.",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure the passage has a title, even if empty
    const improvedPassageWithTitle = {
      ...generatedResult.improvedPassage,
      title: generatedResult.improvedPassage.title || "Improved Passage",
      // Ensure the text is properly set
      text: generatedResult.improvedPassage.text.trim()
    };
    
    // Log what we're re-analyzing
    console.log("Re-analyzing improved passage:", {
      title: improvedPassageWithTitle.title,
      textLength: improvedPassageWithTitle.text.length
    });
    
    // First, directly call the prop callback
    onReanalyze(improvedPassageWithTitle);
    
    // Then, also dispatch a custom event as backup
    const event = new CustomEvent('analyze-improved-passage', {
      detail: {
        passage: improvedPassageWithTitle
      }
    });
    document.dispatchEvent(event);
  };

  const estimatedScore = generatedResult?.estimatedDerivativeIndex || 0;
  const improvement = estimatedScore - derivativeIndex;

  // Function to get color based on score
    if (score < 4) return 'text-red-500';
    if (score < 7) return 'text-amber-500';
    return 'text-green-500';
  };

  // Function to download the generated passage
  const downloadGeneratedPassage = () => {
    if (!generatedResult) return;
    
    const element = document.createElement('a');
    const file = new Blob(
      [generatedResult.improvedPassage.text], 
      { type: 'text/plain' }
    );
    element.href = URL.createObjectURL(file);
    element.download = `improved-${generatedResult.improvedPassage.title || 'passage'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="w-full space-y-4 mt-4">
      {showSearchMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <CustomRewriteSearch
              passageText={passage.text}
              onApplySearch={handleApplySearchResults}
              onClose={() => setShowSearchMode(false)}
            />
          </div>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkle className="h-5 w-5" />
            Passage Generator
          </CardTitle>
          <CardDescription>
            Generate a more original version of your passage based on the analysis results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Current originality metrics:</p>
            <div className="flex items-center gap-4 mb-4">
              <div>
                <span className="text-sm font-medium">Derivative Index: </span>
                <span className={`font-bold ${getScoreColor(derivativeIndex)}`}>
                  {derivativeIndex.toFixed(1)}/10
                </span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <span className="text-sm font-medium">Semantic Distance: </span>
                <span className="font-bold">
                  {analysisResult.semanticDistance.passageA.distance.toFixed(0)}/100
                </span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <span className="text-sm font-medium">Parasite Level: </span>
                <Badge variant={
                  analysisResult.conceptualParasite.passageA.level === "Low" 
                    ? "outline" 
                    : analysisResult.conceptualParasite.passageA.level === "Moderate"
                      ? "secondary"
                      : "destructive"
                }>
                  {analysisResult.conceptualParasite.passageA.level}
                </Badge>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="border rounded-lg p-4 bg-primary/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Custom Rewrite Instructions
                  </label>
                  <Badge variant="default" className="text-xs">MOST EFFECTIVE</Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowSearchMode(true)}
                  className="h-8 text-xs flex items-center gap-1"
                  disabled={generateMutation.isPending}
                >
                  <Globe className="h-3 w-3" />
                  Search Online
                </Button>
              </div>
              <Textarea
                placeholder="Describe exactly how you want the passage to be rewritten. Be specific about style, content additions, structural changes, or any modifications you want. These custom instructions are far more effective than the preset options below."
                className="resize-none"
                rows={5}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                disabled={generateMutation.isPending}
              />
              <div className="mt-3 text-xs text-muted-foreground">
                <p className="font-medium text-primary">Custom instructions completely override preset style options and produce much better results.</p>
                <p className="mt-1">Be specific about exactly what you want. Examples:</p>
                <div className="mt-2 p-3 border rounded-md bg-background/50">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>"Rewrite in the style of Malcolm Gladwell with concrete examples and storytelling"</li>
                    <li>"Add economic data and statistics while maintaining academic rigor"</li>
                    <li>"Transform into a dialogue between two experts debating the topic"</li>
                    <li>"Make it more technical with footnotes and additional scholarly context"</li>
                    <li>"Simplify for general audience and add analogies from everyday life"</li>
                    <li>"Write like David Foster Wallace with complex sentence structures and digressions"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium">Style Preference:</label>
            <Select
              value={styleOption}
              onValueChange={(value) => setStyleOption(value as StyleOption)}
              disabled={generateMutation.isPending}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a style option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keep-voice">Keep my voice</SelectItem>
                <SelectItem value="academic">Make it more formal/academic</SelectItem>
                <SelectItem value="punchy">Make it more punchy</SelectItem>
                <SelectItem value="prioritize-originality">Prioritize originality</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="mt-2 text-xs text-muted-foreground">
              {styleOption === 'keep-voice' && (
                <p>Maintains your original tone and style while adding intellectual depth and concrete examples.</p>
              )}
              {styleOption === 'academic' && (
                <p>Uses a more formal, scholarly tone with precise language suitable for academic or professional audiences.</p>
              )}
              {styleOption === 'punchy' && (
                <p>Creates a concise and impactful version that is sharp, direct, and still intellectually rigorous.</p>
              )}
              {styleOption === 'prioritize-originality' && (
                <p>Maximizes originality by adding complexity, depth, and novel perspectives while maintaining coherence.</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Show chunking interface for large documents */}
            {shouldUseChunking && (
              <div className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-950/20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-amber-800 dark:text-amber-200">Large Document Detected</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      This document has {passage.text.split(/\s+/).length.toLocaleString()} words. 
                      Use chunking for better results with large documents.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowChunkSelector(!showChunkSelector)}
                    disabled={generateMutation.isPending}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    {showChunkSelector ? 'Hide Chunk Selector' : 'Use Chunk Processing'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending}
                  >
                    <Sparkle className="mr-2 h-4 w-4" />
                    Process Entire Document
                  </Button>
                </div>
              </div>
            )}

            {/* Chunk selector */}
            {showChunkSelector && shouldUseChunking && (
              <ChunkSelector
                text={passage.text}
                title={passage.title || "Document"}
                analysisResult={analysisResult}
                onChunksGenerated={handleChunksGenerated}
              />
            )}

            {/* Regular generation button for smaller documents */}
            {!shouldUseChunking && (
              <Button 
                onClick={handleGenerate} 
                className="w-full"
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkle className="mr-2 h-4 w-4" />
                    Generate More Original Version
                  </>
                )}
              </Button>
            )}

            {generatedResult && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Generated Results</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleReanalyze}
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Re-evaluate This Version
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={downloadGeneratedPassage}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
                
                {improvement > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800">
                    <div className="font-medium mb-1">Improved Originality Score</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 text-green-800 font-medium">
                        +{improvement.toFixed(1)} points
                      </Badge>
                      <span className="text-xs">
                        From {derivativeIndex.toFixed(1)} to {estimatedScore.toFixed(1)} out of 10
                      </span>
                    </div>
                    <Progress 
                      value={estimatedScore * 10} 
                      className="h-2 mt-2" 
                    />
                  </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="original">Original</TabsTrigger>
                    <TabsTrigger value="improved">Improved</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="original" className="mt-2">
                    {/* Badge positioned above the content */}
                    <div className="flex justify-end mb-1">
                      <AIDetectionBadge 
                        result={getDetectionResult(originalTextId)} 
                        isDetecting={isDetecting} 
                        textId={originalTextId}
                        onDetect={() => detectAIContent(passage.text, originalTextId)}
                      />
                    </div>
                    <div className="border rounded-md p-4 bg-muted/30 text-sm whitespace-pre-wrap">
                      {passage.text}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="improved" className="mt-2">
                    {/* Badge and buttons positioned above the content */}
                    <div className="flex justify-between mb-3">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleDownloadPDF}
                          className="h-8"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleDownloadWord}
                          className="h-8"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Text
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <AIDetectionBadge 
                          result={getDetectionResult(improvedTextId)} 
                          isDetecting={isDetecting} 
                          textId={improvedTextId}
                          onDetect={() => generatedResult?.improvedPassage?.text && 
                            detectAIContent(generatedResult.improvedPassage.text, improvedTextId)}
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 bg-white/80 hover:bg-white text-gray-700"
                          onClick={() => {
                            if (generatedResult?.improvedPassage?.text) {
                              navigator.clipboard.writeText(generatedResult.improvedPassage.text);
                              toast({
                                title: "Copied to clipboard",
                                description: "The improved passage has been copied to your clipboard.",
                              });
                            }
                          }}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 bg-white/80 hover:bg-white text-gray-700"
                          onClick={() => {
                            if (confirm("Are you sure you want to clear the improved passage?")) {
                              setGeneratedResult(null);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4 bg-white text-sm whitespace-pre-wrap mb-4">
                      {generatedResult?.improvedPassage?.text}
                    </div>

                    {/* Iterative rewriting controls */}
                    <div className="flex flex-wrap gap-2">
                      <Dialog open={showRewriteDialog} onOpenChange={setShowRewriteDialog}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="default" 
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Rewrite the Rewrite
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Rewrite with Custom Instructions</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="rewrite-instructions">
                                Enter your custom instructions for rewriting this text:
                              </Label>
                              <Textarea
                                id="rewrite-instructions"
                                value={rewriteInstructions}
                                onChange={(e) => setRewriteInstructions(e.target.value)}
                                placeholder="Example: Make this more formal and academic, add more specific examples, simplify the language for a general audience..."
                                className="mt-2 min-h-[120px]"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowRewriteDialog(false);
                                setRewriteInstructions('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleRewrite}
                              disabled={rewriteMutation.isPending || !rewriteInstructions.trim()}
                            >
                              {rewriteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Rewrite Text
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleReanalyze}
                      >
                        <RefreshCcw className="h-4 w-4 mr-1" />
                        Evaluate Originality
                      </Button>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleAddToInput}
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add to Input
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}