import { useState, useEffect, useRef } from 'react';
import { useTextSharing } from '@/context/TextSharingContext';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Declare MathJax type for TypeScript
declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
      startup?: {
        promise?: Promise<void>;
      };
    };
  }
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { GraduationCap, Download, FileText, Image as ImageIcon, Brain, Eye, BarChart3, FileEdit, Zap } from 'lucide-react';
import { MathPDFExporter } from './MathPDFExporter';
import DocumentUpload from './DocumentUpload';
import { VoiceDictation } from '@/components/ui/voice-dictation';
import { useToast } from '@/hooks/use-toast';
import { convertMarkdownWithMath, renderMathInElement } from '@/lib/mathUtils';



interface HomeworkHelperProps {
  onSendToAnalysis?: (text: string, title?: string) => void;
  onSendToRewriter?: (text: string, title?: string) => void;
  initialContent?: string;
}

export default function HomeworkHelper({ onSendToAnalysis, onSendToRewriter, initialContent }: HomeworkHelperProps) {
  const [assignmentText, setAssignmentText] = useState(initialContent || '');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  
  // Text sharing context
  const { consumeHomeworkHelperText, sendToHumanizer } = useTextSharing();
  
  // AI Detection state
  const [inputAnalysisData, setInputAnalysisData] = useState<any>(null);
  const [outputAnalysisData, setOutputAnalysisData] = useState<any>(null);

  // Check for incoming text from other components
  useEffect(() => {
    const incomingText = consumeHomeworkHelperText();
    if (incomingText) {
      setAssignmentText(incomingText);
      setInputMethod('type');
    }
  }, [consumeHomeworkHelperText]);

  // Auto-analyze input text
  useEffect(() => {
    if (assignmentText.trim() && assignmentText.trim().length > 10) {
      const timeoutId = setTimeout(() => {
        analyzeInputMutation.mutate(assignmentText);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [assignmentText]);

  // Update content when props change
  useEffect(() => {
    if (initialContent) {
      setAssignmentText(initialContent);
      setInputMethod('type'); // Switch to type mode when content is received
    }
  }, [initialContent]);
  
  const [solution, setSolution] = useState('');
  
  // Auto-analyze output text when solution is complete
  useEffect(() => {
    if (solution && solution.trim().length > 10) {
      const timeoutId = setTimeout(() => {
        analyzeOutputMutation.mutate(solution);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [solution]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'word' | 'pdf' | 'txt' | 'html'>('html');
  const [inputMethod, setInputMethod] = useState<'upload' | 'type'>('type');
  const [extractedText, setExtractedText] = useState('');
  const { toast } = useToast();
  
  // AI Detection mutations
  const analyzeInputMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest('POST', '/api/gpt-bypass/analyze-text', { text });
      return response.json();
    },
    onSuccess: (data) => {
      setInputAnalysisData(data);
    },
    onError: (error: any) => {
      console.error('Input analysis failed:', error);
    }
  });

  const analyzeOutputMutation = useMutation({
    mutationFn: async (text: string) => {
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
  const resultRef = useRef<HTMLDivElement>(null);

  // Re-render MathJax when solution changes
  useEffect(() => {
    if (solution && resultRef.current) {
      setTimeout(() => {
        renderMathInElement(resultRef.current);
      }, 100);
    }
  }, [solution]);

  const handleAssignmentProcessed = (content: string, filename?: string) => {
    setAssignmentText(content);
    setAssignmentTitle(filename || 'Assignment');
    setExtractedText(content); // Show extracted text
    toast({
      title: "Assignment loaded",
      description: `${filename} is ready to be solved.`,
    });
  };

  const handleSolveAssignment = async () => {
    if (!assignmentText.trim()) {
      toast({
        title: "No assignment to solve",
        description: "Please upload an assignment or type the questions first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/solve-homework', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentText,
          preserveMath: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to solve assignment: ${response.statusText}`);
      }

      const result = await response.json();
      setSolution(result.solution);
      
      toast({
        title: "Assignment completed",
        description: "Your homework has been solved with perfect mathematical notation.",
      });
    } catch (error) {
      console.error('Error solving assignment:', error);
      toast({
        title: "Failed to solve assignment",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewHTML = () => {
    if (!solution) return;
    
    const htmlContent = convertMarkdownWithMath(solution);
    const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${assignmentTitle} - Solution</title>
  <style>
    body { font-family: 'Times New Roman', serif; line-height: 1.6; margin: 40px; max-width: 800px; }
    h1 { color: #000; font-size: 24px; margin-bottom: 20px; }
    h2 { color: #000; font-size: 20px; margin: 20px 0 10px 0; }
    h3 { color: #000; font-size: 16px; margin: 16px 0 8px 0; }
    p { margin: 12px 0; }
    strong { font-weight: bold; }
    em { font-style: italic; }
  </style>
</head>
<body>
  <h1>${assignmentTitle} - Solution</h1>
  <div>${htmlContent}</div>
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    toast({
      title: "HTML preview opened",
      description: "The solution opened in a new tab",
    });
  };

  const handleDownload = async () => {
    if (!solution) {
      toast({
        title: "No solution to download",
        description: "Please complete the assignment first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/download-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: solution,
          format: downloadFormat,
          title: `${assignmentTitle} - Solution`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${assignmentTitle}-solution.${downloadFormat === 'word' ? 'docx' : downloadFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `Your solution is downloading as ${downloadFormat.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Error downloading solution:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-green-600" />
          Homework Helper
          <Badge variant="secondary" className="ml-2">
            Complete Solutions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assignment Input */}
        <div>
          <Label className="text-sm font-medium">Assignment/Questions</Label>
          <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as 'upload' | 'type')}>
            <TabsList className="grid w-full grid-cols-2 mt-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Upload Document
              </TabsTrigger>
              <TabsTrigger value="type" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Type/Screenshot
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-4">
              <DocumentUpload
                onDocumentProcessed={handleAssignmentProcessed}
                acceptImages={true}
                placeholder="Upload your assignment (PDF, Word, TXT, or screenshot with OCR)"
              />
            </TabsContent>
            <TabsContent value="type" className="mt-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Type your assignment questions here, or upload a screenshot for automatic text and math extraction..."
                  value={assignmentText}
                  onChange={(e) => setAssignmentText(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <VoiceDictation
                    onTranscriptionComplete={(text) => {
                      const updatedText = assignmentText 
                        ? assignmentText.trim() + (assignmentText.endsWith('.') ? ' ' : '. ') + text
                        : text;
                      setAssignmentText(updatedText);
                      toast({
                        title: "Voice input added",
                        description: "Your dictated assignment has been added.",
                      });
                    }}
                  />
                </div>
                <DocumentUpload
                  onDocumentProcessed={handleAssignmentProcessed}
                  acceptImages={true}
                  placeholder="Or drop a screenshot here for OCR processing"
                  className="border-dashed border-gray-200 bg-gray-50"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Extracted Text Display */}
        {extractedText && (
          <div>
            <Label className="text-sm font-medium">Extracted Text from Upload</Label>
            <Card className="mt-2 p-3 bg-blue-50 border-blue-200">
              <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {extractedText}
              </div>
            </Card>
          </div>
        )}

        <Separator />

        {/* Solve Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSolveAssignment}
            disabled={isProcessing || !assignmentText.trim()}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
          >
            {isProcessing ? (
              <>
                <Brain className="h-4 w-4 mr-2 animate-pulse" />
                Solving Assignment...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Complete Assignment
              </>
            )}
          </Button>
        </div>

        {/* Solution */}
        {solution && (
          <div className="space-y-4">
            <Separator />
            <div>
              <Label className="text-sm font-medium">Complete Solution</Label>
              <Card className="mt-2 p-4 bg-gray-50">
                <div 
                  ref={resultRef}
                  className="prose max-w-none text-sm math-container"
                  dangerouslySetInnerHTML={{ __html: convertMarkdownWithMath(solution) }}
                />
              </Card>
            </div>

            {/* Download Options */}
            <div className="flex items-center gap-2 flex-wrap">
              <MathPDFExporter 
                content={solution}
                title={`${assignmentTitle || 'Assignment'} - Solution`}
                buttonText="Save as PDF"
                variant="outline"
                icon="download"
              />
              <Button
                onClick={handleViewHTML}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View HTML
              </Button>
              <Label className="text-sm">Other formats:</Label>
              <Select value={downloadFormat} onValueChange={(value: any) => setDownloadFormat(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="word">Word</SelectItem>
                  <SelectItem value="txt">TXT</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleDownload}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              {onSendToAnalysis && (
                <Button 
                  variant="outline" 
                  onClick={() => onSendToAnalysis(solution, assignmentTitle || 'Homework Solution')}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Send to Analysis
                </Button>
              )}
              {onSendToRewriter && (
                <Button 
                  variant="outline" 
                  onClick={() => onSendToRewriter(solution, assignmentTitle || 'Homework Solution')}
                  className="flex items-center gap-2"
                >
                  <FileEdit className="h-4 w-4" />
                  Send to Rewriter
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => {
                  sendToHumanizer(solution);
                  toast({
                    title: "Sent to humanizer",
                    description: "Your homework solution is now ready for AI text humanization.",
                  });
                }}
                className="flex items-center gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Zap className="h-4 w-4" />
                Send to Humanizer
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}