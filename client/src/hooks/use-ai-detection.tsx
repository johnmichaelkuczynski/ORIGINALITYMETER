import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { AIDetectionResult } from '@/lib/types';

export function useAIDetection() {
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectionResults, setDetectionResults] = useState<Record<string, AIDetectionResult>>({});
  const { toast } = useToast();
  
  // Cache of text that's already been analyzed
  const detectionCache = useRef<Record<string, AIDetectionResult>>({});
  
  // Prevent multiple calls for the same text content
  const pendingDetections = useRef<Record<string, boolean>>({});
  
  // Debounce timer reference
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  
  const detectAIContent = useCallback(async (text: string, id: string): Promise<AIDetectionResult> => {
    // Clear any existing timers for this ID
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
    }
    
    // Return early if text is too short
    if (!text || text.trim().length < 100) {
      const result = {
        isAIGenerated: false,
        confidence: "Low" as const,
        details: "Text too short for reliable detection"
      };
      setDetectionResults(prev => ({ ...prev, [id]: result }));
      return result;
    }
    
    // Generate a text hash (simple version - first 100 chars)
    const textHash = text.trim().substring(0, 100);
    
    // If we already have a cached result for this exact text, return it
    if (detectionCache.current[textHash]) {
      const cachedResult = detectionCache.current[textHash];
      setDetectionResults(prev => ({ ...prev, [id]: cachedResult }));
      return cachedResult;
    }
    
    // If this text is already being processed, don't start another request
    if (pendingDetections.current[textHash]) {
      return {
        isAIGenerated: false,
        confidence: "Low" as const,
        details: "Detection in progress"
      };
    }

    // Set up debounce (500ms delay)
    return new Promise((resolve) => {
      debounceTimers.current[id] = setTimeout(async () => {
        try {
          // Mark this detection as pending
          pendingDetections.current[textHash] = true;
          setIsDetecting(true);
          
          // Make sure text is properly sent as a string
          console.log(`Sending text for AI detection, length: ${text.length} chars`);
          const response = await apiRequest('POST', '/api/detect-ai', { 
            text: text.trim() 
          });
          
          if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json() as AIDetectionResult;
          
          // Store in cache and results
          detectionCache.current[textHash] = data;
          setDetectionResults(prev => ({ ...prev, [id]: data }));
          resolve(data);
        } catch (error) {
          console.error("AI detection error:", error);
          const fallbackResult = {
            isAIGenerated: false,
            confidence: "Low" as const,
            details: "Detection failed"
          };
          setDetectionResults(prev => ({ ...prev, [id]: fallbackResult }));
          
          toast({
            title: "AI Detection Failed",
            description: "Could not determine AI content probability.",
            variant: "destructive",
          });
          
          resolve(fallbackResult);
        } finally {
          // Clean up
          setIsDetecting(false);
          delete pendingDetections.current[textHash];
          delete debounceTimers.current[id];
        }
      }, 500); // 500ms debounce
    });
  }, [toast]);

  const getDetectionResult = (id: string): AIDetectionResult | null => {
    return detectionResults[id] || null;
  };

  const clearDetectionResult = (id: string) => {
    setDetectionResults(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const clearAllDetectionResults = () => {
    setDetectionResults({});
  };

  return {
    detectAIContent,
    getDetectionResult,
    clearDetectionResult,
    clearAllDetectionResults,
    isDetecting,
    detectionResults
  };
}

// Make sure the hook is the default export
export default useAIDetection;