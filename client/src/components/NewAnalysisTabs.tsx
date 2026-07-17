import { useState } from "react";
import { AnalysisResult, PassageData } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import FeedbackForm from "./FeedbackForm";

interface AnalysisTabsProps {
  result: AnalysisResult;
  setResult: (result: AnalysisResult) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  passageA: PassageData;
  passageB: PassageData;
  passageATitle: string;
  passageBTitle: string;
  isSinglePassageMode?: boolean;
}

export default function AnalysisTabs({
  result,
  setResult,
  activeTab,
  setActiveTab,
  passageA,
  passageB,
  passageATitle,
  passageBTitle,
  isSinglePassageMode = false,
}: AnalysisTabsProps) {
  const [emphasisOption, setEmphasisOption] = useState<'clarity' | 'novelty' | 'balanced'>('clarity');
  const tabs = [
    { id: "conceptual-lineage", label: "Conceptual Lineage" },
    { id: "semantic-distance", label: "Semantic Distance" },
    { id: "novelty-heatmap", label: "Novelty Heatmap" },
    { id: "derivative-index", label: "Derivative Index" },
    { id: "parasite-detection", label: "Parasite Detection" },
    { id: "coherence", label: "Coherence" },
  ];

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-6 py-4 text-center border-b-2 font-medium text-sm whitespace-nowrap min-w-max transition-colors ${
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-secondary-500 hover:text-secondary-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <CardContent className="p-6">
        {/* Coherence */}
        {activeTab === "coherence" && result.coherence && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-secondary-800 mb-2">Coherence Analysis</h3>
              <p className="text-secondary-600">
                {isSinglePassageMode
                  ? "Evaluating the logical and conceptual coherence of the passage, regardless of originality."
                  : "Evaluating the logical and conceptual coherence of each passage, regardless of originality."
                }
              </p>
            </div>
            
            {/* Quality Scores Section */}
            <div className="bg-gray-50 p-5 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-secondary-700">Passage Quality Assessment</h4>
                <div 
                  className="ml-1 text-gray-500 cursor-help"
                  title="This section shows three distinct measurements: Originality Score, Coherence Score, and an Aggregate Quality Score that combines both factors."
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                </div>
              </div>
              
              {/* Separate Scores Display */}
              <div className="flex flex-col p-4 border rounded-lg mb-3">
                <div className="grid grid-cols-1 gap-4 mb-4">
                  {/* Aggregate Score - Prominently displayed */}
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <h4 className="text-base font-medium text-secondary-700 mb-2">Aggregate Quality Score</h4>
                    
                    {/* Calculate aggregate - weighted to favor both originality and coherence */}
                    {(() => {
                      
                      // OVERRIDE: Direct implementation of the specified scoring formula
                      // Treat originalityScore as conceptualInnovation
                      const conceptualInnovation = originalityScore;
                      
                      // Get other scores with defaults if not provided
                      
                      // Coherence is already available from the parameter
                      
                      // Treat accuracy as insightDensity
                      
                      // Methodological novelty (using clarity as a proxy if available)
                        Math.min(10, (originalityScore * 0.6) + (depth * 0.4));
                      
                      // Final score using the mandated formula: 
                      // Conceptual Innovation (25%), Depth (25%), Coherence (20%), 
                      // Insight Density (15%), Methodological Novelty (15%)
                      const aggregateScore = (conceptualInnovation * 0.25) + 
                        (depth * 0.25) + 
                        (coherenceScore * 0.20) + 
                        (insightDensity * 0.15) + 
                        (methodologicalNovelty * 0.15);
                      
                      // Color based on score
                      const scoreColor = 
                        aggregateScore >= 8 ? 'text-green-600' : 
                        aggregateScore >= 6 ? 'text-blue-600' : 
                        aggregateScore >= 4 ? 'text-amber-600' : 'text-red-600';
                      
                      // Quality label
                      const qualityLabel = 
                        aggregateScore >= 8 ? 'Excellent' : 
                        aggregateScore >= 6 ? 'Good' : 
                        aggregateScore >= 4 ? 'Fair' : 'Poor';
                      
                      return (
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline">
                            <span className={`text-2xl font-bold ${scoreColor}`}>
                              {aggregateScore.toFixed(1)}
                            </span>
                            <span className="text-sm text-secondary-500 ml-1">/10</span>
                          </div>
                          <div className="flex items-center">
                            <span className={`font-medium px-2 py-1 rounded text-sm ${
                              aggregateScore >= 8 ? 'bg-green-100 text-green-800' : 
                              aggregateScore >= 6 ? 'bg-blue-100 text-blue-800' : 
                              aggregateScore >= 4 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {qualityLabel}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                    
                    <p className="text-xs text-secondary-600 mt-2">
                      This philosophical text score balances conceptual innovation (25%), depth (25%), coherence (20%), insight density (15%), and methodological novelty (15%).
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3 border-t pt-4">
                  <div>
                    <h5 className="text-sm font-medium text-secondary-700 mb-1">Originality Score</h5>
                    <div className="flex items-center justify-between">
                      </span>
                      <span className="text-xs text-secondary-500">
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-secondary-700 mb-1">Coherence Score</h5>
                    <div className="flex items-center justify-between">
                      </span>
                      <span className="text-xs text-secondary-500">
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-secondary-600 border-t pt-3">
                  <p>The scores above are components in the Aggregate Quality Score calculation. The scoring system is designed for philosophical and theoretical texts, emphasizing conceptual innovation and depth while properly valuing coherence, insight density, and methodological novelty.</p>
                </div>
              </div>
            </div>
            
            {/* Detailed Coherence Analysis Section */}
            <div className={`grid grid-cols-1 ${isSinglePassageMode ? "" : "md:grid-cols-2"} gap-8 mb-6`}>
              <div>
                <h4 className="font-medium text-secondary-700 mb-3">{passageATitle}</h4>
                <div className="bg-gray-50 p-5 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-secondary-700">Coherence Score</span>
                    <span className="text-sm font-semibold text-primary-700">
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium text-secondary-700 mb-2">Assessment</h5>
                      <p className="text-secondary-600 text-sm">
                        {result.coherence.passageA.assessment}
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-secondary-700 mb-2">Structural Strengths</h5>
                      <ul className="list-disc pl-5 text-secondary-600 text-sm space-y-1">
                        {result.coherence.passageA.strengths.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-secondary-700 mb-2">Coherence Weaknesses</h5>
                      <ul className="list-disc pl-5 text-secondary-600 text-sm space-y-1">
                        {result.coherence.passageA.weaknesses.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              {!isSinglePassageMode && (
                <div>
                  <h4 className="font-medium text-secondary-700 mb-3">{passageBTitle}</h4>
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-medium text-secondary-700">Coherence Score</span>
                      <span className="text-sm font-semibold text-primary-700">
                      </span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-medium text-secondary-700 mb-2">Assessment</h5>
                        <p className="text-secondary-600 text-sm">
                          {result.coherence.passageB.assessment}
                        </p>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium text-secondary-700 mb-2">Structural Strengths</h5>
                        <ul className="list-disc pl-5 text-secondary-600 text-sm space-y-1">
                          {result.coherence.passageB.strengths.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium text-secondary-700 mb-2">Coherence Weaknesses</h5>
                        <ul className="list-disc pl-5 text-secondary-600 text-sm space-y-1">
                          {result.coherence.passageB.weaknesses.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Feedback Form for Coherence */}
            <FeedbackForm
              category="coherence"
              categoryName="Coherence Analysis"
              result={result}
              passageA={passageA}
              passageB={passageB}
              isSinglePassageMode={isSinglePassageMode}
              onFeedbackProcessed={setResult}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}