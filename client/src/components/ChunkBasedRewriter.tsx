import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileEdit, 
  Wand2, 
  CheckSquare, 
  Square, 
  Eye, 
  Download,
  ArrowRight,
  Loader2 
} from 'lucide-react';
import DocumentUpload from './DocumentUpload';
import { useToast } from '@/hooks/use-toast';
import { convertMarkdownWithMath, renderMathInElement } from '@/lib/mathUtils';

interface DocumentChunk {
  id: number;
  content: string;
  wordCount: number;
  startIndex: number;
  endIndex: number;
  preview: string;
  rewritten?: boolean;
}

interface ChunkBasedRewriterProps {
  onSendToAnalysis: (text: string, title?: string) => void;
  initialContent?: string;
  initialTitle?: string;
}

export default function ChunkBasedRewriter({ onSendToAnalysis, initialContent, initialTitle }: ChunkBasedRewriterProps) {
  const [sourceText, setSourceText] = useState(initialContent || '');
  const [sourceTitle, setSourceTitle] = useState(initialTitle || '');
  const [customInstructions, setCustomInstructions] = useState('');
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [selectedChunks, setSelectedChunks] = useState<Set<number>>(new Set());
  const [isChunking, setIsChunking] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [finalDocument, setFinalDocument] = useState('');
  const [maxWordsPerChunk, setMaxWordsPerChunk] = useState(500);
  const resultRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Update content when props change
  useEffect(() => {
    if (initialContent) {
      setSourceText(initialContent);
    }
  }, [initialContent]);

  useEffect(() => {
    if (initialTitle) {
      setSourceTitle(initialTitle);
    }
  }, [initialTitle]);

  // Re-render MathJax when final document changes
  useEffect(() => {
    if (finalDocument && resultRef.current) {
      setTimeout(() => {
        renderMathInElement(resultRef.current);
      }, 100);
    }
  }, [finalDocument]);

  const handleDocumentProcessed = (content: string, filename?: string) => {
    setSourceText(content);
    setSourceTitle(filename || 'Uploaded Document');
    setChunks([]);
    setSelectedChunks(new Set());
    setFinalDocument('');
    toast({
      title: "Document loaded",
      description: `${filename} is ready for chunk-based rewriting.`,
    });
  };

  const handleGetChunks = async () => {
    if (!sourceText.trim()) {
      toast({
        title: "No content",
        description: "Please provide text to chunk.",
        variant: "destructive",
      });
      return;
    }

    console.log('Chunking document with maxWordsPerChunk:', maxWordsPerChunk);
    console.log('Source text length:', sourceText.length, 'characters');
    
    setIsChunking(true);
    try {
      const response = await fetch('/api/get-document-chunks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText,
          maxWordsPerChunk
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Received chunks:', result.chunks.length);
      
      setChunks(result.chunks);
      setSelectedChunks(new Set()); // Clear selections
      
      toast({
        title: "Document chunked successfully",
        description: `Created ${result.chunks.length} chunks. Select which ones to rewrite.`,
      });
    } catch (error) {
      console.error('Error chunking document:', error);
      toast({
        title: "Chunking failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsChunking(false);
    }
  };

  const handleChunkSelection = (chunkId: number, checked: boolean) => {
    const newSelected = new Set(selectedChunks);
    if (checked) {
      newSelected.add(chunkId);
    } else {
      newSelected.delete(chunkId);
    }
    setSelectedChunks(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedChunks.size === chunks.length) {
      setSelectedChunks(new Set());
    } else {
      setSelectedChunks(new Set(chunks.map(chunk => chunk.id)));
    }
  };

  const handleRewriteSelected = async () => {
    if (selectedChunks.size === 0) {
      toast({
        title: "No chunks selected",
        description: "Please select at least one chunk to rewrite.",
        variant: "destructive",
      });
      return;
    }

    if (!customInstructions.trim()) {
      toast({
        title: "Missing instructions",
        description: "Please provide rewrite instructions.",
        variant: "destructive",
      });
      return;
    }

    setIsRewriting(true);
    try {
      const response = await fetch('/api/rewrite-selected-chunks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chunks,
          selectedChunkIds: Array.from(selectedChunks),
          customInstructions,
          preserveMath: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setChunks(result.chunks);
      
      // Reassemble the final document
      const finalContent = result.chunks.map((chunk: DocumentChunk) => chunk.content).join('\n\n');
      setFinalDocument(finalContent);
      
      toast({
        title: "Rewrite completed",
        description: `Successfully rewrote ${selectedChunks.size} chunks.`,
      });
    } catch (error) {
      console.error('Error rewriting chunks:', error);
      toast({
        title: "Rewrite failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsRewriting(false);
    }
  };

  const handleSendToAnalysis = () => {
    if (!finalDocument) {
      toast({
        title: "No content to analyze",
        description: "Please complete a rewrite first.",
        variant: "destructive",
      });
      return;
    }
    
    onSendToAnalysis(finalDocument, `Chunk-Rewritten: ${sourceTitle}`);
    toast({
      title: "Sent to analysis",
      description: "Your rewritten document is now ready for originality evaluation.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Chunk-Based Document Rewriter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Information Panel */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">How Chunk-Based Rewriting Works:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Upload or paste your document</li>
              <li>2. Click "Create Chunks" to divide the document into sections</li>
              <li>3. Select only the chunks you want to rewrite</li>
              <li>4. Provide rewrite instructions and click "Rewrite Selected Chunks"</li>
              <li>5. The final document combines rewritten and original chunks</li>
            </ol>
          </div>

          {/* Document Input */}
          <div className="space-y-2">
            <Label>Document Source</Label>
            <DocumentUpload 
              onDocumentProcessed={handleDocumentProcessed}
              placeholder="Upload document for chunk-based rewriting"
              acceptImages={false}
            />
          </div>

          {/* Manual Text Input */}
          <div className="space-y-2">
            <Label>Or paste your text here:</Label>
            <Textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Paste your document text here..."
              className="min-h-[200px]"
            />
          </div>

          {/* Chunking Settings */}
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label>Max words per chunk:</Label>
              <select 
                value={maxWordsPerChunk} 
                onChange={(e) => setMaxWordsPerChunk(Number(e.target.value))}
                className="border rounded px-3 py-1"
              >
                <option value={300}>300 words</option>
                <option value={500}>500 words</option>
                <option value={800}>800 words</option>
                <option value={1000}>1000 words</option>
              </select>
            </div>
            <Button 
              onClick={handleGetChunks}
              disabled={isChunking || !sourceText.trim()}
              className="mt-6"
            >
              {isChunking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Chunking...
                </>
              ) : (
                <>
                  <FileEdit className="h-4 w-4 mr-2" />
                  Create Chunks
                </>
              )}
            </Button>
          </div>

          {/* Chunk Selection */}
          {chunks.length > 0 && (
            <div className="space-y-4">
              <Separator />
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Document Chunks ({chunks.length})</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedChunks.size === chunks.length ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Select All
                    </>
                  )}
                </Button>
              </div>

              <ScrollArea className="h-96 border rounded-md p-4">
                <div className="space-y-3">
                  {chunks.map((chunk) => (
                    <Card key={chunk.id} className={`p-3 ${selectedChunks.has(chunk.id) ? 'ring-2 ring-blue-500' : ''}`}>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedChunks.has(chunk.id)}
                          onCheckedChange={(checked) => handleChunkSelection(chunk.id, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Chunk {chunk.id + 1}</Badge>
                            <Badge variant="secondary">{chunk.wordCount} words</Badge>
                            {chunk.rewritten && <Badge variant="default">Rewritten</Badge>}
                          </div>
                          <p className="text-sm text-gray-600">{chunk.preview}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {/* Rewrite Instructions */}
              <div className="space-y-2">
                <Label>Rewrite Instructions</Label>
                <Textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Example: Make this more formal and academic, add more specific examples, simplify the language for a general audience..."
                  className="min-h-[100px]"
                />
              </div>

              {/* Rewrite Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleRewriteSelected}
                  disabled={isRewriting || selectedChunks.size === 0 || !customInstructions.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2"
                >
                  {isRewriting ? (
                    <>
                      <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                      Rewriting {selectedChunks.size} chunks...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Rewrite Selected Chunks ({selectedChunks.size})
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Final Document */}
          {finalDocument && (
            <div className="space-y-4">
              <Separator />
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Final Rewritten Document</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendToAnalysis}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Send to Analysis
                  </Button>
                </div>
              </div>
              <Card className="p-4 bg-gray-50">
                <div 
                  ref={resultRef}
                  className="prose max-w-none text-sm math-container"
                  dangerouslySetInnerHTML={{ __html: convertMarkdownWithMath(finalDocument) }}
                />
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}