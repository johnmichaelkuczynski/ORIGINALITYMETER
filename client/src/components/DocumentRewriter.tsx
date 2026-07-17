import { useState, useRef, useEffect } from 'react';
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
import { FileEdit, Download, ArrowRight, FileText, Image as ImageIcon, Wand2, Eye, BookOpen, Zap, Copy, X, CheckCircle, AlertCircle } from 'lucide-react';
import { MathPDFExporter } from './MathPDFExporter';
import DocumentUpload from './DocumentUpload';
import { VoiceDictation } from '@/components/ui/voice-dictation';
import { useToast } from '@/hooks/use-toast';
import { convertMarkdownWithMath, renderMathInElement } from '@/lib/mathUtils';



interface DocumentRewriterProps {
  onSendToAnalysis: (text: string, title?: string) => void;
  onSendToHomework?: (text: string) => void;
  initialContent?: string;
  initialTitle?: string;
}

export default function DocumentRewriter({ onSendToAnalysis, onSendToHomework, initialContent, initialTitle }: DocumentRewriterProps) {
  const [sourceText, setSourceText] = useState(initialContent || '');
  const [sourceTitle, setSourceTitle] = useState(initialTitle || '');
  
  // Text sharing context
  const { consumeDocumentRewriterText, sendToHumanizer } = useTextSharing();
  
  // AI Detection state
  const [inputAnalysisData, setInputAnalysisData] = useState<any>(null);
  const [outputAnalysisData, setOutputAnalysisData] = useState<any>(null);

  // Check for incoming text from other components
  useEffect(() => {
    const incomingText = consumeDocumentRewriterText();
    if (incomingText) {
      setSourceText(incomingText);
      setInputMethod('type');
    }
  }, [consumeDocumentRewriterText]);

  // Auto-analyze input text
  useEffect(() => {
    if (sourceText.trim() && sourceText.trim().length > 10) {
      const timeoutId = setTimeout(() => {
        analyzeInputMutation.mutate(sourceText);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [sourceText]);

  // This will be added later after rewriteResult is defined

  // Update content when props change
  useEffect(() => {
    if (initialContent) {
      setSourceText(initialContent);
      setInputMethod('type'); // Switch to type mode when content is received
    }
  }, [initialContent]);

  useEffect(() => {
    if (initialTitle) {
      setSourceTitle(initialTitle);
    }
  }, [initialTitle]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [contentSource, setContentSource] = useState('');
  const [styleSource, setStyleSource] = useState('');
  const [rewriteResult, setRewriteResult] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  // Coherent long-document (Cross-Chunk Coherence) mode state.
  const [isReconstructing, setIsReconstructing] = useState(false);
  const [reconstructProgress, setReconstructProgress] = useState<{
    status: string;
    currentChunk: number;
    numChunks: number;
  } | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<'word' | 'pdf' | 'txt' | 'html'>('html');
  const [inputMethod, setInputMethod] = useState<'upload' | 'type'>('type');

  // Generation modal state
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [modalText, setModalText] = useState('');
  const [modalDone, setModalDone] = useState(false);
  const [modalStatus, setModalStatus] = useState('');
  const [modalError, setModalError] = useState(false);
  const modalScrollRef = useRef<HTMLDivElement>(null);
  const [extractedText, setExtractedText] = useState('');
  const [documentStats, setDocumentStats] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFiction, setIsFiction] = useState(false); // Fiction/Non-fiction toggle
  const [selectedStyleSample, setSelectedStyleSample] = useState('default'); // Style sample dropdown
  const { toast } = useToast();

  // Style samples for dropdown
  const styleSamples = {
    'default': `One cannot have the concept of a red object without having the concept of an extended object. But the word "red" doesn't contain the word "extended." In general, our concepts are interconnected in ways in which the corresponding words are not interconnected. This is not an accidental fact about the English language or about any other language: it is inherent in what a language is that the cognitive abilities corresponding to a person's abilities to use words cannot possibly be reflected in semantic relations holding among those words. This fact in its turn is a consequence of the fact that expressions are, whereas concepts are not, digital structures, for which reason the ways in which cognitive abilities interact cannot possibly bear any significant resemblance to the ways in which expressions interact. Consequently, there is no truth to the contention that our thought-processes are identical with, or bear any resemblance to, the digital computations that mediate computer-activity.`,
    
    'presentations': `Sense-perceptions do not have to be deciphered if their contents are to be uploaded, the reason being that they are presentations, not representations. Linguistic expressions do have to be deciphered if their contents are to be uploaded, the reason being that they are representations, not presentations. It is viciously regressive to suppose that information-bearing mental entities are categorically in the nature of representations, as opposed to presentations, and it is therefore incoherent to suppose that thought is mediated by expressions or, therefore, by linguistic entities. Attempts to neutralize this criticism inevitably overextend the concept of what it is to be a linguistic symbol, the result being that such attempts eviscerate the very position that it is their purpose to defend. Also, it is inherent in the nature of such attempts that they assume the truth of the view that for a given mental entity to bear this as opposed to that information is for that entity to have this as opposed to that causal role. This view is demonstrably false, dooming to failure the just-mentioned attempts to defend the contention that thought is in all cases mediated by linguistic symbols.`,
    
    'causation': `It is shown (i) that causation exists, since we couldn't even ask whether causation existed unless it did; (ii) that any given case of causation is a case of persistence; and (iii) that spatiotemporal relations supervene on causal relations. (ii) is subject to the qualification that we tend not to become aware of instances of causation as such except when two different causal lines---i.e. two different cases of persistence---intersect, resulting in a breakdown of some other case of persistence, this being why we tend to regard instances of causation as fundamentally disruptive, as opposed to preservative in nature. The meaning of (iii) is that spatiotemporal relations are causal relations considered in abstraction of the various specific differences holding between different kinds of causation.`,
    
    'morpheme': `The meaning of morpheme (a minimal unit of linguistic significance) cannot diverge from what it is taken to mean. But the meaning of a complex expression can diverge without limit from what it is taken to mean, given that the meaning of such an expression is a logical consequence of the meanings of its parts, coupled with the fact that people are not infallible ratiocinators. Nonetheless, given Chomsky's distinction between competence (ability) and performance (ability to deploy ability), it is clear that one's understanding of a sentence is an instance of competence, whereas one's particular sentence-tokens are instances of performance.`,
    
    'kripke': `On the basis of arguments put forth by (Kripke, 1977a) and (Kripke, 1980), it is widely held that one can sometimes rationally accept propositions of the form "P and not-P" and also that there are necessary a posteriori truths. We will find that Kripke's arguments for these views appear probative only so long as one fails to distinguish between semantics and presemantics—between the literal meanings of sentences, on the one hand, and the information on the basis of which one identifies those meanings, on the other.`,
    
    'lewis': `"Jim would still be alive if he hadn't jumped" means that Jim's death was a consequence of his jumping. "x wouldn't be a triangle if it didn't have three sides" means that x's having a three sides is a consequence its being a triangle. Lewis takes the first sentence to mean that Jim is still alive in some alternative universe where he didn't jump, and he takes the second to mean that x is a non-triangle in every alternative universe where it doesn't have three sides. Why did Lewis misinterpret these sentences?`,
    
    'semantics': `In order to understand a sentence, one must know the relevant semantic rules. Those rules are not learned in a vacuum; they are given to one through one's senses. As a result, knowledge of semantic rules sometimes comes bundled with semantically irrelevant, but cognitively non-innocuous, knowledge of the circumstances in which those rules were learned. Thus, one must work through non-semantic information in order to know what is literally meant by a given sentence-token. A consequence is that the literal meaning of a sentence is not, in general, psychologically immediate.`,
    
    'hume': `Hume's attempt to show that deduction is the only legitimate form of inference presupposes that enumerative induction is the only non-deductive form of inference. In actuality, enumerative induction is not even a form of inference: all supposed cases of enumerative induction are disguised cases of Inference to the Best Explanation (IBE), so far as they aren't simply cases of mentation of a purely associative kind and, consequently, of a kind that is non-inductive and otherwise non-inferential.`,
    
    'computation': `According to the computational theory of mind , to think is to compute. But what is meant by the word 'compute'? The generally given answer is this: Every case of computing is a case of manipulating symbols, but not vice versa - a manipulation of symbols must be driven exclusively by the formal properties of those symbols if it is qualify as a computation. In this paper, I will present the following argument. Words like 'form' and 'formal' are ambiguous, as they can refer to form in the sense of shape or to form in the sense of functional role. The computational theory of mind conflates these two senses.`,
    
    'representations': `A series of representations must be semantics-driven if the members of that series are to combine into a single thought: where semantics is not operative, there is at most a series of disjoint representations that add up to nothing true or false, and therefore do not constitute a thought at all. A consequence is that there is necessarily a gulf between simulating thought, on the one hand, and actually thinking, on the other. A related point is that a popular doctrine - the so-called "syntactic theory of mind" - is incoherent.`,
    
    'counterfactuals': `Ordinarily counterfactuals are seen as making statements about states of affairs, albeit ones that hold in merely possible or alternative worlds. Thus analyzed, nearly all counterfactuals turn out to be incoherent. Any counterfactual, thus analyzed, requires that there be a metaphysically (not just epistemically) possible world w where the laws are the same as here, and where almost all of the facts are the same as here. (The factual differences relate to the antecedent and consequent of the counterfactual.) But there is no such world.`
  };
  
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
  
  // Auto-analyze output text when rewrite is complete
  useEffect(() => {
    if (rewriteResult && rewriteResult.trim().length > 10) {
      const timeoutId = setTimeout(() => {
        analyzeOutputMutation.mutate(rewriteResult);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [rewriteResult]);

  // Document analysis when source text changes
  useEffect(() => {
    if (sourceText && sourceText.trim().length > 100) {
      analyzeDocument();
    }
  }, [sourceText]);

  const analyzeDocument = async () => {
    if (!sourceText || sourceText.trim().length < 100) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceText }),
      });

      if (response.ok) {
        const stats = await response.json();
        setDocumentStats(stats);
      }
    } catch (error) {
      console.warn('Document analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Re-render MathJax when rewrite result changes
  useEffect(() => {
    if (rewriteResult && resultRef.current) {
      setTimeout(() => {
        renderMathInElement(resultRef.current);
      }, 100);
    }
  }, [rewriteResult]);

  // Auto-scroll generation modal as text streams in
  useEffect(() => {
    if (modalScrollRef.current) {
      modalScrollRef.current.scrollTop = modalScrollRef.current.scrollHeight;
    }
  }, [modalText]);

  const openGenerationModal = (status: string) => {
    setModalText('');
    setModalDone(false);
    setModalError(false);
    setModalStatus(status);
    setShowGenerationModal(true);
  };

  const handleDocumentProcessed = (content: string, filename?: string, type?: 'content' | 'style') => {
    if (type === 'content') {
      setContentSource(content);
      toast({
        title: "Content source loaded",
        description: `${filename} will be used as content reference for the rewrite.`,
      });
    } else if (type === 'style') {
      setStyleSource(content);
      toast({
        title: "Style source loaded", 
        description: `${filename} will be used as style reference for the rewrite.`,
      });
    } else {
      setSourceText(content);
      setSourceTitle(filename || 'Uploaded Document');
      setExtractedText(content); // Show extracted text
      toast({
        title: "Document loaded",
        description: `${filename} is ready to be rewritten.`,
      });
    }
  };

  const handleRewrite = async () => {
    if (!sourceText.trim()) {
      toast({
        title: "No content to rewrite",
        description: "Please upload a document or type your content first.",
        variant: "destructive",
      });
      return;
    }

    // Use default instructions if user doesn't provide any
    const instructionsToUse = customInstructions.trim() || "Expand architecturally, not explanatorily. Develop the internal logic of the fragment without padding with paraphrase, transitions, or definitions. The output should feel like the natural continuation of the original—fully realized but still taut, recursive, and frictional. Think, don't explain. Build, don't restate. Maintain compression, asymmetry, and conceptual tension. No summarization. No smoothing of density or style. Preserve recursive syntax and high signal density.";

    setIsRewriting(true);
    setRewriteResult(''); // Clear previous result
    
    // Check if streaming is possible (doc < 800 words)
    const wordCount = sourceText.trim().split(/\s+/).length;
    const canStream = wordCount < 800;

    openGenerationModal(canStream ? 'Streaming generation…' : 'Processing document…');

    // STREAMING MODE for smaller documents
    if (canStream) {
      try {
        const response = await fetch('/api/rewrite-document', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceText,
            customInstructions: instructionsToUse,
            contentSource: contentSource || undefined,
            styleSource: styleSource || (!customInstructions.trim() ? styleSamples[selectedStyleSample as keyof typeof styleSamples] : undefined),
            preserveMath: true,
            stream: true, // Enable streaming
            isFiction, // Fiction/Non-fiction flag
          }),
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6));
                
                if (data.chunk) {
                  accumulatedText += data.chunk;
                  setRewriteResult(accumulatedText);
                  setModalText(accumulatedText);
                } else if (data.done) {
                  setIsRewriting(false);
                  setModalDone(true);
                  setModalStatus('Complete');
                } else if (data.error) {
                  throw new Error(data.error);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Streaming rewrite error:", error);
        setRewriteResult('');
        setIsRewriting(false);
        setModalDone(true);
        setModalError(true);
        setModalStatus('Error');
        toast({
          title: "Streaming error",
          description: error instanceof Error ? error.message : "Failed to stream rewrite",
          variant: "destructive",
        });
      }
      return;
    }

    // NON-STREAMING MODE for large documents (chunked)
    const chunkCount = documentStats?.chunkCount;
    if (chunkCount) setModalStatus(`Processing ${chunkCount} chunks…`);

    try{
      const response = await fetch('/api/rewrite-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceText,
          customInstructions: instructionsToUse,
          contentSource: contentSource || undefined,
          styleSource: styleSource || (!customInstructions.trim() ? styleSamples[selectedStyleSample as keyof typeof styleSamples] : undefined),
          preserveMath: true,
          isFiction, // Fiction/Non-fiction flag
          enableChunking: true,
          maxWordsPerChunk: 800
        }),
      });

      if (!response.ok) {
        throw new Error(`Rewrite failed: ${response.statusText}`);
      }

      const result = await response.json();
      setRewriteResult(result.rewrittenText);
      setModalText(result.rewrittenText);
      setModalDone(true);
      setModalStatus('Complete');
      
      toast({
        title: "Rewrite completed",
        description: documentStats?.willNeedChunking 
          ? `Large document processed in ${documentStats.chunkCount} chunks with perfect math preservation.`
          : "Your document has been successfully rewritten with perfect math notation.",
      });
    } catch (error) {
      console.error('Error during rewrite:', error);
      setModalDone(true);
      setModalError(true);
      setModalStatus('Error');
      toast({
        title: "Rewrite failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsRewriting(false);
    }
  };

  // Coherent long-document mode: kicks off the three-pass Cross-Chunk Coherence
  // pipeline on the server (skeleton -> constrained chunks -> stitch), then polls
  // for progress and the assembled result. Use this for long documents that the
  // normal chunked rewrite turns into "Frankenstein" output.
  const handleCoherentRewrite = async () => {
    if (!sourceText.trim()) {
      toast({
        title: "No content to rewrite",
        description: "Please upload a document or type your content first.",
        variant: "destructive",
      });
      return;
    }

    const instructionsToUse = customInstructions.trim() || "Reconstruct this document faithfully into one coherent whole. Keep the original argument arc and terminology. Improve clarity and flow. No puffery, no padding — add length only through substantive examples and explanation.";

    setIsReconstructing(true);
    setRewriteResult('');
    setReconstructProgress({ status: 'starting', currentChunk: 0, numChunks: 0 });
    openGenerationModal('Starting coherent rebuild…');

    try {
      const startResp = await fetch('/api/reconstruction/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText,
          customInstructions: instructionsToUse,
          contentSource: contentSource || undefined,
          styleSource: styleSource || (!customInstructions.trim() ? styleSamples[selectedStyleSample as keyof typeof styleSamples] : undefined),
          preserveMath: true,
          isFiction,
          title: sourceTitle || undefined,
        }),
      });

      if (!startResp.ok) {
        throw new Error(`Failed to start: ${startResp.statusText}`);
      }

      const startData = await startResp.json();
      const jobId = startData.jobId;

      toast({
        title: "Coherent rebuild started",
        description: `${startData.totalInputWords} words → target ${startData.targetMinWords}-${startData.targetMaxWords} words in ${startData.numChunks} sections.`,
      });

      setReconstructProgress({ status: startData.status, currentChunk: 0, numChunks: startData.numChunks });

      // Poll for progress until complete or failed. All errors are handled
      // inside the poller (it runs in a detached setTimeout, so a throw here
      // would become an unhandled rejection and freeze the UI). We tolerate a
      // few transient network failures before giving up.
      let consecutiveErrors = 0;
      const poll = async (): Promise<void> => {
        try {
          const resp = await fetch(`/api/reconstruction/${jobId}`);
          if (!resp.ok) throw new Error(`Polling failed: ${resp.statusText}`);
          const data = await resp.json();
          consecutiveErrors = 0;

          setReconstructProgress({
            status: data.status,
            currentChunk: data.currentChunk,
            numChunks: data.numChunks,
          });

          if (data.currentChunk > 0 && data.numChunks > 0) {
            setModalStatus(`Rebuilding section ${data.currentChunk} of ${data.numChunks}…`);
          }

          if (data.status === 'complete') {
            setRewriteResult(data.finalOutput || '');
            setModalText(data.finalOutput || '');
            setModalDone(true);
            setModalStatus('Complete');
            setIsReconstructing(false);
            setReconstructProgress(null);
            const conflicts = Array.isArray(data.stitchReport?.conflicts) ? data.stitchReport.conflicts.length : 0;
            toast({
              title: "Coherent rebuild complete",
              description: `${data.finalWordCount} words assembled${conflicts ? ` — stitch pass flagged ${conflicts} item(s) to review` : ' with no coherence conflicts'}.`,
            });
            return;
          }

          if (data.status === 'failed') {
            setModalDone(true);
            setModalError(true);
            setModalStatus('Failed');
            setIsReconstructing(false);
            setReconstructProgress(null);
            toast({
              title: "Coherent rebuild failed",
              description: data.errorMessage || 'Reconstruction failed on the server.',
              variant: "destructive",
            });
            return;
          }

          // Still in progress — keep polling.
          setTimeout(poll, 2500);
        } catch (err) {
          consecutiveErrors++;
          console.error('Reconstruction poll error:', err);
          if (consecutiveErrors >= 5) {
            setIsReconstructing(false);
            setReconstructProgress(null);
            toast({
              title: "Lost connection to rebuild",
              description: "Couldn't reach the server. The job may still be running — try the button again to reconnect.",
              variant: "destructive",
            });
            return;
          }
          // Back off briefly and retry.
          setTimeout(poll, 4000);
        }
      };

      setTimeout(poll, 2000);
    } catch (error) {
      console.error('Coherent rewrite error:', error);
      setIsReconstructing(false);
      setReconstructProgress(null);
      toast({
        title: "Coherent rebuild failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      });
    }
  };

  const handleViewHTML = () => {
    if (!rewriteResult) return;
    
    const htmlContent = convertMarkdownWithMath(rewriteResult);
    const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${sourceTitle || 'Rewritten Document'}</title>
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
  <h1>${sourceTitle || 'Rewritten Document'}</h1>
  <div>${htmlContent}</div>
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    toast({
      title: "HTML preview opened",
      description: "The formatted document opened in a new tab",
    });
  };

  const handleDownload = async () => {
    if (!rewriteResult) {
      toast({
        title: "No content to download",
        description: "Please complete a rewrite first.",
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
          content: rewriteResult,
          format: downloadFormat,
          title: sourceTitle || 'Rewritten Document',
        }),
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rewritten-${sourceTitle || 'document'}.${downloadFormat === 'html' ? 'html' : downloadFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `Your rewritten document is downloading as ${downloadFormat.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      });
    }
  };

  const handleSendToAnalysis = () => {
    if (!rewriteResult) {
      toast({
        title: "No content to analyze",
        description: "Please complete a rewrite first.",
        variant: "destructive",
      });
      return;
    }
    
    onSendToAnalysis(rewriteResult, `Rewritten: ${sourceTitle}`);
    toast({
      title: "Sent to analysis",
      description: "Your rewritten document is now ready for originality evaluation.",
    });
  };

  const handleSendToHomework = () => {
    if (!rewriteResult) {
      toast({
        title: "No content to send",
        description: "Please complete a rewrite first.",
        variant: "destructive",
      });
      return;
    }
    
    if (onSendToHomework) {
      onSendToHomework(rewriteResult);
      toast({
        title: "Sent to homework helper",
        description: "Your rewritten document is now ready for homework assignment creation.",
      });
    }
  };

  const handleSendToHumanizer = () => {
    if (!rewriteResult) {
      toast({
        title: "No content to send",
        description: "Please complete a rewrite first.",
        variant: "destructive",
      });
      return;
    }
    
    sendToHumanizer(rewriteResult);
    toast({
      title: "Sent to humanizer",
      description: "Your rewritten document is now ready for AI text humanization.",
    });
  };

  const handleRewriteAgain = async () => {
    if (!rewriteResult) {
      toast({
        title: "No content to rewrite",
        description: "Please complete a rewrite first.",
        variant: "destructive",
      });
      return;
    }

    // Use default instructions if user doesn't provide any
    const instructionsToUse = customInstructions.trim() || "Expand architecturally, not explanatorily. Develop the internal logic of the fragment without padding with paraphrase, transitions, or definitions. The output should feel like the natural continuation of the original—fully realized but still taut, recursive, and frictional. Think, don't explain. Build, don't restate. Maintain compression, asymmetry, and conceptual tension. No summarization. No smoothing of density or style. Preserve recursive syntax and high signal density.";

    setIsRewriting(true);
    
    // Check if streaming is possible (doc < 800 words)
    const wordCount = rewriteResult.trim().split(/\s+/).length;
    const canStream = wordCount < 800;

    openGenerationModal(canStream ? 'Streaming re-write…' : 'Processing document…');

    // STREAMING MODE for smaller documents
    if (canStream) {
      try {
        const response = await fetch('/api/rewrite-document', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceText: rewriteResult,
            customInstructions: instructionsToUse,
            contentSource: contentSource || undefined,
            styleSource: styleSource || (!customInstructions.trim() ? styleSamples[selectedStyleSample as keyof typeof styleSamples] : undefined),
            preserveMath: true,
            stream: true,
            isFiction,
          }),
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6));
                
                if (data.chunk) {
                  accumulatedText += data.chunk;
                  setRewriteResult(accumulatedText);
                  setModalText(accumulatedText);
                } else if (data.done) {
                  setIsRewriting(false);
                  setModalDone(true);
                  setModalStatus('Complete');
                } else if (data.error) {
                  throw new Error(data.error);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Streaming recursive rewrite error:", error);
        setRewriteResult('');
        setIsRewriting(false);
        setModalDone(true);
        setModalError(true);
        setModalStatus('Error');
        toast({
          title: "Rewrite failed",
          description: error instanceof Error ? error.message : "Failed to rewrite",
          variant: "destructive",
        });
      }
      return;
    }

    // NON-STREAMING MODE for large documents
    try {
      const response = await fetch('/api/rewrite-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceText: rewriteResult,
          customInstructions: instructionsToUse,
          contentSource: contentSource || undefined,
          styleSource: styleSource || (!customInstructions.trim() ? styleSamples[selectedStyleSample as keyof typeof styleSamples] : undefined),
          isFiction,
          preserveMath: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Recursive rewrite failed: ${response.statusText}`);
      }

      const result = await response.json();
      setRewriteResult(result.rewrittenText);
      setModalText(result.rewrittenText);
      setModalDone(true);
      setModalStatus('Complete');
    } catch (error) {
      console.error('Error during recursive rewrite:', error);
      setModalDone(true);
      setModalError(true);
      setModalStatus('Error');
      toast({
        title: "Recursive rewrite failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <>
    {/* ── Generation Streaming Modal ── */}
    {showGenerationModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => { if (modalDone) setShowGenerationModal(false); }}
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
              {!modalDone && modalText && (
                <span className="text-xs text-gray-500 ml-1">
                  {modalText.trim().split(/\s+/).length.toLocaleString()} words
                </span>
              )}
              {modalDone && modalText && (
                <span className="text-xs text-gray-400 ml-1">
                  {modalText.trim().split(/\s+/).length.toLocaleString()} words generated
                </span>
              )}
            </div>
            <button
              onClick={() => setShowGenerationModal(false)}
              disabled={!modalDone}
              className={`p-1.5 rounded-lg transition-colors ${
                modalDone
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700 cursor-pointer'
                  : 'text-gray-700 cursor-not-allowed'
              }`}
              title={modalDone ? 'Close' : 'Generating — please wait…'}
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
              {modalDone ? 'Result also available below on the page.' : 'Close will become available when generation finishes.'}
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
                onClick={() => setShowGenerationModal(false)}
                disabled={!modalDone}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  modalDone
                    ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                }`}
              >
                {modalDone ? 'Done' : 'Generating…'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileEdit className="h-5 w-5 text-purple-600" />
          Document Rewriter
          <Badge variant="secondary" className="ml-2">
            Perfect Math Rendering
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Source Document Input */}
        <div>
          <Label className="text-sm font-medium">Source Document</Label>
          <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as 'upload' | 'type')}>
            <TabsList className="grid w-full grid-cols-2 mt-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Upload/Drop
              </TabsTrigger>
              <TabsTrigger value="type" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Type/Screenshot
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-4">
              <DocumentUpload
                onDocumentProcessed={handleDocumentProcessed}
                acceptImages={true}
                placeholder="Upload the document you want to rewrite (PDF, Word, TXT, or screenshot)"
              />
            </TabsContent>
            <TabsContent value="type" className="mt-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Type your content here, or upload a screenshot for OCR processing..."
                  value={sourceText}
                  onChange={(e) => {
                    console.log('Source text changed:', e.target.value.length, 'characters');
                    setSourceText(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!isRewriting && sourceText.trim()) {
                        handleRewrite();
                      }
                    }
                  }}
                  rows={8}
                  className="resize-none"
                />
                {documentStats && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium">Words:</span> {documentStats.stats.wordCount.toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Characters:</span> {documentStats.stats.characterCount.toLocaleString()}
                        </div>
                      </div>
                      {documentStats.willNeedChunking && (
                        <div className="text-blue-700">
                          <div className="font-medium">Chunking Required</div>
                          <div className="text-xs">
                            {documentStats.chunkCount} chunks • ~{Math.ceil(documentStats.estimatedProcessingTime / 60)}min processing
                          </div>
                        </div>
                      )}
                    </div>
                    {documentStats.stats.mathBlockCount > 0 && (
                      <div className="mt-2 text-xs text-green-700">
                        ✓ {documentStats.stats.mathBlockCount} mathematical expressions detected
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <VoiceDictation
                    onTranscriptionComplete={(text) => {
                      const updatedText = sourceText 
                        ? sourceText.trim() + (sourceText.endsWith('.') ? ' ' : '. ') + text
                        : text;
                      setSourceText(updatedText);
                      toast({
                        title: "Voice input added",
                        description: "Your dictated text has been added to the document.",
                      });
                    }}
                  />
                </div>
                <DocumentUpload
                  onDocumentProcessed={handleDocumentProcessed}
                  acceptImages={true}
                  placeholder="Or drop a screenshot here for OCR text and math extraction"
                  className="border-dashed border-gray-200 bg-gray-50"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Separator />

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

        {/* Fiction/Non-Fiction Toggle */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
          <Label className="text-sm font-medium">Content Type:</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={!isFiction ? "default" : "outline"}
              size="sm"
              onClick={() => setIsFiction(false)}
              data-testid="button-nonfiction-toggle"
              className={!isFiction ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              📝 Non-Fiction
            </Button>
            <Button
              type="button"
              variant={isFiction ? "default" : "outline"}
              size="sm"
              onClick={() => setIsFiction(true)}
              data-testid="button-fiction-toggle"
              className={isFiction ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              📚 Fiction
            </Button>
          </div>
          <span className="text-xs text-gray-600 ml-auto">
            {isFiction ? "Story/narrative mode active" : "Essay/article mode active"}
          </span>
        </div>

        {/* Style Sample Dropdown */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg">
          <Label className="text-sm font-medium">Writing Style:</Label>
          <Select value={selectedStyleSample} onValueChange={setSelectedStyleSample}>
            <SelectTrigger className="w-64" data-testid="select-style-sample">
              <SelectValue placeholder="Select a style sample" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Concepts & Digital Structures</SelectItem>
              <SelectItem value="presentations">Presentations vs Representations</SelectItem>
              <SelectItem value="causation">Causation & Persistence</SelectItem>
              <SelectItem value="morpheme">Morpheme & Complex Expression</SelectItem>
              <SelectItem value="kripke">Kripke & Semantics</SelectItem>
              <SelectItem value="lewis">Lewis & Counterfactuals</SelectItem>
              <SelectItem value="semantics">Semantic Rules & Understanding</SelectItem>
              <SelectItem value="hume">Hume & Inference</SelectItem>
              <SelectItem value="computation">Computational Theory of Mind</SelectItem>
              <SelectItem value="representations">Representations & Thought</SelectItem>
              <SelectItem value="counterfactuals">Counterfactuals & Possible Worlds</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-gray-600">
            Choose the philosophical style to match
          </span>
        </div>

        {/* Custom Instructions */}
        <div>
          <Label htmlFor="instructions" className="text-sm font-medium">
            Custom Rewrite Instructions *
          </Label>
          <Textarea
            id="instructions"
            placeholder="Describe how you want the document rewritten (e.g., 'Make it more formal and academic', 'Simplify for undergraduate level', 'Add more technical depth', etc.) - Press Enter to rewrite, Shift+Enter for new line"
            value={customInstructions}
            onChange={(e) => {
              console.log('Custom instructions changed:', e.target.value.length, 'characters');
              setCustomInstructions(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!isRewriting && sourceText.trim()) {
                  handleRewrite();
                }
              }
            }}
            rows={4}
            className="mt-2 resize-none"
          />
          <div className="flex gap-2 mt-2">
            <VoiceDictation
              onTranscriptionComplete={(text) => {
                const updatedInstructions = customInstructions 
                  ? customInstructions.trim() + (customInstructions.endsWith('.') ? ' ' : '. ') + text
                  : text;
                setCustomInstructions(updatedInstructions);
                toast({
                  title: "Voice instructions added",
                  description: "Your dictated instructions have been added.",
                });
              }}
            />
          </div>
        </div>

        {/* Optional Sources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Content Source (Optional)</Label>
            <DocumentUpload
              onDocumentProcessed={handleDocumentProcessed}
              acceptImages={true}
              placeholder="Upload document to draw content from"
              sourceType="content"
              className="mt-2"
            />
            {contentSource && (
              <Badge className="mt-2 bg-green-100 text-green-800">
                Content source loaded
              </Badge>
            )}
          </div>
          <div>
            <Label className="text-sm font-medium">Style Source (Optional)</Label>
            <DocumentUpload
              onDocumentProcessed={handleDocumentProcessed}
              acceptImages={true}
              placeholder="Upload document to emulate style from"
              sourceType="style"
              className="mt-2"
            />
            {styleSource && (
              <Badge className="mt-2 bg-blue-100 text-blue-800">
                Style source loaded
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Rewrite Buttons */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => {
                console.log('Rewrite button clicked:', {
                  sourceTextLength: sourceText.length,
                  sourceTextTrimmed: sourceText.trim().length,
                  customInstructionsLength: customInstructions.length,
                  customInstructionsTrimmed: customInstructions.trim().length,
                  isRewriting
                });
                handleRewrite();
              }}
              disabled={isRewriting || isReconstructing || !sourceText.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2"
              data-testid="button-rewrite-document"
            >
              {isRewriting ? (
                <>
                  <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                  Rewriting...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Rewrite Document
                </>
              )}
            </Button>

            <Button
              onClick={handleCoherentRewrite}
              disabled={isRewriting || isReconstructing || !sourceText.trim()}
              className="bg-indigo-700 hover:bg-indigo-800 text-white px-8 py-2"
              data-testid="button-coherent-rewrite"
            >
              {isReconstructing ? (
                <>
                  <BookOpen className="h-4 w-4 mr-2 animate-spin" />
                  Rebuilding...
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Long Document (Coherent)
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 max-w-md text-center">
            Use <span className="font-medium">Long Document (Coherent)</span> for long texts. It extracts a global outline, rebuilds each section against it, then runs a consistency pass — preventing the disjointed "Frankenstein" output from naive chunking.
          </p>

          {/* Coherent rebuild progress */}
          {isReconstructing && reconstructProgress && (
            <div className="w-full max-w-md" data-testid="status-reconstruct-progress">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>
                  {reconstructProgress.status === 'skeleton_extraction' && 'Pass 1 of 3 — extracting global outline...'}
                  {reconstructProgress.status === 'chunk_processing' && `Pass 2 of 3 — rebuilding section ${reconstructProgress.currentChunk} of ${reconstructProgress.numChunks}`}
                  {reconstructProgress.status === 'stitching' && 'Pass 3 of 3 — checking consistency & assembling...'}
                  {(reconstructProgress.status === 'starting' || reconstructProgress.status === 'pending') && 'Starting...'}
                </span>
                {reconstructProgress.numChunks > 0 && reconstructProgress.status === 'chunk_processing' && (
                  <span>{Math.round((reconstructProgress.currentChunk / reconstructProgress.numChunks) * 100)}%</span>
                )}
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-500"
                  style={{
                    width: reconstructProgress.status === 'skeleton_extraction'
                      ? '8%'
                      : reconstructProgress.status === 'stitching'
                      ? '95%'
                      : reconstructProgress.numChunks > 0
                      ? `${Math.max(10, Math.round((reconstructProgress.currentChunk / reconstructProgress.numChunks) * 90) + 8)}%`
                      : '4%',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {rewriteResult && (
          <div className="space-y-4">
            <Separator />
            <div>
              <Label className="text-sm font-medium">Rewritten Document</Label>
              <Card className="mt-2 p-4 bg-gray-50">
                <div 
                  ref={resultRef}
                  className="prose max-w-none text-sm math-container"
                  dangerouslySetInnerHTML={{ __html: convertMarkdownWithMath(rewriteResult) }}
                />
              </Card>
            </div>

            {/* Action Options */}
            <div className="flex flex-col gap-4">
              {/* Edit Instructions & Recursive Rewrite */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-blue-900">
                      Edit Instructions Before Rewriting Again
                    </Label>
                    <Textarea
                      id="rewrite-again-instructions"
                      placeholder="Change your rewrite instructions here before clicking 'Rewrite Again'..."
                      value={customInstructions}
                      onChange={(e) => {
                        setCustomInstructions(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (!isRewriting && rewriteResult) {
                            handleRewriteAgain();
                          }
                        }
                      }}
                      rows={3}
                      className="resize-none bg-white"
                    />
                    <div className="flex items-center justify-center">
                      <Button
                        onClick={handleRewriteAgain}
                        disabled={isRewriting}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {isRewriting ? (
                          <>
                            <Wand2 className="h-4 w-4 animate-spin" />
                            Rewriting Again...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4" />
                            Rewrite Again (or press Enter)
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Download and Analysis Options */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(rewriteResult);
                      toast({
                        title: "Copied to clipboard",
                        description: "The rewritten text has been copied to your clipboard.",
                      });
                    }}
                    variant="default"
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-copy-output"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  <MathPDFExporter 
                    content={rewriteResult}
                    title={`Rewritten: ${sourceTitle || 'Document'}`}
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
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleSendToAnalysis}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Send to Analysis
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  {onSendToHomework && (
                    <Button
                      onClick={handleSendToHomework}
                      variant="outline"
                      className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <BookOpen className="h-4 w-4" />
                      Send to Homework Helper
                    </Button>
                  )}
                  <Button
                    onClick={handleSendToHumanizer}
                    variant="outline"
                    className="flex items-center gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Zap className="h-4 w-4" />
                    Send to Humanizer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}