import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AnalysisResult, PassageData } from "@/lib/types";
import PassageInput from "./PassageInput";
import CorpusComparisonInput from "./CorpusComparisonInput";
import AnalysisResults from "./AnalysisResults";
import ArgumentativeResults from "./ArgumentativeResults";
import ArgumentativeAnalysis from "./ArgumentativeAnalysis";
import NaturalLanguageGenerator from "./NaturalLanguageGenerator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ChatWithAI from "@/components/ChatWithAI";

interface SemanticAnalyzerProps {
  onSendToRewriter?: (text: string, title?: string) => void;
  onSendToHomework?: (text: string) => void;
}

export default function SemanticAnalyzer({ onSendToRewriter, onSendToHomework }: SemanticAnalyzerProps) {
  const { toast } = useToast();
  
  // Analysis modes
  type AnalysisType = "originality" | "cogency" | "intelligence" | "quality";
  type DocumentMode = "single" | "comparison";
  
  const [documentMode, setDocumentMode] = useState<DocumentMode>("single");
  const [analysisType, setAnalysisType] = useState<AnalysisType>("originality");
  
  // Parameter count selection (20/40/160)
  type ParameterCount = 20 | 40 | 160;
  const [parameterCount, setParameterCount] = useState<ParameterCount>(40);
  
  // Intelligence Protocol Selection (NEW vs OLD)
  type IntelligenceProtocol = "primary" | "legacy";
  const [intelligenceProtocol, setIntelligenceProtocol] = useState<IntelligenceProtocol>("primary");
  
  // Originality Protocol Selection (NEW vs OLD)
  type OriginalityProtocol = "primary" | "legacy";
  const [originalityProtocol, setOriginalityProtocol] = useState<OriginalityProtocol>("primary");
  
  // Overall Quality Protocol Selection (NEW vs OLD)
  type QualityProtocol = "primary" | "legacy";
  const [qualityProtocol, setQualityProtocol] = useState<QualityProtocol>("primary");
  
  // Legacy compatibility
  const analysisMode = documentMode === "single" ? 
    (analysisType === "originality" ? "single" : 
     analysisType === "cogency" ? "single-cogency" :
     analysisType === "intelligence" ? "intelligence" :
     "quality") :
    (analysisType === "originality" ? "comparison" :
     analysisType === "cogency" ? "argumentative" :
     analysisType === "intelligence" ? "intelligence" :
     "quality");
  const isSinglePassageMode = documentMode === "single";
  const isCorpusMode = false; // Removed
  const isGenerateMode = false; // Removed  
  const isArgumentativeMode = documentMode === "comparison" && analysisType === "cogency";
  const isSingleCogencyMode = documentMode === "single" && analysisType === "cogency";
  const isIntelligenceMode = analysisType === "intelligence";
  const isQualityMode = analysisType === "quality";
  
  // LLM Provider
  type LLMProvider = "deepseek" | "openai" | "anthropic" | "perplexity";
  const [provider, setProvider] = useState<LLMProvider>("openai");
  const [providerStatus, setProviderStatus] = useState<{
    deepseek: boolean;
    openai: boolean;
    anthropic: boolean;
    perplexity: boolean;
  }>({
    deepseek: true,
    openai: true,
    anthropic: false,
    perplexity: false
  });
  
  // Check which providers are available
  useEffect(() => {
    async function checkProviders() {
      try {
        const response = await fetch('/api/provider-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProviderStatus(data);
          
          // Only auto-switch if the current provider is not available AND user hasn't manually selected DeepSeek
          // This allows users to select DeepSeek even if API key is missing
          if (!data[provider] && provider !== 'deepseek') {
            if (data.openai) {
              setProvider('openai');
            } else if (data.anthropic) {
              setProvider('anthropic');
            } else if (data.perplexity) {
              setProvider('perplexity');
            }
          }
        }
      } catch (error) {
        console.error("Error checking provider status:", error);
      }
    }
    
    checkProviders();
  }, [provider]);
  
  // Passages input state
  const [passageA, setPassageA] = useState<PassageData>({
    title: "",
    text: "",
    userContext: ""
  });
  
  const [passageB, setPassageB] = useState<PassageData>({
    title: "",
    text: "",
    userContext: ""
  });
  
  // Reset passageB when switching to single mode
  useEffect(() => {
    if (documentMode === "single") {
      setPassageB({
        title: "",
        text: "",
        userContext: ""
      });
    }
  }, [documentMode]);
  
  // State for corpus comparison
  const [corpus, setCorpus] = useState<PassageData>({
    title: "Reference Corpus",
    text: "",
    userContext: ""
  });
  
  // Analysis results
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  // Single document cogency analysis mutation
  const singleCogencyMutation = useMutation({
    mutationFn: async () => {
      console.log("Analyzing single document cogency");
      const endpoint = '/api/analyze/argumentative';
      const payload = {
        passageA,
        passageB: null,
        passageATitle: passageA.title || "Document A",
        passageBTitle: null,
        isSingleMode: true,
        provider: "openai"
      };
      
      console.log("Single cogency request payload:", payload);
      const response = await apiRequest('POST', endpoint, payload);
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Single cogency analysis successful:", data);
      setAnalysisResult(data);
      setShowResults(true);
      
      // Scroll to the results
      setTimeout(() => {
        const resultsElement = document.getElementById('results-section');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    },
    onError: (error) => {
      console.error("Single cogency analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing your document. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Intelligence analysis mutation
  const intelligenceMutation = useMutation({
    mutationFn: async () => {
      console.log("Analyzing intelligence with provider:", provider, "protocol:", intelligenceProtocol);
      
      // Choose endpoint based on protocol selection
      const endpoint = intelligenceProtocol === "primary" 
        ? '/api/analyze/primary-intelligence'
        : '/api/analyze/intelligence';
      
      const payload = intelligenceProtocol === "primary"
        ? {
            passageA,
            provider
          }
        : {
            passageA,
            provider,
            parameterCount
          };
      
      console.log("Intelligence analysis request payload:", payload);
      const response = await apiRequest('POST', endpoint, payload);
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Intelligence analysis successful:", data);
      setAnalysisResult(data);
      setShowResults(true);
      
      // Scroll to the results
      setTimeout(() => {
        const resultsElement = document.getElementById('results-section');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    },
    onError: (error) => {
      console.error("Intelligence analysis error:", error);
      toast({
        title: "Intelligence Analysis Failed",
        description: "There was an error analyzing cognitive sophistication. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Quality analysis mutation
  const qualityMutation = useMutation({
    mutationFn: async () => {
      console.log("Analyzing quality with protocol:", qualityProtocol);
      
      // Choose endpoint based on protocol selection
      let endpoint = qualityProtocol === "primary" 
        ? '/api/analyze/primary-quality'
        : '/api/analyze/quality';
      
      let payload = qualityProtocol === "primary"
        ? {
            passageA,
            provider
          }
        : {
            passageA,
            provider,
            parameterCount
          };
      
      // Check if we have passageB for dual analysis (only for legacy protocol)
      if (qualityProtocol === "legacy" && passageB.text.trim() !== "") {
        endpoint = '/api/analyze/quality-dual';
        payload = {
          passageA,
          passageB,
          provider,
          parameterCount
        };
      }
      
      console.log("Quality request payload:", payload);
      const response = await apiRequest('POST', endpoint, payload);
      const result = await response.json();
      return result as AnalysisResult;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      setShowResults(true);
      
      // Scroll to the results
      setTimeout(() => {
        const resultsElement = document.getElementById('results-section');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    },
    onError: (error) => {
      console.error("Quality analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing your document quality. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Originality analysis mutation
  const originalityMutation = useMutation({
    mutationFn: async () => {
      console.log("Analyzing originality with protocol:", originalityProtocol);
      
      // Choose endpoint based on protocol selection
      let endpoint = originalityProtocol === "primary" 
        ? '/api/analyze/primary-originality'
        : '/api/analyze/originality';
      
      let payload = originalityProtocol === "primary"
        ? {
            passageA,
            provider
          }
        : {
            passageA,
            provider,
            parameterCount
          };
      
      // Check if we have passageB for dual analysis (only for legacy protocol)
      if (originalityProtocol === "legacy" && passageB.text.trim() !== "") {
        endpoint = '/api/analyze/originality-dual';
        payload = {
          passageA,
          passageB,
          provider,
          parameterCount
        };
      }
      
      console.log("Originality request payload:", payload);
      const response = await apiRequest('POST', endpoint, payload);
      const result = await response.json();
      return result as AnalysisResult;
    },
    onSuccess: (data) => {
      console.log("Originality analysis successful:", data);
      console.log("Data keys:", Object.keys(data));
      console.log("Sample entry:", data["0"]);
      setAnalysisResult(data);
      setShowResults(true);
      
      // Scroll to the results
      setTimeout(() => {
        const resultsElement = document.getElementById('results-section');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    },
    onError: (error) => {
      console.error("Originality analysis error:", error);
      toast({
        title: "Originality Analysis Failed",
        description: "There was an error analyzing originality. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Cogency analysis mutation
  const cogencyMutation = useMutation({
    mutationFn: async () => {
      console.log("Analyzing cogency");
      
      let endpoint = '/api/analyze/cogency';
      let payload = {
        passageA,
        provider,
        parameterCount
      };
      
      // Check if we have passageB for dual analysis
      if (passageB.text.trim() !== "") {
        endpoint = '/api/analyze/cogency-dual';
        payload = {
          passageA,
          passageB,
          provider,
          parameterCount
        };
      }
      
      console.log("Cogency request payload:", payload);
      const response = await apiRequest('POST', endpoint, payload);
      const result = await response.json();
      return result as AnalysisResult;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      setShowResults(true);
      
      // Scroll to the results
      setTimeout(() => {
        const resultsElement = document.getElementById('results-section');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    },
    onError: (error) => {
      console.error("Cogency analysis error:", error);
      toast({
        title: "Cogency Analysis Failed",
        description: "There was an error analyzing cogency. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async () => {
      console.log("Analyzing in mode:", analysisMode);
      let endpoint = '';
      let payload = {};
      
      if (analysisMode === "corpus") {
        endpoint = '/api/analyze/corpus';
        payload = {
          passage: passageA,
          corpus: corpus,
          provider
        };
      } else if (analysisMode === "single") {
        endpoint = '/api/analyze/single';
        payload = {
          passageA,
          provider
        };
      } else if (analysisMode === "intelligence" && passageB.text.trim() !== "") {
        endpoint = '/api/analyze/intelligence-dual';
        payload = {
          passageA,
          passageB,
          provider
        };
      } else if (analysisMode === "quality" && passageB.text.trim() !== "") {
        endpoint = '/api/analyze/quality';
        payload = {
          passageA,
          passageB,
          provider
        };
      } else {
        endpoint = '/api/analyze';
        payload = {
          passageA,
          passageB,
          provider
        };
      }
      
      console.log("Request payload:", payload);
      const response = await apiRequest('POST', endpoint, payload);
      const result = await response.json();
      return result as AnalysisResult;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      setShowResults(true);
      
      // Scroll to the results
      setTimeout(() => {
        const resultsElement = document.getElementById('results-section');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    },
    onError: (error) => {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing your passages. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handler for comparison
  const handleCompare = () => {
    // Validation
    if (passageA.text.trim() === '') {
      toast({
        title: "Error",
        description: "Please enter text for passage A.",
        variant: "destructive",
      });
      return;
    }
    
    if (analysisMode === "comparison" && passageB.text.trim() === '') {
      toast({
        title: "Error",
        description: "Please enter text for passage B.",
        variant: "destructive",
      });
      return;
    }
    
    if (analysisMode === "corpus" && corpus.text.trim() === '') {
      toast({
        title: "Error",
        description: "Please enter text for the reference corpus.",
        variant: "destructive",
      });
      return;
    }
    
    // For argumentative analysis mode, directly show results without API call
    if (analysisMode === "argumentative") {
      console.log("Starting argumentative analysis mode");
      setShowResults(true);
      // Scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }
    
    // For single document cogency mode, call the API directly
    if (analysisMode === "single-cogency") {
      console.log("Starting single document cogency analysis");
      singleCogencyMutation.mutate();
      return;
    }
    
    // For intelligence analysis mode, call the API directly
    if (analysisMode === "intelligence") {
      console.log("Starting intelligence analysis");
      if (passageB.text.trim() === "") {
        // Single document intelligence analysis
        intelligenceMutation.mutate();
      } else {
        // Dual document intelligence analysis
        analysisMutation.mutate();
      }
      return;
    }
    
    // For quality analysis mode, call the API directly
    if (analysisMode === "quality") {
      console.log("Starting quality analysis");
      qualityMutation.mutate();
      return;
    }
    
    // For originality analysis mode, call the API directly  
    if (analysisType === "originality") {
      console.log("Starting originality analysis");
      originalityMutation.mutate();
      return;
    }
    
    // For cogency analysis mode, call the API directly
    if (analysisType === "cogency") {
      console.log("Starting cogency analysis");
      cogencyMutation.mutate();
      return;
    }
    
    // Log analysis request for other modes
    console.log(`Analyzing in mode: ${analysisMode}`);
    console.log("Request payload:", {
      passageA: {
        title: passageA.title,
        text: passageA.text.substring(0, 50) + "..." // Log just the beginning for brevity
      },
      ...(analysisMode === "comparison" ? {
        passageB: {
          title: passageB.title,
          text: passageB.text.substring(0, 50) + "..."
        }
      } : {}),
      ...(analysisMode === "corpus" ? {
        corpus: {
          title: corpus.title,
          text: corpus.text.substring(0, 50) + "..."
        }
      } : {}),
      provider
    });
    
    // Perform analysis for other modes
    analysisMutation.mutate();
  };
  
  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleCompare();
    }
  };
  
  // Listen for events to analyze improved passages
  useEffect(() => {
    const handleImprovedPassage = (customEvent: any) => {
      if (customEvent.detail && customEvent.detail.passage) {
        // Make sure we have valid text content
        if (!customEvent.detail.passage.text || customEvent.detail.passage.text.trim() === '') {
          console.error("Received empty passage text for re-analysis");
          toast({
            title: "Error",
            description: "Cannot analyze empty text. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        // Set the passage data and enable single passage mode
        setAnalysisMode("single");
        setPassageA({
          ...customEvent.detail.passage,
          // Ensure we have a title even if empty
          title: customEvent.detail.passage.title || "Improved Passage"
        });
        
        // Log the passage being sent for analysis
        console.log("Re-analyzing passage:", {
          title: customEvent.detail.passage.title || "Improved Passage",
          textLength: customEvent.detail.passage.text?.length || 0
        });
        
        // Trigger analysis (with a slight delay to ensure state is updated)
        setTimeout(() => {
          handleCompare();
        }, 200);
      }
    };

    // Add event listener
    document.addEventListener('analyze-improved-passage', handleImprovedPassage);
    
    // Clean up
    return () => {
      document.removeEventListener('analyze-improved-passage', handleImprovedPassage);
    };
  }, [handleCompare]);

  return (
    <div className="flex flex-col space-y-6" onKeyDown={handleKeyDown}>
      {/* Originality Meter Description */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-bold text-green-800 mb-1">What is Originality Meter?</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Originality Meter is an AI-powered app that analyzes philosophical and scholarly writing for true conceptual originality—not just rewording or citation games. It evaluates your work based on semantic distance, lineage, parasite detection, and more. Stop wondering if your ideas are original. Measure them.
            </p>
          </div>
        </div>
      </div>
      
      {/* Analysis Mode Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="mb-2">
          <h3 className="text-base font-medium text-secondary-700">Select Analysis Mode</h3>
          <p className="text-sm text-secondary-500">Choose how you want to analyze your text</p>
        </div>
        
        {/* LLM Provider Selector */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          <div className="mb-2">
            <h4 className="text-sm font-medium text-secondary-700">AI Provider</h4>
            <p className="text-xs text-secondary-500">Select which AI model to use for analysis</p>
          </div>
          
          <RadioGroup
            value={provider}
            onValueChange={(value) => setProvider(value as LLMProvider)}
            className="grid grid-cols-1 md:grid-cols-4 gap-2"
          >
            <div className={`flex items-center space-x-2 rounded-md border p-2 ${provider === "anthropic" ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}`}>
              <RadioGroupItem value="anthropic" id="anthropic" />
              <Label htmlFor="anthropic" className="font-medium text-sm">
                Anthropic (Default)
              </Label>
            </div>
            
            <div className={`flex items-center space-x-2 rounded-md border p-2 ${provider === "deepseek" ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}`}>
              <RadioGroupItem value="deepseek" id="deepseek" />
              <Label htmlFor="deepseek" className="font-medium text-sm">
                DeepSeek
              </Label>
            </div>
            
            <div className={`flex items-center space-x-2 rounded-md border p-2 ${provider === "openai" ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}`}>
              <RadioGroupItem value="openai" id="openai" />
              <Label htmlFor="openai" className="font-medium text-sm">
                OpenAI (GPT-4o)
              </Label>
            </div>
            
            <div className={`flex items-center space-x-2 rounded-md border p-2 ${provider === "perplexity" ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}`}>
              <RadioGroupItem value="perplexity" id="perplexity" />
              <Label htmlFor="perplexity" className="font-medium text-sm">
                Perplexity
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Single Passage Column */}
          <div className="space-y-4">
            <div className="text-center pb-2 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-800">Single Passage</h4>
              <p className="text-sm text-gray-600">Analyze one document</p>
            </div>
            
            <RadioGroup
              value={documentMode === "single" ? analysisType : ""}
              onValueChange={(value) => {
                setDocumentMode("single");
                setAnalysisType(value as AnalysisType);
                if (showResults) {
                  setAnalysisResult(null);
                  setShowResults(false);
                }
              }}
              className="space-y-3"
            >
              <div className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                documentMode === "single" && analysisType === "originality" 
                  ? "bg-green-50 border-green-300 shadow-md" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <RadioGroupItem value="originality" id="single-originality" />
                <Label htmlFor="single-originality" className="font-medium cursor-pointer">
                  Originality
                </Label>
              </div>
              
              <div className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                documentMode === "single" && analysisType === "cogency" 
                  ? "bg-blue-50 border-blue-300 shadow-md" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <RadioGroupItem value="cogency" id="single-cogency" />
                <Label htmlFor="single-cogency" className="font-medium cursor-pointer">
                  Cogency
                </Label>
              </div>
              
              <div className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                documentMode === "single" && analysisType === "intelligence" 
                  ? "bg-purple-50 border-purple-300 shadow-md" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <RadioGroupItem value="intelligence" id="single-intelligence" />
                <Label htmlFor="single-intelligence" className="font-medium cursor-pointer">
                  Intelligence
                </Label>
              </div>
              
              <div className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                documentMode === "single" && analysisType === "quality" 
                  ? "bg-orange-50 border-orange-300 shadow-md" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <RadioGroupItem value="quality" id="single-quality" />
                <Label htmlFor="single-quality" className="font-medium cursor-pointer">
                  Overall Quality
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Compare Passages Column */}
          <div className="space-y-4">
            <div className="text-center pb-2 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-800">Compare Passages</h4>
              <p className="text-sm text-gray-600">Compare two documents</p>
            </div>
            
            <RadioGroup
              value={documentMode === "comparison" ? analysisType : ""}
              onValueChange={(value) => {
                setDocumentMode("comparison");
                setAnalysisType(value as AnalysisType);
                if (showResults) {
                  setAnalysisResult(null);
                  setShowResults(false);
                }
              }}
              className="space-y-3"
            >
              <div className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                documentMode === "comparison" && analysisType === "originality" 
                  ? "bg-green-50 border-green-300 shadow-md" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <RadioGroupItem value="originality" id="compare-originality" />
                <Label htmlFor="compare-originality" className="font-medium cursor-pointer">
                  Originality
                </Label>
              </div>
              
              <div className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                documentMode === "comparison" && analysisType === "cogency" 
                  ? "bg-blue-50 border-blue-300 shadow-md" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <RadioGroupItem value="cogency" id="compare-cogency" />
                <Label htmlFor="compare-cogency" className="font-medium cursor-pointer">
                  Cogency
                </Label>
              </div>
              
              <div className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                documentMode === "comparison" && analysisType === "intelligence" 
                  ? "bg-purple-50 border-purple-300 shadow-md" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <RadioGroupItem value="intelligence" id="compare-intelligence" />
                <Label htmlFor="compare-intelligence" className="font-medium cursor-pointer">
                  Intelligence
                </Label>
              </div>
              
              <div className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                documentMode === "comparison" && analysisType === "quality" 
                  ? "bg-orange-50 border-orange-300 shadow-md" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <RadioGroupItem value="quality" id="compare-quality" />
                <Label htmlFor="compare-quality" className="font-medium cursor-pointer">
                  Overall Quality
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        
        {/* Overall Quality Protocol Selection - Only show for Quality analysis */}
        {analysisType === "quality" && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="mb-3">
              <h4 className="text-sm font-medium text-purple-700 mb-1">Overall Quality Evaluation Protocol</h4>
              <p className="text-xs text-purple-500">Choose between the new primary protocol and legacy system</p>
            </div>
            
            <RadioGroup
              value={qualityProtocol}
              onValueChange={(value) => {
                setQualityProtocol(value as QualityProtocol);
                if (showResults) {
                  setAnalysisResult(null);
                  setShowResults(false);
                }
              }}
              className="grid grid-cols-2 gap-4"
            >
              <div className={`flex flex-col space-y-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                qualityProtocol === "primary" 
                  ? "bg-purple-50 border-purple-300 shadow-md" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="primary" id="quality-protocol-primary" />
                  <Label htmlFor="quality-protocol-primary" className="font-medium cursor-pointer text-sm">
                    🆕 Primary Protocol
                  </Label>
                </div>
                <p className="text-xs text-gray-600 ml-6">
                  Advanced question-based evaluation. Judges actual intellectual quality, not academic markers.
                </p>
              </div>
              
              <div className={`flex flex-col space-y-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                qualityProtocol === "legacy" 
                  ? "bg-orange-50 border-orange-300 shadow-md" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="legacy" id="quality-protocol-legacy" />
                  <Label htmlFor="quality-protocol-legacy" className="font-medium cursor-pointer text-sm">
                    📊 Legacy System
                  </Label>
                </div>
                <p className="text-xs text-gray-600 ml-6">
                  Parameter-based framework. May confuse academic markers with genuine insight (less reliable).
                </p>
              </div>
            </RadioGroup>
            
            <div className="mt-2 text-xs text-gray-500">
              {qualityProtocol === "primary" && "✅ Recommended: Evaluates authentic intellectual quality over surface markers"}
              {qualityProtocol === "legacy" && "⚠️ Legacy: Parameter-based system with known bias toward academic jargon"}
            </div>
          </div>
        )}
        
        {/* Parameter Count Selection - Only show for non-protocol analysis OR Legacy protocols */}
        {((analysisType !== "intelligence" && analysisType !== "originality" && analysisType !== "quality") || 
          (analysisType === "intelligence" && intelligenceProtocol === "legacy") ||
          (analysisType === "originality" && originalityProtocol === "legacy") ||
          (analysisType === "quality" && qualityProtocol === "legacy")) && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="mb-3">
              <h4 className="text-sm font-medium text-secondary-700 mb-1">
                {(analysisType === "intelligence" || analysisType === "originality" || analysisType === "quality") ? "Legacy Protocol - Analysis Depth" : "Analysis Depth"}
              </h4>
              <p className="text-xs text-secondary-500">
                {(analysisType === "intelligence" || analysisType === "originality" || analysisType === "quality")
                  ? "Choose how many legacy parameters to evaluate with" 
                  : "Choose how many parameters to evaluate with"
                }
              </p>
            </div>
          
          <RadioGroup
            value={parameterCount.toString()}
            onValueChange={(value) => {
              setParameterCount(parseInt(value) as ParameterCount);
              if (showResults) {
                setAnalysisResult(null);
                setShowResults(false);
              }
            }}
            className="grid grid-cols-3 gap-3"
          >
            <div className={`flex items-center justify-center space-x-2 rounded-lg border-2 p-3 cursor-pointer transition-all ${
              parameterCount === 20 
                ? "bg-blue-50 border-blue-300 shadow-md" 
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}>
              <RadioGroupItem value="20" id="params-20" />
              <Label htmlFor="params-20" className="font-medium cursor-pointer text-sm">
                20 Parameters
              </Label>
            </div>
            
            <div className={`flex items-center justify-center space-x-2 rounded-lg border-2 p-3 cursor-pointer transition-all ${
              parameterCount === 40 
                ? "bg-green-50 border-green-300 shadow-md" 
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}>
              <RadioGroupItem value="40" id="params-40" />
              <Label htmlFor="params-40" className="font-medium cursor-pointer text-sm">
                40 Parameters
              </Label>
            </div>
            
            <div className={`flex items-center justify-center space-x-2 rounded-lg border-2 p-3 cursor-pointer transition-all ${
              parameterCount === 160 
                ? "bg-purple-50 border-purple-300 shadow-md" 
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}>
              <RadioGroupItem value="160" id="params-160" />
              <Label htmlFor="params-160" className="font-medium cursor-pointer text-sm">
                160 Parameters
              </Label>
            </div>
            </RadioGroup>
            
            <div className="mt-2 text-xs text-gray-500">
              {parameterCount === 20 && "Focused analysis with core metrics only"}
              {parameterCount === 40 && "Standard analysis with comprehensive coverage (recommended)"}  
              {parameterCount === 160 && "Deep analysis with all 160 metrics (takes 1-2 minutes)"}
            </div>
          </div>
        )}
        
        {/* Intelligence Protocol Selection - Only show for Intelligence analysis */}
        {analysisType === "intelligence" && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="mb-3">
              <h4 className="text-sm font-medium text-purple-700 mb-1">Intelligence Evaluation Protocol</h4>
              <p className="text-xs text-purple-500">Choose between the new primary protocol and legacy system</p>
            </div>
            
            <RadioGroup
              value={intelligenceProtocol}
              onValueChange={(value) => {
                setIntelligenceProtocol(value as IntelligenceProtocol);
                if (showResults) {
                  setAnalysisResult(null);
                  setShowResults(false);
                }
              }}
              className="grid grid-cols-2 gap-4"
            >
              <div className={`flex flex-col space-y-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                intelligenceProtocol === "primary" 
                  ? "bg-green-50 border-green-300 shadow-md" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="primary" id="protocol-primary" />
                  <Label htmlFor="protocol-primary" className="font-medium cursor-pointer text-sm">
                    🆕 Primary Protocol
                  </Label>
                </div>
                <p className="text-xs text-gray-600 ml-6">
                  Advanced question-based evaluation. Focuses on insight, development, organization, and intellectual authenticity.
                </p>
              </div>
              
              <div className={`flex flex-col space-y-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                intelligenceProtocol === "legacy" 
                  ? "bg-orange-50 border-orange-300 shadow-md" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="legacy" id="protocol-legacy" />
                  <Label htmlFor="protocol-legacy" className="font-medium cursor-pointer text-sm">
                    📊 Legacy System
                  </Label>
                </div>
                <p className="text-xs text-gray-600 ml-6">
                  160-parameter framework. Uses compression, abstraction, and inference metrics (less reliable).
                </p>
              </div>
            </RadioGroup>
            
            <div className="mt-2 text-xs text-gray-500">
              {intelligenceProtocol === "primary" && "✅ Recommended: Uses sophisticated intelligence questions for better accuracy"}
              {intelligenceProtocol === "legacy" && "⚠️ Legacy: Parameter-based system with known accuracy issues"}
            </div>
          </div>
        )}
        
        {/* Originality Protocol Selection - Only show for Originality analysis */}
        {analysisType === "originality" && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="mb-3">
              <h4 className="text-sm font-medium text-green-700 mb-1">Originality Evaluation Protocol</h4>
              <p className="text-xs text-green-500">Choose between the new primary protocol and legacy system</p>
            </div>
            
            <RadioGroup
              value={originalityProtocol}
              onValueChange={(value) => {
                setOriginalityProtocol(value as OriginalityProtocol);
                if (showResults) {
                  setAnalysisResult(null);
                  setShowResults(false);
                }
              }}
              className="grid grid-cols-2 gap-4"
            >
              <div className={`flex flex-col space-y-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                originalityProtocol === "primary" 
                  ? "bg-green-50 border-green-300 shadow-md" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="primary" id="originality-protocol-primary" />
                  <Label htmlFor="originality-protocol-primary" className="font-medium cursor-pointer text-sm">
                    🆕 Primary Protocol
                  </Label>
                </div>
                <p className="text-xs text-gray-600 ml-6">
                  Advanced question-based evaluation. Judges fecund thinking, not historical novelty. Newton scores as highly original.
                </p>
              </div>
              
              <div className={`flex flex-col space-y-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                originalityProtocol === "legacy" 
                  ? "bg-orange-50 border-orange-300 shadow-md" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="legacy" id="originality-protocol-legacy" />
                  <Label htmlFor="originality-protocol-legacy" className="font-medium cursor-pointer text-sm">
                    📊 Legacy System
                  </Label>
                </div>
                <p className="text-xs text-gray-600 ml-6">
                  Parameter-based framework. May penalize historical work as "derivative" (less reliable).
                </p>
              </div>
            </RadioGroup>
            
            <div className="mt-2 text-xs text-gray-500">
              {originalityProtocol === "primary" && "✅ Recommended: Evaluates intellectual fertility, not historical precedence"}
              {originalityProtocol === "legacy" && "⚠️ Legacy: Parameter-based system with known bias against historical work"}
            </div>
          </div>
        )}
        
        <div className="mt-4 text-sm text-slate-600 bg-slate-50 p-4 rounded-lg">
          {documentMode === "single" && analysisType === "originality" && (
            <p><strong>Single Originality:</strong> {originalityProtocol === "primary" 
              ? "Evaluate intellectual fecundity using 9 sophisticated originality questions. Judges whether only a creative mind could produce this thinking."
              : "Analyze semantic innovation and conceptual novelty against general intellectual norms using parameter-based metrics."
            }</p>
          )}
          {documentMode === "comparison" && analysisType === "originality" && (
            <p><strong>Compare Originality:</strong> {originalityProtocol === "primary" 
              ? "Compare intellectual fecundity between two documents using the primary originality protocol."
              : "Compare two documents to see which is more original using parameter-based semantic metrics."
            }</p>
          )}
          {documentMode === "single" && analysisType === "quality" && (
            <p><strong>Single Quality:</strong> {qualityProtocol === "primary" 
              ? "Evaluate authentic intellectual quality using 20 sophisticated questions. Judges actual insight over academic markers."
              : "Analyze overall quality using parameter-based metrics for scholarly merit and conceptual compression."
            }</p>
          )}
          {documentMode === "comparison" && analysisType === "quality" && (
            <p><strong>Compare Quality:</strong> {qualityProtocol === "primary" 
              ? "Compare authentic intellectual quality between two documents using the primary quality protocol."
              : "Compare two documents to see which has higher overall quality using parameter-based metrics."
            }</p>
          )}
          {documentMode === "single" && analysisType === "cogency" && (
            <p><strong>Single Cogency:</strong> Test how well one document proves what it sets out to prove using 7 core logical parameters.</p>
          )}
          {documentMode === "comparison" && analysisType === "cogency" && (
            <p><strong>Compare Cogency:</strong> Test which document makes a more convincing case using consistent logical scoring.</p>
          )}
          {documentMode === "single" && analysisType === "intelligence" && (
            <p><strong>Single Intelligence:</strong> {intelligenceProtocol === "primary" 
              ? "Evaluate cognitive sophistication using 18 sophisticated intelligence questions covering insight, development, organization, and authenticity."
              : "Analyze cognitive sophistication across parameter-based metrics: compression capacity, inference architecture, friction tolerance."
            }</p>
          )}
          {documentMode === "comparison" && analysisType === "intelligence" && (
            <p><strong>Compare Intelligence:</strong> {intelligenceProtocol === "primary" 
              ? "Compare cognitive sophistication between two documents using the new primary intelligence protocol."
              : "Compare cognitive sophistication between two documents across parameter-based intelligence metrics."
            }</p>
          )}
          {documentMode === "single" && analysisType === "quality" && (
            <p><strong>Single Quality:</strong> Comprehensive quality analysis using 20 metrics: conceptual compression, epistemic friction, problem density.</p>
          )}
          {documentMode === "comparison" && analysisType === "quality" && (
            <p><strong>Compare Quality:</strong> Compare overall scholarly writing quality between two documents using 20 precise metrics.</p>
          )}
        </div>
      </div>
      
      {/* Input Section */}
      {false ? (
        <NaturalLanguageGenerator 
          onTextGenerated={(text, title) => {
            // Create a passage data object from the generated text
            const generatedPassage: PassageData = {
              title: title || "Generated Passage",
              text,
              userContext: ""
            };
            
            // Set the passage and switch to single analysis mode
            setPassageA(generatedPassage);
            
            // Allow user to see the text before analyzing
            toast({
              title: "Text Generated Successfully",
              description: "Your text has been generated. You can analyze it by clicking the 'Analyze Text' button.",
              variant: "default",
            });
          }}
          onAnalyzeGenerated={(passage) => {
            // Set the passage
            setPassageA(passage);
            
            // Switch to single analysis mode and trigger analysis
            setAnalysisMode("single");
            setTimeout(() => handleCompare(), 200);
          }}
        />
      ) : analysisMode === "corpus" ? (
        <CorpusComparisonInput
          passage={passageA}
          corpus={corpus}
          onPassageChange={setPassageA}
          onCorpusChange={setCorpus}
          disabled={analysisMutation.isPending}
        />
      ) : (
        <div className={`grid grid-cols-1 ${(analysisMode === "single" || analysisMode === "single-cogency") ? "" : "lg:grid-cols-2"} gap-6`}>
          <PassageInput
            passage={passageA}
            onChange={setPassageA}
            label={(analysisMode === "single") ? "" : "A"}
            disabled={analysisMutation.isPending}
            showUserContext={true}
          />
          
          {(analysisMode === "comparison" || analysisMode === "argumentative" || analysisMode === "intelligence") && (
            <PassageInput
              passage={passageB}
              onChange={setPassageB}
              label="B"
              disabled={analysisMutation.isPending}
              showUserContext={false}
            />
          )}
        </div>
      )}

      {/* Compare Button Card - More Prominent */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 shadow-lg border-2 border-green-100 overflow-hidden rounded-xl">
        <CardContent className="p-8 flex justify-center items-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-6">
              {(analysisMutation.isPending || singleCogencyMutation.isPending || intelligenceMutation.isPending || qualityMutation.isPending || originalityMutation.isPending || cogencyMutation.isPending) ? (
                <>
                  <h3 className="text-xl font-bold text-blue-800">Analyzing Document...</h3>
                  <p className="text-base text-blue-600 mt-2">
                    Please wait while we analyze your text. This may take 1-2 minutes.
                  </p>
                  <div className="mt-4 flex justify-center">
                    <div className="animate-pulse flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-green-800">Ready to Analyze?</h3>
                  <p className="text-base text-slate-600 mt-2">
                    {documentMode === "single" && analysisType === "originality" && "Click the button below to analyze the semantic originality of your passage"}
                    {documentMode === "comparison" && analysisType === "originality" && "Click the button below to compare the semantic originality of both passages"}
                    {documentMode === "single" && analysisType === "cogency" && "Click the button below to analyze the logical convincingness of your document"}
                    {documentMode === "comparison" && analysisType === "cogency" && "Click the button below to determine which paper makes its case better"}
                    {documentMode === "single" && analysisType === "intelligence" && "Click the button below to analyze the cognitive sophistication of your text"}
                    {documentMode === "comparison" && analysisType === "intelligence" && "Click the button below to compare the cognitive sophistication of both texts"}
                    {documentMode === "single" && analysisType === "quality" && "Click the button below to analyze the overall quality of your text"}
                    {documentMode === "comparison" && analysisType === "quality" && "Click the button below to compare the overall quality of both texts"}
                  </p>
                </>
              )}
            </div>
            
            <Button
              size="lg"
              onClick={handleCompare}
              disabled={
                analysisMutation.isPending || 
                singleCogencyMutation.isPending ||
                intelligenceMutation.isPending ||
                qualityMutation.isPending ||
                originalityMutation.isPending ||
                cogencyMutation.isPending ||
                !passageA.text.trim() || 
                ((analysisMode === "comparison" || analysisMode === "argumentative") && !passageB.text.trim()) ||
                (analysisMode === "corpus" && !corpus.text.trim())
              }
              className="w-full py-6 bg-green-600 hover:bg-green-700 text-white font-bold text-xl rounded-lg shadow-lg transition-all border-2 border-green-500 hover:border-green-600 cursor-pointer flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
                {analysisMode === "single" ? (
                  <>
                    <circle cx="12" cy="12" r="9" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="8" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </>
                ) : analysisMode === "corpus" ? (
                  <>
                    <rect x="2" y="4" width="9" height="16" rx="1" strokeWidth="2.5" />
                    <rect x="15" y="4" width="7" height="16" rx="1" strokeWidth="2.5" />
                    <line x1="11" y1="12" x2="15" y2="12" strokeWidth="2.5" />
                  </>
                ) : (
                  <>
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                  </>
                )}
              </svg>
              {(analysisMutation.isPending || singleCogencyMutation.isPending || intelligenceMutation.isPending || qualityMutation.isPending) ? "ANALYZING..." : "ANALYZE PASSAGE"}
              {(analysisMutation.isPending || singleCogencyMutation.isPending || intelligenceMutation.isPending || qualityMutation.isPending) && (
                <span className="ml-3 inline-block animate-spin">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                </span>
              )}
            </Button>
            
            <p className="text-xs text-center text-slate-500 mt-2">
              <span role="img" aria-label="tip">💡</span> Tip: You can also press Ctrl+Enter to analyze
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Results Section */}
      <div id="results-section">
        {showResults && analysisMode === "argumentative" && (
          <ArgumentativeAnalysis
            passageA={passageA}
            passageB={passageB}
            onResults={(result) => {
              // Handle the cogency test results here
              console.log("Cogency test results:", result);
            }}
            onNewComparison={() => setShowResults(false)}
          />
        )}
        
        {showResults && analysisResult && analysisMode === "single-cogency" && analysisResult.reportContent && (
          <ArgumentativeResults
            result={analysisResult as any}
            isSingleMode={true}
            passageATitle={passageA.title || "Document A"}
            passageBTitle=""
          />
        )}
        
        {showResults && analysisResult && analysisMode !== "argumentative" && analysisMode !== "single-cogency" && (
          <AnalysisResults 
            result={analysisResult}
            setResult={(newResult) => setAnalysisResult(newResult)}
            passageA={passageA}
            passageB={analysisMode === "comparison" ? passageB : {
              title: "",
              text: "",
              userContext: ""
            }}
            passageATitle={passageA.title || "Passage A"}
            passageBTitle={passageB.title || "Passage B"}
            onNewComparison={() => setShowResults(false)}
            isSinglePassageMode={analysisMode === "single"}
            onSendToRewriter={onSendToRewriter}
            onSendToHomework={onSendToHomework}
            analysisType={analysisType}
          />
        )}
      </div>

      {/* Chat with AI Section */}
      <ChatWithAI
        currentPassage={passageA.text ? passageA : undefined}
        analysisResult={analysisResult || undefined}
        onSendToInput={(text: string, title?: string) => {
          // Set the text as Passage A for analysis
          setPassageA({
            title: title || "Generated from Chat",
            text: text,
            userContext: ""
          });
          
          // Switch to single passage mode for generated content
          setAnalysisMode("single");
          
          // Clear any existing results
          setShowResults(false);
          setAnalysisResult(null);
          
          // Scroll to top to show the new input
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSendToRewriter={onSendToRewriter}
        onSendToHomework={onSendToHomework}
      />
    </div>
  );
}