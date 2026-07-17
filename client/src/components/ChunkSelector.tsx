import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, CheckSquare, Square, Loader2, Wand2, Eye, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TextChunk {
  id: number;
  content: string;
  wordCount: number;
  startPosition: number;
  endPosition: number;
  preview: string;
}

interface ChunkedDocument {
  originalText: string;
  title: string;
  totalWordCount: number;
  chunks: TextChunk[];
  chunkSize: number;
}

interface ChunkSelectorProps {
  text: string;
  title: string;
  analysisResult: any;
  onChunksGenerated: (result: any) => void;
}

export function ChunkSelector({ text, title, analysisResult, onChunksGenerated }: ChunkSelectorProps) {
  const [chunkedDocument, setChunkedDocument] = useState<ChunkedDocument | null>(null);
  const [selectedChunks, setSelectedChunks] = useState<Set<number>>(new Set());
  const [isChunking, setIsChunking] = useState(false);
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [previewChunk, setPreviewChunk] = useState<TextChunk | null>(null);
  const { toast } = useToast();

  // Mutation for chunking text
  const chunkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/chunk-text', {
        text,
        title,
        chunkSize: 500
      });
      return response.json() as Promise<ChunkedDocument>;
    },
    onSuccess: (data) => {
      setChunkedDocument(data);
      setIsChunking(false);
      toast({
        title: "Document chunked successfully",
        description: `Created ${data.chunks.length} chunks for processing`,
      });
    },
    onError: (error) => {
      console.error('Failed to chunk document:', error);
      setIsChunking(false);
      toast({
        title: "Chunking failed",
        description: "There was a problem breaking down your document. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mutation for generating from selected chunks
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!chunkedDocument || selectedChunks.size === 0) {
        throw new Error("No chunks selected");
      }

      const selectedChunkData = chunkedDocument.chunks.filter(chunk => 
        selectedChunks.has(chunk.id)
      );

      const response = await apiRequest('POST', '/api/generate-from-chunks', {
        selectedChunks: selectedChunkData,
        analysisResult,
        styleOption: 'prioritize-originality',
        customInstructions: customInstructions.trim() || undefined
      });
      return response.json();
    },
    onSuccess: (data) => {
      onChunksGenerated(data);
      toast({
        title: "Improved version generated",
        description: `Successfully processed ${selectedChunks.size} selected chunks`,
      });
    },
    onError: (error) => {
      console.error('Failed to generate from chunks:', error);
      toast({
        title: "Generation failed",
        description: "There was a problem generating improved text from selected chunks. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Auto-chunk when component loads
  useEffect(() => {
    if (text && text.split(/\s+/).length > 1000) {
      setIsChunking(true);
      chunkMutation.mutate();
    }
  }, [text]);

  const handleChunkToggle = (chunkId: number) => {
    const newSelected = new Set(selectedChunks);
    if (newSelected.has(chunkId)) {
      newSelected.delete(chunkId);
    } else {
      newSelected.add(chunkId);
    }
    setSelectedChunks(newSelected);
  };

  const handleSelectAll = () => {
    if (!chunkedDocument) return;
    setSelectedChunks(new Set(chunkedDocument.chunks.map(chunk => chunk.id)));
  };

  const handleSelectNone = () => {
    setSelectedChunks(new Set());
  };

  const handleGenerate = () => {
    if (selectedChunks.size === 0) {
      toast({
        title: "No chunks selected",
        description: "Please select at least one chunk to process.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate();
  };

  if (isChunking || chunkMutation.isPending) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Breaking down your document...</p>
            <p className="text-sm text-muted-foreground">
              Creating manageable chunks for processing
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chunkedDocument) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Chunk Selection
        </CardTitle>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Document split into {chunkedDocument.chunks.length} chunks 
            ({chunkedDocument.totalWordCount.toLocaleString()} total words)
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              <CheckSquare className="w-4 h-4 mr-1" />
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleSelectNone}>
              <Square className="w-4 h-4 mr-1" />
              Select None
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {selectedChunks.size} of {chunkedDocument.chunks.length} chunks selected
          </Badge>
          {selectedChunks.size > 0 && (
            <Badge variant="default">
              ~{chunkedDocument.chunks
                .filter(chunk => selectedChunks.has(chunk.id))
                .reduce((total, chunk) => total + chunk.wordCount, 0)
                .toLocaleString()} words
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 w-full rounded-md border p-4">
          <div className="space-y-3">
            {chunkedDocument.chunks.map((chunk, index) => (
              <div key={chunk.id}>
                <div 
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                    selectedChunks.has(chunk.id) 
                      ? 'bg-primary/5 border-primary' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <Checkbox 
                    checked={selectedChunks.has(chunk.id)}
                    onChange={() => handleChunkToggle(chunk.id)}
                    onClick={() => handleChunkToggle(chunk.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        Chunk {chunk.id}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {chunk.wordCount} words
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewChunk(chunk);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>Chunk {chunk.id} Preview</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="h-96 w-full rounded-md border p-4">
                              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                {chunk.content}
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {chunk.content.substring(0, 300)}
                      {chunk.content.length > 300 ? '...' : ''}
                    </p>
                  </div>
                </div>
                {index < chunkedDocument.chunks.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="mt-6 space-y-4">
          <div className="border rounded-lg p-4 bg-muted/20">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Custom Rewrite Instructions
              </Label>
            </div>
            <Textarea
              placeholder="Describe exactly how you want the selected chunks to be rewritten. Be specific about style, content additions, structural changes, or any other modifications you want."
              className="resize-none"
              rows={4}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              disabled={generateMutation.isPending}
            />
            <div className="mt-2 text-xs text-muted-foreground">
              <p className="font-medium text-primary">These instructions will completely override default rewriting behavior.</p>
              <p className="mt-1">Be specific about exactly what you want. Examples:</p>
              <div className="mt-2 p-2 border rounded-md bg-background/50">
                <ul className="list-disc pl-5 space-y-1">
                  <li>"Rewrite in the style of Malcolm Gladwell with more concrete examples"</li>
                  <li>"Add economic data and statistics while maintaining academic tone"</li>
                  <li>"Transform into a Socratic dialogue between two experts"</li>
                  <li>"Make it more technical and add footnotes with additional context"</li>
                  <li>"Simplify for general audience and add analogies"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button 
            onClick={handleGenerate}
            disabled={selectedChunks.size === 0 || generateMutation.isPending}
            className="min-w-[180px]"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate from Selected
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}