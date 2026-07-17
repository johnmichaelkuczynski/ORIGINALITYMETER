import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from '@/lib/queryClient';
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload, Loader2, FileText, Trash2, Zap, FileEdit, GraduationCap, X, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTextSharing } from "@/context/TextSharingContext";
import { VoiceDictation } from "@/components/ui/voice-dictation";

interface PassageData {
  title: string;
  text: string;
  userContext?: string;
}

interface AnalysisResult {
  [key: string]: {
    question: string;
    score: number;
    quotation: string;
    explanation: string;
  };
}

interface ComparisonResult {
  documentA: AnalysisResult;
  documentB: AnalysisResult;
  comparison: string;
}

export default function OriginalityMeter() {
  const { toast } = useToast();
  
  // Text sharing context
  const { consumeOriginalityAnalysisText, sendToHumanizer, sendToHomeworkHelper, sendToDocumentRewriter } = useTextSharing();
  
  // AI Detection state
  const [inputAnalysisData, setInputAnalysisData] = useState<any>(null);
  
  // File upload refs
  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);
  
  // UI State
  const [mode, setMode] = useState<'intelligence' | 'originality' | 'cogency' | 'overall_quality'>('originality');
  const [analysisMode, setAnalysisMode] = useState<'quick' | 'comprehensive'>('quick');
  const [provider, setProvider] = useState<'anthropic' | 'deepseek' | 'openai' | 'perplexity' | 'xai'>('anthropic');
  const [analysisType, setAnalysisType] = useState<'single' | 'compare'>('single');
  
  // Form Data
  const [passageA, setPassageA] = useState<PassageData>({
    title: '',
    text: '',
    userContext: ''
  });
  
  // Check for incoming text from other components
  useEffect(() => {
    const incomingText = consumeOriginalityAnalysisText();
    if (incomingText) {
      setPassageA(prev => ({ ...prev, text: incomingText }));
    }
  }, [consumeOriginalityAnalysisText]);
  
  // AI Detection mutation
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
  
  // Auto-analyze input text
  useEffect(() => {
    if (passageA.text.trim() && passageA.text.trim().length > 10) {
      const timeoutId = setTimeout(() => {
        analyzeInputMutation.mutate(passageA.text);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [passageA.text]);
  
  const [passageB, setPassageB] = useState<PassageData>({
    title: '',
    text: '',
    userContext: ''
  });
  
  // Chunk selection state
  const [chunksA, setChunksA] = useState<string[]>([]);
  const [chunksB, setChunksB] = useState<string[]>([]);
  const [selectedChunksA, setSelectedChunksA] = useState<number[]>([]);
  const [selectedChunksB, setSelectedChunksB] = useState<number[]>([]);
  const [showChunkSelectorA, setShowChunkSelectorA] = useState(false);
  const [showChunkSelectorB, setShowChunkSelectorB] = useState(false);

  // Results
  const [singleResult, setSingleResult] = useState<AnalysisResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  // Analysis streaming modal state
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [modalText, setModalText] = useState('');
  const [modalStatus, setModalStatus] = useState('');
  const [modalDone, setModalDone] = useState(false);
  const [modalError, setModalError] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the analysis modal as text streams in
  useEffect(() => {
    if (modalScrollRef.current) {
      modalScrollRef.current.scrollTop = modalScrollRef.current.scrollHeight;
    }
  }, [modalText]);

  // Single Document Analysis
  const singleAnalysisMutation = useMutation({
    mutationFn: async ({ passage, mode, analysisMode }: {
      passage: PassageData;
      mode: string;
      analysisMode: string;
    }) => {
      const response = await fetch(`/api/analyze/single/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage, analysisMode })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setSingleResult(data);
      setComparisonResult(null);
      toast({
        title: "Analysis Complete",
        description: "Your document has been analyzed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Two Document Comparison
  const comparisonAnalysisMutation = useMutation({
    mutationFn: async ({ passageA, passageB, mode, analysisMode }: {
      passageA: PassageData;
      passageB: PassageData;
      mode: string;
      analysisMode: string;
    }) => {
      const response = await fetch(`/api/analyze/compare/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passageA, passageB, analysisMode })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setComparisonResult(data);
      setSingleResult(null);
      toast({
        title: "Comparison Complete",
        description: "Your documents have been compared successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Comparison Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Download Report
  const downloadMutation = useMutation({
    mutationFn: async ({ analysisResult, mode, title }: {
      analysisResult: any;
      mode: string;
      title: string;
    }) => {
      const response = await fetch(`/api/download/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisResult, passageTitle: title })
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mode}-analysis-${title.replace(/[^a-zA-Z0-9]/g, '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Download Started",
        description: "Your analysis report is downloading.",
      });
    },
    onError: (error) => {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // File Upload Mutation
  const fileUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/process-document', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'File upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data, file) => {
      toast({
        title: "File Processed",
        description: `${file.name} has been processed successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "File Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Function to split text into chunks
  const splitIntoChunks = (text: string, maxWords = 1000): string[] => {
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return [text];
    
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += maxWords) {
      const chunk = words.slice(i, i + maxWords).join(' ');
      chunks.push(chunk);
    }
    return chunks;
  };

  // Handle file upload for passage A
  const handleFileUploadA = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a TXT, PDF, or DOCX file.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const result = await fileUploadMutation.mutateAsync(file);
      setPassageA(prev => ({
        ...prev,
        text: result.content,
        title: result.filename || prev.title
      }));
      
      // Check if chunking is needed and set up chunk selector
      const wordCount = result.content.split(/\s+/).filter(Boolean).length;
      if (wordCount > 1000) {
        const chunks = splitIntoChunks(result.content);
        setChunksA(chunks);
        setSelectedChunksA(Array.from({length: chunks.length}, (_, i) => i)); // Select all by default
        setShowChunkSelectorA(true);
      } else {
        setChunksA([]);
        setSelectedChunksA([]);
        setShowChunkSelectorA(false);
      }
    } catch (error) {
      // Error handling is done in mutation
    }
    
    // Reset file input
    if (fileInputARef.current) {
      fileInputARef.current.value = '';
    }
  };

  // Handle file upload for passage B
  const handleFileUploadB = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a TXT, PDF, or DOCX file.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const result = await fileUploadMutation.mutateAsync(file);
      setPassageB(prev => ({
        ...prev,
        text: result.content,
        title: result.filename || prev.title
      }));
      
      // Check if chunking is needed and set up chunk selector
      const wordCount = result.content.split(/\s+/).filter(Boolean).length;
      if (wordCount > 1000) {
        const chunks = splitIntoChunks(result.content);
        setChunksB(chunks);
        setSelectedChunksB(Array.from({length: chunks.length}, (_, i) => i)); // Select all by default
        setShowChunkSelectorB(true);
      } else {
        setChunksB([]);
        setSelectedChunksB([]);
        setShowChunkSelectorB(false);
      }
    } catch (error) {
      // Error handling is done in mutation
    }
    
    // Reset file input
    if (fileInputBRef.current) {
      fileInputBRef.current.value = '';
    }
  };

  // Handle text change for passage A (detect chunking need)
  const handlePassageATextChange = (text: string) => {
    setPassageA(prev => ({ ...prev, text }));
    
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (wordCount > 1000) {
      const chunks = splitIntoChunks(text);
      setChunksA(chunks);
      if (selectedChunksA.length === 0) {
        setSelectedChunksA(Array.from({length: chunks.length}, (_, i) => i)); // Select all by default
      }
      setShowChunkSelectorA(true);
    } else {
      setChunksA([]);
      setSelectedChunksA([]);
      setShowChunkSelectorA(false);
    }
  };

  // Handle text change for passage B (detect chunking need)
  const handlePassageBTextChange = (text: string) => {
    setPassageB(prev => ({ ...prev, text }));
    
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (wordCount > 1000) {
      const chunks = splitIntoChunks(text);
      setChunksB(chunks);
      if (selectedChunksB.length === 0) {
        setSelectedChunksB(Array.from({length: chunks.length}, (_, i) => i)); // Select all by default
      }
      setShowChunkSelectorB(true);
    } else {
      setChunksB([]);
      setSelectedChunksB([]);
      setShowChunkSelectorB(false);
    }
  };

  // Clear functions
  const handleClearDocumentA = () => {
    setPassageA({ title: '', text: '', userContext: '' });
    setChunksA([]);
    setSelectedChunksA([]);
    setShowChunkSelectorA(false);
    setSingleResult(null);
    setComparisonResult(null);
    toast({
      title: "Document Cleared",
      description: "Document A has been cleared successfully.",
    });
  };

  const handleClearDocumentB = () => {
    setPassageB({ title: '', text: '', userContext: '' });
    setChunksB([]);
    setSelectedChunksB([]);
    setShowChunkSelectorB(false);
    setComparisonResult(null);
    toast({
      title: "Document Cleared",
      description: "Document B has been cleared successfully.",
    });
  };

  const handleSingleAnalysis = async () => {
    if (!passageA.text.trim()) {
      toast({
        title: "Error",
        description: "Please enter text to analyze.",
        variant: "destructive",
      });
      return;
    }

    // If document needs chunking and chunks are selected, use only selected chunks
    let textToAnalyze = passageA.text;
    if (showChunkSelectorA && selectedChunksA.length > 0 && selectedChunksA.length < chunksA.length) {
      textToAnalyze = selectedChunksA.map(index => chunksA[index]).join('\n\n');
    }

    // Open the streaming modal
    setModalText('');
    setModalStatus('Starting analysis…');
    setModalDone(false);
    setModalError(false);
    setShowAnalysisModal(true);
    setIsAnalyzing(true);

    try {
      const response = await fetch(`/api/analyze/single/${mode}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage: { ...passageA, text: textToAnalyze }, analysisMode }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Stream request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let event: any;
          try {
            event = JSON.parse(line.slice(6));
          } catch {
            // skip malformed SSE lines
            continue;
          }
          if (event.type === 'status') {
            setModalStatus(event.message);
          } else if (event.type === 'chunk') {
            setModalText(prev => prev + event.text);
          } else if (event.type === 'done') {
            setSingleResult(event.result);
            setComparisonResult(null);
            setModalStatus('Analysis complete');
            setModalDone(true);
          } else if (event.type === 'error') {
            // Throw outside the JSON-parse try/catch so it reaches the outer handler
            throw new Error(event.message ?? 'Analysis failed');
          }
        }
      }
    } catch (err: any) {
      setModalStatus('Analysis failed');
      setModalError(true);
      setModalDone(true);
      toast({
        title: "Analysis Failed",
        description: err?.message ?? 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleComparisonAnalysis = () => {
    if (!passageA.text.trim() || !passageB.text.trim()) {
      toast({
        title: "Error",
        description: "Please enter text in both passages to compare.",
        variant: "destructive",
      });
      return;
    }

    // If documents need chunking and chunks are selected, use only selected chunks
    let textToAnalyzeA = passageA.text;
    let textToAnalyzeB = passageB.text;
    
    if (showChunkSelectorA && selectedChunksA.length > 0 && selectedChunksA.length < chunksA.length) {
      textToAnalyzeA = selectedChunksA.map(index => chunksA[index]).join('\n\n');
    }
    
    if (showChunkSelectorB && selectedChunksB.length > 0 && selectedChunksB.length < chunksB.length) {
      textToAnalyzeB = selectedChunksB.map(index => chunksB[index]).join('\n\n');
    }

    comparisonAnalysisMutation.mutate({
      passageA: { ...passageA, text: textToAnalyzeA },
      passageB: { ...passageB, text: textToAnalyzeB },
      mode,
      analysisMode
    });
  };

  const handleDownload = () => {
    const result = analysisType === 'single' ? singleResult : comparisonResult;
    const title = analysisType === 'single' ? 
      (passageA.title || 'Untitled') : 
      `${passageA.title || 'Document-A'}-vs-${passageB.title || 'Document-B'}`;
    
    if (!result) {
      toast({
        title: "Error",
        description: "No analysis results to download.",
        variant: "destructive",
      });
      return;
    }

    downloadMutation.mutate({
      analysisResult: result,
      mode,
      title
    });
  };

  const renderSingleResults = () => {
    if (!singleResult) return null;

    const questions = Object.keys(singleResult);
    
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {mode.charAt(0).toUpperCase() + mode.slice(1)} Analysis Results
            <Button
              onClick={handleDownload}
              disabled={downloadMutation.isPending}
              size="sm"
              variant="outline"
              data-testid="button-download-single"
            >
              {downloadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download Report
            </Button>
          </CardTitle>
          <CardDescription>
            Analysis of {passageA.title || 'Untitled Document'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {questions.map((questionKey) => {
              const result = singleResult[questionKey];
              if (!result) return null;
              
              return (
                <div key={questionKey} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" data-testid={`badge-question-${questionKey}`}>
                      Question {questionKey}
                    </Badge>
                    <Badge 
                      variant={result.score >= 95 ? "default" : result.score >= 80 ? "secondary" : "destructive"}
                      data-testid={`badge-score-${questionKey}`}
                    >
                      {result.score}/100
                    </Badge>
                  </div>
                  <h4 className="font-semibold mb-2" data-testid={`text-question-${questionKey}`}>
                    {result.question}
                  </h4>
                  <blockquote className="italic text-muted-foreground mb-2 pl-4 border-l-2" data-testid={`text-quotation-${questionKey}`}>
                    "{result.quotation}"
                  </blockquote>
                  <p className="text-sm" data-testid={`text-explanation-${questionKey}`}>
                    {result.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFormattedComparison = (text: string) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentParagraph: string[] = [];
    let key = 0;
    
    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const content = currentParagraph.join(' ').trim();
        if (content) {
          elements.push(
            <p key={key++} className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {content}
            </p>
          );
        }
        currentParagraph = [];
      }
    };
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('## ')) {
        flushParagraph();
        elements.push(
          <h2 key={key++} className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            {trimmedLine.replace('## ', '')}
          </h2>
        );
      } else if (trimmedLine.startsWith('### ')) {
        flushParagraph();
        elements.push(
          <h3 key={key++} className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">
            {trimmedLine.replace('### ', '')}
          </h3>
        );
      } else if (trimmedLine.startsWith('#### ')) {
        flushParagraph();
        elements.push(
          <h4 key={key++} className="text-md font-medium text-gray-700 dark:text-gray-300 mt-3 mb-1">
            {trimmedLine.replace('#### ', '')}
          </h4>
        );
      } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        flushParagraph();
        elements.push(
          <p key={key++} className="font-bold text-gray-900 dark:text-white mt-3 mb-1">
            {trimmedLine.replace(/\*\*/g, '')}
          </p>
        );
      } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
        flushParagraph();
        elements.push(
          <div key={key++} className="flex items-start gap-2 ml-4 my-1">
            <span className="text-blue-500 mt-1">•</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">{trimmedLine.replace(/^[-•]\s*/, '')}</span>
          </div>
        );
      } else if (/^(Document [AB]|Overall|Winner|Score|Total):/i.test(trimmedLine)) {
        flushParagraph();
        const [label, ...rest] = trimmedLine.split(':');
        const value = rest.join(':').trim();
        elements.push(
          <div key={key++} className="flex items-center gap-2 my-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <span className="font-semibold text-gray-700 dark:text-gray-300">{label}:</span>
            <span className="text-gray-900 dark:text-white">{value}</span>
          </div>
        );
      } else if (/^\d+\/100|\d+\s*points?/i.test(trimmedLine)) {
        flushParagraph();
        const scoreMatch = trimmedLine.match(/(\d+)/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
        elements.push(
          <Badge 
            key={key++} 
            variant={score >= 95 ? "default" : score >= 80 ? "secondary" : "destructive"}
            className="my-2"
          >
            {trimmedLine}
          </Badge>
        );
      } else if (trimmedLine.startsWith('>') || trimmedLine.startsWith('"')) {
        flushParagraph();
        elements.push(
          <blockquote key={key++} className="italic text-muted-foreground my-3 pl-4 border-l-4 border-blue-300 dark:border-blue-700 py-2 bg-gray-50 dark:bg-gray-800 rounded-r">
            {trimmedLine.replace(/^[>"]\s*/, '').replace(/"$/, '')}
          </blockquote>
        );
      } else if (trimmedLine === '') {
        flushParagraph();
      } else {
        currentParagraph.push(trimmedLine);
      }
    }
    
    flushParagraph();
    
    return elements;
  };

  const renderComparisonResults = () => {
    if (!comparisonResult) return null;
    
    return (
      <div className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Comparison Results
              <Button
                onClick={handleDownload}
                disabled={downloadMutation.isPending}
                size="sm"
                variant="outline"
                data-testid="button-download-comparison"
              >
                {downloadMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download Report
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="comparison" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
                <TabsTrigger value="documentA">Document A</TabsTrigger>
                <TabsTrigger value="documentB">Document B</TabsTrigger>
              </TabsList>
              
              <TabsContent value="comparison" className="mt-4">
                <div className="space-y-6" data-testid="text-comparison-report">
                  {renderFormattedComparison(comparisonResult.comparison)}
                </div>
              </TabsContent>
              
              <TabsContent value="documentA" className="mt-4">
                <div className="space-y-4">
                  {Object.keys(comparisonResult.documentA).map((questionKey) => {
                    const result = comparisonResult.documentA[questionKey];
                    if (!result) return null;
                    
                    return (
                      <div key={`a-${questionKey}`} className="border-l-4 border-green-500 pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Question {questionKey}</Badge>
                          <Badge variant={result.score >= 95 ? "default" : result.score >= 80 ? "secondary" : "destructive"}>
                            {result.score}/100
                          </Badge>
                        </div>
                        <h4 className="font-semibold mb-2">{result.question}</h4>
                        <blockquote className="italic text-muted-foreground mb-2 pl-4 border-l-2">
                          "{result.quotation}"
                        </blockquote>
                        <p className="text-sm">{result.explanation}</p>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
              
              <TabsContent value="documentB" className="mt-4">
                <div className="space-y-4">
                  {Object.keys(comparisonResult.documentB).map((questionKey) => {
                    const result = comparisonResult.documentB[questionKey];
                    if (!result) return null;
                    
                    return (
                      <div key={`b-${questionKey}`} className="border-l-4 border-orange-500 pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Question {questionKey}</Badge>
                          <Badge variant={result.score >= 95 ? "default" : result.score >= 80 ? "secondary" : "destructive"}>
                            {result.score}/100
                          </Badge>
                        </div>
                        <h4 className="font-semibold mb-2">{result.question}</h4>
                        <blockquote className="italic text-muted-foreground mb-2 pl-4 border-l-2">
                          "{result.quotation}"
                        </blockquote>
                        <p className="text-sm">{result.explanation}</p>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <>
    {/* ── Analysis Streaming Modal ── */}
    {showAnalysisModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => { if (modalDone) setShowAnalysisModal(false); }}
        />
        {/* Panel */}
        <div className="relative z-10 flex flex-col w-[88vw] max-w-5xl h-[82vh] bg-gray-950 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-3 border-b border-gray-800 ${
            modalError ? 'bg-red-950/60' : modalDone ? 'bg-green-950/60' : 'bg-gray-900'
          }`}>
            <div className="flex items-center gap-3">
              {modalError ? (
                <AlertCircle className="h-5 w-5 text-red-400" />
              ) : modalDone ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                </span>
              )}
              <span className={`text-sm font-semibold tracking-wide ${
                modalError ? 'text-red-300' : modalDone ? 'text-green-300' : 'text-blue-300'
              }`}>
                {modalStatus}
              </span>
            </div>
            <button
              onClick={() => setShowAnalysisModal(false)}
              disabled={!modalDone}
              className={`p-1.5 rounded-lg transition-colors ${
                modalDone
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700 cursor-pointer'
                  : 'text-gray-700 cursor-not-allowed'
              }`}
              title={modalDone ? 'Close' : 'Analyzing — please wait…'}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body — streaming text */}
          <div
            ref={modalScrollRef}
            className="flex-1 overflow-y-auto px-6 py-5 font-mono text-sm text-gray-200 leading-relaxed whitespace-pre-wrap"
            style={{ wordBreak: 'break-word' }}
          >
            {modalText ? (
              <>
                {modalText}
                {!modalDone && (
                  <span className="inline-block w-2 h-4 bg-blue-400 ml-0.5 animate-pulse align-text-bottom" />
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <p className="text-sm">{modalStatus}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-800 bg-gray-900">
            <span className="text-xs text-gray-600">
              {modalDone ? 'Full structured results are shown below on the page.' : 'Results will appear on the page when analysis finishes.'}
            </span>
            <div className="flex gap-2">
              {modalDone && modalText && (
                <button
                  onClick={() => { navigator.clipboard.writeText(modalText); }}
                  className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
                >
                  Copy text
                </button>
              )}
              <button
                onClick={() => setShowAnalysisModal(false)}
                disabled={!modalDone}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  modalDone
                    ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                }`}
              >
                {modalDone ? 'Done' : 'Analyzing…'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Originality Meter</h1>
        <p className="text-xl text-muted-foreground">
          Evaluate intellectual writing across four dimensions with advanced AI analysis
        </p>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Configuration</CardTitle>
          <CardDescription>
            Choose your evaluation parameters and analysis settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Evaluation Mode</label>
              <Select value={mode} onValueChange={(value: any) => setMode(value)}>
                <SelectTrigger data-testid="select-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="originality">Originality</SelectItem>
                  <SelectItem value="intelligence">Intelligence</SelectItem>
                  <SelectItem value="cogency">Cogency</SelectItem>
                  <SelectItem value="overall_quality">Overall Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Analysis Mode</label>
              <Select value={analysisMode} onValueChange={(value: any) => setAnalysisMode(value)}>
                <SelectTrigger data-testid="select-analysis-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">Quick (~30 seconds)</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive (4-phase)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Provider</label>
              <Select value={provider} onValueChange={(value: any) => setProvider(value)}>
                <SelectTrigger data-testid="select-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anthropic">ZHI 1</SelectItem>
                  <SelectItem value="openai">ZHI 2</SelectItem>
                  <SelectItem value="deepseek">ZHI 3</SelectItem>
                  <SelectItem value="perplexity">ZHI 4</SelectItem>
                  <SelectItem value="xai">ZHI 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Analysis Type</label>
              <Select value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
                <SelectTrigger data-testid="select-analysis-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Document</SelectItem>
                  <SelectItem value="compare">Compare Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document A / Single Document */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {analysisType === 'single' ? 'Document' : 'Document A'}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearDocumentA}
                disabled={!passageA.text && !passageA.title}
                data-testid="button-clear-a"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title (Optional)</label>
              <Input
                placeholder="Enter document title..."
                value={passageA.title}
                onChange={(e) => setPassageA({ ...passageA, title: e.target.value })}
                data-testid="input-title-a"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Text Content</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".txt,.pdf,.docx"
                    onChange={handleFileUploadA}
                    ref={fileInputARef}
                    className="hidden"
                    data-testid="file-input-a"
                  />
                  <VoiceDictation
                    onTranscriptionComplete={(t) =>
                      handlePassageATextChange((passageA.text ? passageA.text.trimEnd() + " " : "") + t)
                    }
                    className="border border-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputARef.current?.click()}
                    disabled={fileUploadMutation.isPending}
                    data-testid="button-upload-a"
                  >
                    {fileUploadMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <FileText className="h-4 w-4 mr-1" />
                    )}
                    Upload File
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="Paste or type your text here, or upload a document (TXT, PDF, DOCX)..."
                value={passageA.text}
                onChange={(e) => handlePassageATextChange(e.target.value)}
                rows={12}
                data-testid="textarea-content-a"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Word count: {passageA.text.split(/\s+/).filter(Boolean).length}
                  {passageA.text.split(/\s+/).filter(Boolean).length > 1000 && 
                    " (Will be processed in chunks)"
                  }
                </p>
                
                {/* Send to other tools buttons */}
                {passageA.text.trim() && (
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        sendToHumanizer(passageA.text);
                        toast({
                          title: "Sent to humanizer",
                          description: "Your text is now ready for AI humanization.",
                        });
                      }}
                      className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                      data-testid="button-send-to-humanizer"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Humanizer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        sendToDocumentRewriter(passageA.text);
                        toast({
                          title: "Sent to rewriter",
                          description: "Your text is now ready for document rewriting.",
                        });
                      }}
                      className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                      data-testid="button-send-to-rewriter"
                    >
                      <FileEdit className="h-3 w-3 mr-1" />
                      Rewriter
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        sendToHomeworkHelper(passageA.text);
                        toast({
                          title: "Sent to homework helper",
                          description: "Your text is now ready for homework solving.",
                        });
                      }}
                      className="text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                      data-testid="button-send-to-homework"
                    >
                      <GraduationCap className="h-3 w-3 mr-1" />
                      Homework
                    </Button>
                  </div>
                )}
              </div>
              
              {/* AI Detection for Input */}
              {inputAnalysisData && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">AI Detection (Automatic)</h4>
                    <Badge variant={inputAnalysisData.aiScore >= 80 ? 'destructive' : inputAnalysisData.aiScore >= 60 ? 'secondary' : 'default'}>
                      {inputAnalysisData.aiScore}% AI
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-gray-600">Status: </span>
                      <span className={inputAnalysisData.isAI ? 'text-red-600' : 'text-green-600'}>
                        {inputAnalysisData.isAI ? 'AI' : 'Human'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Confidence: </span>
                      <span>{Math.round(inputAnalysisData.confidence * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Words: </span>
                      <span>{inputAnalysisData.wordCount}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chunk Selector for Document A */}
            {showChunkSelectorA && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Select Chunks to Analyze</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedChunksA(Array.from({length: chunksA.length}, (_, i) => i))}
                      data-testid="button-select-all-a"
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedChunksA([])}
                      data-testid="button-select-none-a"
                    >
                      Select None
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded p-3">
                  {chunksA.map((chunk, index) => {
                    const wordCount = chunk.split(/\s+/).filter(Boolean).length;
                    const preview = chunk.substring(0, 100) + (chunk.length > 100 ? '...' : '');
                    const isSelected = selectedChunksA.includes(index);
                    
                    return (
                      <div key={index} className="flex items-start gap-3 p-2 border rounded">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedChunksA([...selectedChunksA, index]);
                            } else {
                              setSelectedChunksA(selectedChunksA.filter(i => i !== index));
                            }
                          }}
                          className="mt-1"
                          data-testid={`checkbox-chunk-a-${index}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">Chunk {index + 1}</span>
                            <span className="text-xs text-muted-foreground">({wordCount} words)</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{preview}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedChunksA.length} of {chunksA.length} chunks selected
                  {selectedChunksA.length > 0 && selectedChunksA.length < chunksA.length && 
                    " (This will significantly reduce processing time)"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document B (only for comparison) */}
        {analysisType === 'compare' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Document B
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearDocumentB}
                  disabled={!passageB.text && !passageB.title}
                  data-testid="button-clear-b"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title (Optional)</label>
                <Input
                  placeholder="Enter document title..."
                  value={passageB.title}
                  onChange={(e) => setPassageB({ ...passageB, title: e.target.value })}
                  data-testid="input-title-b"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Text Content</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".txt,.pdf,.docx"
                      onChange={handleFileUploadB}
                      ref={fileInputBRef}
                      className="hidden"
                      data-testid="file-input-b"
                    />
                    <VoiceDictation
                      onTranscriptionComplete={(t) =>
                        handlePassageBTextChange((passageB.text ? passageB.text.trimEnd() + " " : "") + t)
                      }
                      className="border border-input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputBRef.current?.click()}
                      disabled={fileUploadMutation.isPending}
                      data-testid="button-upload-b"
                    >
                      {fileUploadMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <FileText className="h-4 w-4 mr-1" />
                      )}
                      Upload File
                    </Button>
                  </div>
                </div>
                <Textarea
                  placeholder="Paste or type your text here, or upload a document (TXT, PDF, DOCX)..."
                  value={passageB.text}
                  onChange={(e) => handlePassageBTextChange(e.target.value)}
                  rows={12}
                  data-testid="textarea-content-b"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Word count: {passageB.text.split(/\s+/).filter(Boolean).length}
                    {passageB.text.split(/\s+/).filter(Boolean).length > 1000 && 
                      " (Will be processed in chunks)"
                    }
                  </p>
                  
                  {/* Send to other tools buttons */}
                  {passageB.text.trim() && (
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          sendToHumanizer(passageB.text);
                          toast({
                            title: "Sent to humanizer",
                            description: "Your text is now ready for AI humanization.",
                          });
                        }}
                        className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                        data-testid="button-send-to-humanizer-b"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Humanizer
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          sendToDocumentRewriter(passageB.text);
                          toast({
                            title: "Sent to rewriter",
                            description: "Your text is now ready for document rewriting.",
                          });
                        }}
                        className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                        data-testid="button-send-to-rewriter-b"
                      >
                        <FileEdit className="h-3 w-3 mr-1" />
                        Rewriter
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          sendToHomeworkHelper(passageB.text);
                          toast({
                            title: "Sent to homework helper",
                            description: "Your text is now ready for homework solving.",
                          });
                        }}
                        className="text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                        data-testid="button-send-to-homework-b"
                      >
                        <GraduationCap className="h-3 w-3 mr-1" />
                        Homework
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Chunk Selector for Document B */}
              {showChunkSelectorB && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Select Chunks to Analyze</label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedChunksB(Array.from({length: chunksB.length}, (_, i) => i))}
                        data-testid="button-select-all-b"
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedChunksB([])}
                        data-testid="button-select-none-b"
                      >
                        Select None
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded p-3">
                    {chunksB.map((chunk, index) => {
                      const wordCount = chunk.split(/\s+/).filter(Boolean).length;
                      const preview = chunk.substring(0, 100) + (chunk.length > 100 ? '...' : '');
                      const isSelected = selectedChunksB.includes(index);
                      
                      return (
                        <div key={index} className="flex items-start gap-3 p-2 border rounded">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedChunksB([...selectedChunksB, index]);
                              } else {
                                setSelectedChunksB(selectedChunksB.filter(i => i !== index));
                              }
                            }}
                            className="mt-1"
                            data-testid={`checkbox-chunk-b-${index}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">Chunk {index + 1}</span>
                              <span className="text-xs text-muted-foreground">({wordCount} words)</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{preview}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedChunksB.length} of {chunksB.length} chunks selected
                    {selectedChunksB.length > 0 && selectedChunksB.length < chunksB.length && 
                      " (This will significantly reduce processing time)"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Analysis Button */}
      <div className="flex justify-center">
        <Button
          onClick={analysisType === 'single' ? handleSingleAnalysis : handleComparisonAnalysis}
          disabled={
            analysisType === 'single'
              ? isAnalyzing
              : comparisonAnalysisMutation.isPending
          }
          size="lg"
          data-testid="button-analyze"
        >
          {(analysisType === 'single' ? isAnalyzing : comparisonAnalysisMutation.isPending) ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : null}
          {analysisType === 'single' ? 'Analyze Document' : 'Compare Documents'}
        </Button>
      </div>

      {/* Results */}
      {analysisType === 'single' ? renderSingleResults() : renderComparisonResults()}
    </div>
    </>
  );
}