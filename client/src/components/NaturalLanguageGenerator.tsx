import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { AnalysisResult, PassageData } from '@/lib/types';
import { Loader2, Download, Sparkle, Copy, RefreshCcw, Lightbulb } from 'lucide-react';
import AIDetectionBadge from '@/components/AIDetectionBadge';
import useAIDetection from '@/hooks/use-ai-detection';
import { VoiceDictation } from '@/components/ui/voice-dictation';

interface NaturalLanguageGeneratorProps {
  onTextGenerated?: (text: string, title: string) => void;
  onAnalyzeGenerated?: (passage: PassageData) => void;
}

export default function NaturalLanguageGenerator({ 
  onTextGenerated,
  onAnalyzeGenerated
}: NaturalLanguageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // AI detection
  const { 
    detectAIContent,
    getDetectionResult,
    isDetecting
  } = useAIDetection();
  
  // Generate text ID for AI detection
  const generatedTextId = 'nlg-generated-text';

  // No preset examples

  // Parse natural language instructions into generation parameters
  const parseInstructions = (instructions: string) => {
    // Extraction patterns for different parameters
    const topicMatch = instructions.match(/about\\s+([^,.]+)/i);
    const lengthMatch = instructions.match(/(\\d+)\\s*(?:page|pages|word|words)/i);
    const authorMatches = instructions.match(/references?\\s+([^,.]+)/i) || 
                         instructions.match(/citing\\s+([^,.]+)/i);
    const conceptualDensityMatch = instructions.match(/(high|medium|low)\\s+conceptual\\s+density/i);
    const parasiteMatch = instructions.match(/(high|medium|low)\\s+(?:conceptual\\s+)?parasite/i);
    const originalityMatch = instructions.match(/(high|medium|low)\\s+originality/i);
    
    // Extract and normalize values
    const topic = topicMatch ? topicMatch[1].trim() : 'unspecified topic';
    const pageLength = lengthMatch ? parseInt(lengthMatch[1]) : 2;
    const wordCount = lengthMatch && instructions.includes('word') 
      ? parseInt(lengthMatch[1]) 
      : pageLength * 500; // Approx 500 words per page
    
    const authors = authorMatches ? authorMatches[1].trim() : '';
    
    const conceptualDensity = conceptualDensityMatch 
      ? conceptualDensityMatch[1].toLowerCase() 
      : 'medium';
    
    const parasiteLevel = parasiteMatch 
      ? parasiteMatch[1].toLowerCase() 
      : 'low';
    
    const originality = originalityMatch 
      ? originalityMatch[1].toLowerCase() 
      : 'high';
    
    // Create title from the topic
    const title = `Generated Text on ${topic.charAt(0).toUpperCase() + topic.slice(1)}`;
    
    return {
      topic,
      wordCount,
      authors,
      conceptualDensity,
      parasiteLevel,
      originality,
      title
    };
  };

  // Mutation for text generation
  const generateMutation = useMutation({
    mutationFn: async (instructions: string) => {
      setIsLoading(true);
      
      // Get the currently selected provider from localStorage or default to OpenAI
      const provider = localStorage.getItem('preferred-provider') || 'openai';
      
      const response = await apiRequest(
        'POST',
        '/api/generate-nl-text',
        {
          instructions,
          provider
        }
      );
      
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      // Check if we actually got text data back
      if (!data || !data.text) {
        toast({
          title: "Generation failed",
          description: "The AI provider couldn't generate text based on your instructions. Please try simplifying your request or using different terms.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      setGeneratedText(data.text);
      setGeneratedTitle(data.title || "Generated Text");
      
      // Detect AI content in the generated text
      if (data.text && data.text.length > 100) {
        detectAIContent(data.text, generatedTextId);
      }
      
      if (onTextGenerated) {
        onTextGenerated(data.text, data.title);
      }
      
      toast({
        title: "Text generated successfully",
        description: "Your custom text has been created based on your instructions.",
      });
      
      setIsLoading(false);
    },
    onError: (error) => {
      console.error("Text generation failed:", error);
      toast({
        title: "Generation failed",
        description: "There was a problem generating your text. Please try again with different instructions.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  });

  // Handle form submission
  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Instructions required",
        description: "Please provide instructions for text generation.",
        variant: "destructive",
      });
      return;
    }
    
    generateMutation.mutate(prompt);
  };

  // Removed example prompt functionality

  // Handle analyzing the generated text
  const handleAnalyze = () => {
    if (!generatedText.trim()) {
      toast({
        title: "No text to analyze",
        description: "Please generate text first before analyzing.",
        variant: "destructive",
      });
      return;
    }
    
    if (onAnalyzeGenerated) {
      const passage: PassageData = {
        title: generatedTitle,
        text: generatedText
      };
      
      onAnalyzeGenerated(passage);
      
      toast({
        title: "Analyzing generated text",
        description: "The originality analysis has been started.",
      });
    }
  };

  // Handle copying to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    toast({
      title: "Copied to clipboard",
      description: "The generated text has been copied to your clipboard.",
    });
  };

  // Handle downloading the generated text
  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${generatedTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Text Generator
          </CardTitle>
          <CardDescription>
            Use natural language instructions to generate highly original text with specific parameters
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">
              Your Instructions
            </label>
            <Textarea
              placeholder="Example: Generate a highly original 2-page essay about the philosophy of consciousness that references Chalmers and Dennett and has high conceptual density."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] resize-y"
              disabled={isLoading}
            />
            <div className="flex gap-2 mt-2">
              <VoiceDictation
                onTranscriptionComplete={(text) => {
                  const updatedPrompt = prompt 
                    ? prompt.trim() + (prompt.endsWith('.') ? ' ' : '. ') + text
                    : text;
                  setPrompt(updatedPrompt);
                  toast({
                    title: "Voice instructions added",
                    description: "Your dictated instructions have been added.",
                  });
                }}
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Specify topic, length (pages or words), authors to reference, conceptual density level, 
              parasite index level, and originality level.
            </p>
          </div>
          

          
          <div className="pt-2">
            <Button 
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkle className="mr-2 h-4 w-4" />
                  Generate Custom Text
                </>
              )}
            </Button>
          </div>
          
          {generatedText && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{generatedTitle}</h3>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAnalyze}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Analyze Originality
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownload}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end mb-1">
                <AIDetectionBadge 
                  result={getDetectionResult(generatedTextId)} 
                  isDetecting={isDetecting} 
                  textId={generatedTextId}
                  onDetect={() => detectAIContent(generatedText, generatedTextId)}
                />
              </div>
              
              <div className="border rounded-md p-4 bg-muted/30 text-sm whitespace-pre-wrap">
                {generatedText}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}