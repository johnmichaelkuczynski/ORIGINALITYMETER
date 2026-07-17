import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PassageData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Gavel, BookOpen, Scale } from "lucide-react";
import ArgumentativeResults from "./ArgumentativeResults";

interface ArgumentativeAnalysisProps {
  passageA: PassageData;
  passageB: PassageData;
  onResults: (result: any) => void;
  onNewComparison: () => void;
}

interface EnhancedArgumentativeResult {
  singlePaperAnalysis?: {
    overallCogencyScore: number;
    cogencyLabel: string;
    argumentSummary: string;
    superiorReconstruction: string;
    coreParameters: any;
    overallJudgment: string;
  };
  comparativeAnalysis?: {
    winner: 'A' | 'B' | 'Tie';
    winnerScore: number;
    paperAScore: number;
    paperBScore: number;
    paperASummary: string;
    paperBSummary: string;
    paperASuperiorReconstruction: string;
    paperBSuperiorReconstruction: string;
    comparisonBreakdown: any;
    detailedComparison: string;
    reasoning: string;
  };
  reportContent: string;
}

export default function ArgumentativeAnalysis({
  passageA,
  passageB,
  onResults,
  onNewComparison
}: ArgumentativeAnalysisProps) {
  const [result, setResult] = useState<EnhancedArgumentativeResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cogencyMode, setCogencyMode] = useState<'single' | 'comparative'>('single');
  const { toast } = useToast();

  // Determine if we have content for both passages
  const hasBothPassages = passageA?.text?.trim() && passageB?.text?.trim();
  const isSingleMode = cogencyMode === 'single';

  const runCogencyAnalysis = async () => {
    if (isSingleMode && (!passageA?.text || !passageA.text.trim())) {
      toast({
        title: "Missing Input",
        description: "Please enter text for cogency analysis.",
        variant: "destructive",
      });
      return;
    }

    if (!isSingleMode && (!passageA?.text?.trim() || !passageB?.text?.trim())) {
      toast({
        title: "Missing Input", 
        description: "Please enter text for both documents to compare.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Use the enhanced cogency analysis functions
      const endpoint = "/api/analyze/argumentative";
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passageA,
          passageB: isSingleMode ? null : passageB,
          passageATitle: passageA.title || "Document A",
          passageBTitle: passageB.title || "Document B",
          isSingleMode,
          provider: "openai"
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        onResults(data);
        toast({
          title: "Cogency Test Complete",
          description: isSingleMode 
            ? "Single document cogency analysis completed" 
            : "Comparative cogency analysis completed",
        });
      } else {
        throw new Error("Analysis failed");
      }
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startNewAnalysis = () => {
    setResult(null);
    onNewComparison();
  };

  if (result) {
    return (
      <ArgumentativeResults
        result={result}
        isSingleMode={isSingleMode}
        passageATitle={passageA.title || "Document A"}
        passageBTitle={passageB.title || "Document B"}
      />
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Gavel className="h-6 w-6 text-blue-600" />
          <CardTitle className="text-2xl font-bold text-blue-800">
            Cogency Test
          </CardTitle>
        </div>
        <p className="text-sm text-blue-600">
          Test how well a document proves what it sets out to prove
        </p>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Mode Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Analysis Mode</h3>
          <RadioGroup
            value={cogencyMode}
            onValueChange={(value) => setCogencyMode(value as 'single' | 'comparative')}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
              cogencyMode === 'single' 
                ? "bg-blue-50 border-blue-300 shadow-md" 
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}>
              <RadioGroupItem value="single" id="single" />
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <Label htmlFor="single" className="font-medium cursor-pointer">
                  Single Document Analysis
                </Label>
              </div>
            </div>
            
            <div className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
              cogencyMode === 'comparative' 
                ? "bg-blue-50 border-blue-300 shadow-md" 
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}>
              <RadioGroupItem value="comparative" id="comparative" />
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-blue-600" />
                <Label htmlFor="comparative" className="font-medium cursor-pointer">
                  Comparative Analysis
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Analysis Description */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">
            {isSingleMode ? "Single Document Cogency Test" : "Comparative Cogency Analysis"}
          </h4>
          <p className="text-sm text-gray-600">
            {isSingleMode 
              ? "Evaluate how well a single document proves its claims using 7 core parameters: clarity of argument, inferential cohesion, conceptual precision, evidential support, counterargument handling, cognitive risk, and epistemic control."
              : "Compare two documents to determine which makes its case better. Each document is first analyzed individually using the same 7 parameters, then compared based on those consistent scores."
            }
          </p>
        </div>

        {/* Input Validation Messages */}
        {isSingleMode && !passageA.text.trim() && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Please enter text in Document A to run single document cogency analysis.
            </p>
          </div>
        )}

        {!isSingleMode && (!passageA.text.trim() || !passageB.text.trim()) && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Please enter text in both Document A and Document B to run comparative cogency analysis.
            </p>
          </div>
        )}

        {!isSingleMode && hasBothPassages && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              Ready to compare: "{passageA.title || "Document A"}" vs "{passageB.title || "Document B"}"
            </p>
          </div>
        )}

        {/* Run Analysis Button */}
        <div className="text-center">
          <Button
            onClick={runCogencyAnalysis}
            disabled={
              isAnalyzing || 
              (isSingleMode && !passageA.text.trim()) ||
              (!isSingleMode && (!passageA.text.trim() || !passageB.text.trim()))
            }
            size="lg"
            className="px-8 py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Running Cogency Test...
              </>
            ) : (
              <>
                <Gavel className="h-5 w-5 mr-2" />
                Run Cogency Test
              </>
            )}
          </Button>
          
          <p className="text-xs text-center text-gray-500 mt-2">
            Analysis typically takes 30-60 seconds
          </p>
        </div>
      </CardContent>
    </Card>
  );
}