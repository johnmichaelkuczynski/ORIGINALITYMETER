import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Download, RefreshCw, TrendingDown, Clock, FileText, Share2, GraduationCap, FileEdit, Search } from 'lucide-react';
import { TextBox } from './TextBox';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useTextSharing } from '@/context/TextSharingContext';
import type { RewriteResponse } from '@shared/schema';

interface AIScoreData {
  aiScore: number;
  isAI: boolean;
  confidence: number;
  wordCount: number;
}

interface ResultsDisplayProps {
  inputText: string;
  rewrittenText: string;
  response: RewriteResponse;
  onCopy: (text: string) => void;
  onClear?: () => void;
  onReRewrite: (customInstructions?: string, selectedPresets?: string[], provider?: string) => void;
  isReRewriting?: boolean;
  currentStyleText?: string;
  currentContentMixText?: string;
  currentSelectedPresets?: string[];
}

export function ResultsDisplay({
  inputText,
  rewrittenText,
  response,
  onCopy,
  onClear,
  onReRewrite,
  isReRewriting = false,
  currentStyleText = '',
  currentContentMixText = '',
  currentSelectedPresets = [],
}: ResultsDisplayProps) {
  const [reRewriteInstructions, setReRewriteInstructions] = useState('');
  const [reRewriteProvider, setReRewriteProvider] = useState(response.provider);
  const [outputAnalysisData, setOutputAnalysisData] = useState<AIScoreData | null>(null);
  
  // Text sharing context
  const { sendToHomeworkHelper, sendToDocumentRewriter, sendToOriginalityAnalysis } = useTextSharing();
  
  // Handle copy to clipboard
  const handleCopyHumanized = () => {
    navigator.clipboard.writeText(rewrittenText);
    onCopy(rewrittenText);
  };
  
  // Handle delete/clear humanized text
  const handleDeleteHumanized = () => {
    if (onClear) {
      onClear();
    }
  };

  // Auto-analyze output text
  const analyzeOutputMutation = useMutation({
    mutationFn: async (text: string): Promise<AIScoreData> => {
      const response = await apiRequest('POST', '/api/gpt-bypass/analyze-text', { text });
      return response.json();
    },
    onSuccess: (data) => {
      setOutputAnalysisData(data);
    },
    onError: (error: any) => {
      console.error('Output analysis failed:', error);
    }
  });

  // Auto-analyze when rewritten text is available
  useEffect(() => {
    if (rewrittenText.trim() && rewrittenText.trim().length > 10) {
      const timeoutId = setTimeout(() => {
        analyzeOutputMutation.mutate(rewrittenText);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [rewrittenText]);

  const handleDownload = () => {
    const content = `ORIGINAL TEXT:\n${inputText}\n\nREWRITTEN TEXT:\n${rewrittenText}\n\nSTATISTICS:\n- Input AI Score: ${response.inputAiScore}%\n- Output AI Score: ${response.outputAiScore}%\n- Processing Time: ${response.processingTime}ms\n- Provider: ${response.provider}\n- Input Word Count: ${response.wordCount.input}\n- Output Word Count: ${response.wordCount.output}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gpt-bypass-results.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadHumanizedOnly = () => {
    const blob = new Blob([rewrittenText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'humanized-text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReRewrite = () => {
    // Use current presets from parent if available
    const finalPresets = currentSelectedPresets && currentSelectedPresets.length > 0 ? currentSelectedPresets : undefined;
    onReRewrite(
      reRewriteInstructions || undefined,
      finalPresets,
      reRewriteProvider
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-500';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'destructive';
    if (score >= 60) return 'secondary';
    return 'default';
  };

  const improvementPercent = Math.round(((response.inputAiScore - response.outputAiScore) / response.inputAiScore) * 100);

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-green-600" />
              Humanization Results
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => onCopy(rewrittenText)}
                variant="outline"
                size="sm"
                data-testid="button-copy-results"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button
                onClick={handleDownloadHumanizedOnly}
                variant="default"
                size="sm"
                data-testid="button-download-humanized"
              >
                <Download className="h-4 w-4 mr-1" />
                Download Humanized
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                data-testid="button-download-full-results"
              >
                <FileText className="h-4 w-4 mr-1" />
                Full Report
              </Button>
              
              {/* Special Copy and Delete buttons */}
              <div className="flex gap-1 ml-2 pl-2 border-l">
                <Button
                  onClick={handleCopyHumanized}
                  variant="outline"
                  size="sm"
                  data-testid="button-copy-humanized-special"
                  className="text-xs bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Humanized
                </Button>
                <Button
                  onClick={handleDeleteHumanized}
                  variant="outline"
                  size="sm"
                  data-testid="button-delete-humanized"
                  className="text-xs bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
              
              {/* Send to other tools */}
              <div className="flex gap-1 ml-2 pl-2 border-l">
                <Button
                  onClick={() => sendToOriginalityAnalysis(rewrittenText)}
                  variant="ghost"
                  size="sm"
                  data-testid="button-send-to-analysis"
                  className="text-xs"
                >
                  <Search className="h-3 w-3 mr-1" />
                  Analysis
                </Button>
                <Button
                  onClick={() => sendToDocumentRewriter(rewrittenText)}
                  variant="ghost"
                  size="sm"
                  data-testid="button-send-to-rewriter"
                  className="text-xs"
                >
                  <FileEdit className="h-3 w-3 mr-1" />
                  Rewriter
                </Button>
                <Button
                  onClick={() => sendToHomeworkHelper(rewrittenText)}
                  variant="ghost"
                  size="sm"
                  data-testid="button-send-to-homework"
                  className="text-xs"
                >
                  <GraduationCap className="h-3 w-3 mr-1" />
                  Homework
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {response.inputAiScore}%
              </div>
              <div className="text-sm text-gray-600">Original AI Score</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(response.outputAiScore)}`}>
                {response.outputAiScore}%
              </div>
              <div className="text-sm text-gray-600">New AI Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                -{improvementPercent}%
              </div>
              <div className="text-sm text-gray-600">Improvement</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(response.processingTime / 1000)}s
              </div>
              <div className="text-sm text-gray-600">Processing Time</div>
            </div>
          </div>

          {/* Output AI Detection */}
          {outputAnalysisData && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-blue-800">Updated AI Detection (Output)</h4>
                <Badge variant={getScoreBadgeVariant(outputAnalysisData.aiScore)}>
                  {outputAnalysisData.aiScore}% AI
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs text-blue-700">
                <div>
                  <span>Status: </span>
                  <span className={outputAnalysisData.isAI ? 'text-red-600' : 'text-green-600'}>
                    {outputAnalysisData.isAI ? 'AI' : 'Human'}
                  </span>
                </div>
                <div>
                  <span>Confidence: </span>
                  <span>{Math.round(outputAnalysisData.confidence * 100)}%</span>
                </div>
                <div>
                  <span>Words: </span>
                  <span>{outputAnalysisData.wordCount}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {response.wordCount.input} → {response.wordCount.output} words
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Provider: {response.provider.charAt(0).toUpperCase() + response.provider.slice(1)}
              </div>
            </div>
            <Badge variant={getScoreBadgeVariant(outputAnalysisData?.aiScore || response.outputAiScore)}>
              {(outputAnalysisData?.aiScore || response.outputAiScore) < 20 ? 'Highly Human-like' : 
               (outputAnalysisData?.aiScore || response.outputAiScore) < 50 ? 'Human-like' : 
               (outputAnalysisData?.aiScore || response.outputAiScore) < 80 ? 'Somewhat AI-like' : 'AI-like'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Text Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Text Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="side-by-side">
            <TabsList>
              <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
              <TabsTrigger value="original">Original Only</TabsTrigger>
              <TabsTrigger value="rewritten">Rewritten Only</TabsTrigger>
            </TabsList>

            <TabsContent value="side-by-side" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <TextBox
                    value={inputText}
                    onChange={() => {}} // Read-only
                    label="Original Text"
                    readOnly
                    minHeight="300px"
                    showWordCount
                    data-testid="textbox-original-readonly"
                  />
                </div>
                <div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Humanized Text</h4>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCopyHumanized}
                          variant="outline"
                          size="sm"
                          data-testid="button-copy-humanized-top"
                          className="text-xs bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          onClick={handleDeleteHumanized}
                          variant="outline"
                          size="sm"
                          data-testid="button-delete-humanized-top"
                          className="text-xs bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      </div>
                    </div>
                    <TextBox
                      value={rewrittenText}
                      onChange={() => {}} // Read-only
                      readOnly
                      minHeight="300px"
                      showWordCount
                      data-testid="textbox-rewritten-readonly"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="original">
              <TextBox
                value={inputText}
                onChange={() => {}} // Read-only
                label="Original Text"
                readOnly
                minHeight="400px"
                showWordCount
                showCharCount
                data-testid="textbox-original-full"
              />
            </TabsContent>

            <TabsContent value="rewritten">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Humanized Text</h4>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCopyHumanized}
                      variant="outline"
                      size="sm"
                      data-testid="button-copy-humanized-full"
                      className="text-xs bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      onClick={handleDeleteHumanized}
                      variant="outline"
                      size="sm"
                      data-testid="button-delete-humanized-full"
                      className="text-xs bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>
                <TextBox
                  value={rewrittenText}
                  onChange={() => {}} // Read-only
                  readOnly
                  minHeight="400px"
                  showWordCount
                  showCharCount
                  data-testid="textbox-rewritten-full"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Re-rewrite Options */}
      <Card>
        <CardHeader>
          <CardTitle>Refine Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Additional Instructions</label>
              <TextBox
                value={reRewriteInstructions}
                onChange={setReRewriteInstructions}
                placeholder="Enter additional refinement instructions..."
                minHeight="100px"
                data-testid="textbox-rerewrite-instructions"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Change AI Provider</label>
              <Select value={reRewriteProvider} onValueChange={setReRewriteProvider}>
                <SelectTrigger data-testid="select-rerewrite-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anthropic">ZHI 1</SelectItem>
                  <SelectItem value="openai">ZHI 2</SelectItem>
                  <SelectItem value="deepseek">ZHI 3</SelectItem>
                  <SelectItem value="perplexity">ZHI 4</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-2">
                <Button
                  onClick={handleReRewrite}
                  className="w-full"
                  disabled={isReRewriting}
                  data-testid="button-rerewrite"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isReRewriting ? 'animate-spin' : ''}`} />
                  {isReRewriting ? 'Re-humanizing...' : 'Re-humanize Text'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}