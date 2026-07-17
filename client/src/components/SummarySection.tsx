import { AnalysisResult, StyleOption } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { generateReportFromData } from "@/lib/reportGenerator";

interface SummarySectionProps {
  result: AnalysisResult;
  passageATitle: string;
  passageBTitle: string;
  isSinglePassageMode?: boolean;
}

export default function SummarySection({
  result,
  passageATitle,
  passageBTitle,
  isSinglePassageMode = false,
}: SummarySectionProps) {
  const [verdictTone, setVerdictTone] = useState<StyleOption>('academic');
  
  // Calculate aggregate scores from 160-metric analysis
  const calculateAggregateScoreFromMetrics = (result: any): number => {
    const scores: number[] = [];
    
    // Collect all individual metric scores from the numbered keys (0-39)
    for (let i = 0; i < 40; i++) {
      const metricData = result[i.toString()];
      if (metricData) {
        if (metricData.score !== undefined) {
          // Single analysis format
          scores.push(metricData.score);
        } else if (metricData.passageA && metricData.passageA.score !== undefined) {
          // Dual analysis format - use passageA score
          scores.push(metricData.passageA.score);
        }
      }
    }
    
    // Calculate average of all metric scores
    if (scores.length === 0) return 0;
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average);
  };

  // Use new 160-metric scoring system
  const aggregateScoreA = calculateAggregateScoreFromMetrics(result);
  
  const aggregateScoreB = isSinglePassageMode ? 0 : (() => {
    const scores: number[] = [];
    
    // Collect passageB scores from dual analysis format
    for (let i = 0; i < 40; i++) {
      const metricData = (result as any)[i.toString()];
      if (metricData && metricData.passageB && metricData.passageB.score !== undefined) {
        scores.push(metricData.passageB.score);
      }
    }
    
    if (scores.length === 0) return 0;
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average);
  })();

  // Compare overall scores for dual analysis
  const moreOriginal = isSinglePassageMode ? null : 
    aggregateScoreA > aggregateScoreB ? 'A' : 
    aggregateScoreB > aggregateScoreA ? 'B' : null;

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-primary-50 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-primary-800">Summary</h2>
      </div>
      <CardContent className="p-6">
        {/* Author's Context Section - Display if provided */}
        {result.userContext && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-md font-semibold text-blue-800 mb-2">Author's Context for This Submission</h3>
            <p className="text-secondary-700 whitespace-pre-wrap">{result.userContext}</p>
          </div>
        )}
        
        {isSinglePassageMode ? (
          // Single Passage Mode - Show single passage with bell curve
          <div className="mb-6">
            {/* Aggregate Quality Score - Large and Prominent Display */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-5 mb-5 border border-primary-200 shadow-sm">
              <div className="flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold text-primary-800 mb-2">Overall Quality Score</h3>
                <div className="flex items-center justify-center">
                  <div className={`text-4xl font-bold ${
                    aggregateScoreA >= 85 ? 'text-green-600' : 
                    aggregateScoreA >= 70 ? 'text-green-500' : 
                    aggregateScoreA >= 50 ? 'text-amber-500' : 
                    'text-red-500'
                  }`}>
                    {aggregateScoreA}
                  </div>
                  <div className="text-xl text-secondary-500 ml-1">/100</div>
                </div>
                <div className="text-sm text-secondary-600 text-center mt-2">
                  Average of all 40 metric scores (0-100 scale)
                </div>
                
                {/* Score bar visualization */}
                <div className="w-full max-w-md mt-3">
                  <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full ${
                        aggregateScoreA >= 85 ? 'bg-green-600' : 
                        aggregateScoreA >= 70 ? 'bg-green-500' : 
                        aggregateScoreA >= 50 ? 'bg-amber-500' : 
                        'bg-red-500'
                      }`}
                      style={{ width: `${aggregateScoreA}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-secondary-500 mt-1">
                    <span>Poor</span>
                    <span>Average</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-secondary-800">{passageATitle}</h3>
                <span className="text-sm text-secondary-500">
                  Analysis Score: <span className="font-semibold">{aggregateScoreA}</span>/100
                </span>
              </div>
              
              {/* Score bar with proper visualization */}
              <div className="mt-4 mb-10 relative w-full">
                {/* Score bar container */}
                <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden mb-1">
                  {/* Gradient background to show scale */}
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-600"></div>
                  
                  {/* Actual score fill */}
                  <div 
                    className={`absolute top-0 left-0 h-full ${
                      aggregateScoreA >= 85 ? 'bg-green-600' : 
                      aggregateScoreA >= 70 ? 'bg-green-500' : 
                      aggregateScoreA >= 50 ? 'bg-amber-500' : 
                      'bg-red-500'
                    } transition-all flex items-center justify-end pr-2`}
                    style={{ width: `${aggregateScoreA}%` }}
                  >
                    <span className="text-white text-xs font-bold">
                      {aggregateScoreA}
                    </span>
                  </div>
                  
                  {/* Vertical markers for scale */}
                  <div className="absolute top-0 bottom-0 left-1/4 w-px bg-white bg-opacity-70"></div>
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white bg-opacity-70"></div>
                  <div className="absolute top-0 bottom-0 left-3/4 w-px bg-white bg-opacity-70"></div>
                  
                  {/* Score indicator marker */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-md" 
                    style={{ 
                      left: `${aggregateScoreA}%`,
                      zIndex: 5
                    }}
                  ></div>
                </div>
                
                {/* Score tooltip - positioned above the score marker */}
                <div 
                  className="absolute -top-6 bg-white px-2 py-1 text-xs font-semibold text-primary-700 border border-primary-200 rounded-lg shadow-sm"
                  style={{ 
                    left: `${aggregateScoreA}%`,
                    transform: 'translateX(-50%)',
                    zIndex: 10
                  }}
                  title="Score calculated from 40 individual metrics with direct quotations"
                >
                  {aggregateScoreA}/100
                </div>
                
                {/* Labels */}
                <div className="flex justify-between text-xs text-secondary-600 px-1 mt-1">
                  <div>Poor (0-30)</div>
                  <div>Average (50-70)</div>
                  <div>Good (70-85)</div>
                  <div>Excellent (85-100)</div>
                </div>
                
                {/* Tooltip explanation */}
                <div className="mt-3 text-xs text-secondary-500 bg-gray-50 p-2 rounded-md">
                  Score represents the average of 40 individual metrics, each evaluated with direct quotations and explanations. Higher scores indicate superior intellectual quality.
                </div>
              </div>
              
              {/* Component scores with visual bars */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-secondary-700 mb-3">Originality Component Scores</h4>
                <div className="space-y-3">
                  {result.derivativeIndex.passageA.components && Array.isArray(result.derivativeIndex.passageA.components) 
                    ? result.derivativeIndex.passageA.components.map((component, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div 
                            className="text-sm text-secondary-600 cursor-help"
                            title={`${component.name}: Evaluates how this passage introduces or reinvents concepts in its field`}
                          >
                            {component.name}
                          </div>
                          <span className={`text-sm font-medium ${
                            'text-red-500'
                          }`}>
                          </span>
                        </div>
                        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`absolute top-0 left-0 h-full ${
                              'bg-red-500'
                            }`}
                          ></div>
                        </div>
                      </div>
                    ))
                    : (
                      <div className="text-sm text-secondary-500 italic">
                        Component scores not available for this analysis
                      </div>
                    )
                  }
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Comparison Mode - Show both passages in separate boxes with clear labels
          <div className="space-y-6">
            {/* Aggregate Quality Score Comparison - Large Display */}
            <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-5 border border-primary-200 shadow-sm">
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold text-primary-800 mb-2 text-center">Overall Quality: Passage A</h3>
                  <div className="flex items-center justify-center">
                    <div className={`text-4xl font-bold ${
                      aggregateScoreA >= 8 ? 'text-green-600' : 
                      aggregateScoreA >= 6 ? 'text-green-500' : 
                      aggregateScoreA >= 4 ? 'text-amber-500' : 
                      'text-red-500'
                    }`}>
                      {aggregateScoreA.toFixed(1)}
                    </div>
                    <div className="text-xl text-secondary-500 ml-1">/10</div>
                  </div>
                  
                  {/* Score bar visualization */}
                  <div className="w-full mt-3">
                    <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`absolute top-0 left-0 h-full ${
                          aggregateScoreA >= 8 ? 'bg-green-600' : 
                          aggregateScoreA >= 6 ? 'bg-green-500' : 
                          aggregateScoreA >= 4 ? 'bg-amber-500' : 
                          'bg-red-500'
                        }`}
                        style={{ width: `${aggregateScoreA * 10}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-5 border border-primary-200 shadow-sm">
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold text-primary-800 mb-2 text-center">Overall Quality: Passage B</h3>
                  <div className="flex items-center justify-center">
                    <div className={`text-4xl font-bold ${
                      aggregateScoreB >= 8 ? 'text-green-600' : 
                      aggregateScoreB >= 6 ? 'text-green-500' : 
                      aggregateScoreB >= 4 ? 'text-amber-500' : 
                      'text-red-500'
                    }`}>
                      {aggregateScoreB.toFixed(1)}
                    </div>
                    <div className="text-xl text-secondary-500 ml-1">/10</div>
                  </div>
                  
                  {/* Score bar visualization */}
                  <div className="w-full mt-3">
                    <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`absolute top-0 left-0 h-full ${
                          aggregateScoreB >= 8 ? 'bg-green-600' : 
                          aggregateScoreB >= 6 ? 'bg-green-500' : 
                          aggregateScoreB >= 4 ? 'bg-amber-500' : 
                          'bg-red-500'
                        }`}
                        style={{ width: `${aggregateScoreB * 10}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-1 sm:col-span-2 text-xs text-center text-secondary-600">
                Prioritizes originality (40%) and depth (25%) over coherence (15%), accuracy (10%) and clarity (10%)
              </div>
            </div>
            
            {/* Box 1: Originality Comparison */}
            <div className="border rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-2 bg-green-50 border-b">
                <h3 className="font-medium text-green-800">Originality Comparison</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Passage A Originality */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-secondary-700">
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-grow h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`absolute top-0 left-0 h-full ${
                          'bg-red-500'
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Passage B Originality */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-secondary-700">
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-grow h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`absolute top-0 left-0 h-full ${
                          'bg-red-500'
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Winner Badge */}
                {moreOriginal && (
                  <div className="flex justify-end">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      Passage {moreOriginal} is more original
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            
            {/* Box 2: Coherence Comparison */}
            <div className="border rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-2 bg-blue-50 border-b">
                <h3 className="font-medium text-blue-800">Coherence Comparison</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Passage A Coherence */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-secondary-700">
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-grow h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`absolute top-0 left-0 h-full ${
                          'bg-red-500'
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Passage B Coherence */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-secondary-700">
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-grow h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`absolute top-0 left-0 h-full ${
                          'bg-red-500'
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Winner Badge */}
                {moreCoherent && (
                  <div className="flex justify-end">
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      Passage {moreCoherent} is more coherent
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            
            {/* Box 3: Accuracy Comparison */}
            {result.accuracy && (
              <div className="border rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-2 bg-indigo-50 border-b">
                  <h3 className="font-medium text-indigo-800">Accuracy Comparison</h3>
                </div>
                <div className="p-4 space-y-4">
                  {/* Passage A Accuracy */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-secondary-700">
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-grow h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`absolute top-0 left-0 h-full ${
                            'bg-red-500'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Passage B Accuracy */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-secondary-700">
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-grow h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`absolute top-0 left-0 h-full ${
                            'bg-red-500'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Winner Badge */}
                  {moreAccurate && (
                    <div className="flex justify-end">
                      <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                        Passage {moreAccurate} is more accurate
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Box 4: Depth Comparison */}
            {result.depth && (
              <div className="border rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-2 bg-amber-50 border-b">
                  <h3 className="font-medium text-amber-800">Depth Comparison</h3>
                </div>
                <div className="p-4 space-y-4">
                  {/* Passage A Depth */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-secondary-700">
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-grow h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`absolute top-0 left-0 h-full ${
                            'bg-red-500'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Passage B Depth */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-secondary-700">
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-grow h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`absolute top-0 left-0 h-full ${
                            'bg-red-500'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Winner Badge */}
                  {moreDepth && (
                    <div className="flex justify-end">
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                        Passage {moreDepth} has more depth
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Box 5: Clarity Comparison */}
            {result.clarity && (
              <div className="border rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-2 bg-teal-50 border-b">
                  <h3 className="font-medium text-teal-800">Clarity Comparison</h3>
                </div>
                <div className="p-4 space-y-4">
                  {/* Passage A Clarity */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-secondary-700">
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-grow h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`absolute top-0 left-0 h-full ${
                            'bg-red-500'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Passage B Clarity */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-secondary-700">
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-grow h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`absolute top-0 left-0 h-full ${
                            'bg-red-500'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Winner Badge */}
                  {moreClear && (
                    <div className="flex justify-end">
                      <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200">
                        Passage {moreClear} is clearer
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Box 3: Aggregate Evaluation */}
            <div className="border rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-2 bg-purple-50 border-b">
                <h3 className="font-medium text-purple-800">Overall Quality Assessment</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  {/* Passage A Composite */}
                  <div className="bg-white p-3 rounded border">
                    <h4 className="text-sm font-medium text-secondary-700 mb-2">
                      Passage A – Composite Score: {aggregateScoreA.toFixed(1)}/10
                    </h4>
                    <div className="flex items-center">
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mr-2">
                        <div 
                          className={`h-full ${
                            aggregateScoreA >= 7 ? 'bg-green-500' : 
                            aggregateScoreA >= 4 ? 'bg-amber-500' : 
                            'bg-red-500'
                          } transition-all`}
                          style={{ width: `${aggregateScoreA * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Passage B Composite */}
                  <div className="bg-white p-3 rounded border">
                    <h4 className="text-sm font-medium text-secondary-700 mb-2">
                      Passage B – Composite Score: {aggregateScoreB.toFixed(1)}/10
                    </h4>
                    <div className="flex items-center">
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mr-2">
                        <div 
                          className={`h-full ${
                            aggregateScoreB >= 7 ? 'bg-green-500' : 
                            aggregateScoreB >= 4 ? 'bg-amber-500' : 
                            'bg-red-500'
                          } transition-all`}
                          style={{ width: `${aggregateScoreB * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-secondary-600 mt-2 bg-gray-100 p-2 rounded">
                  <p>This score prioritizes conceptual innovation and philosophical rigor over polish and paragraph-level flow.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Comparison Verdict Section */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-secondary-800">
              {isSinglePassageMode ? "Analysis Summary" : "Comparison Verdict"}
            </h3>
            
            {!isSinglePassageMode && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-secondary-600">Tone:</span>
                <Select value={verdictTone} onValueChange={(value) => setVerdictTone(value as StyleOption)}>
                  <SelectTrigger className="w-[180px] h-8 text-sm">
                    <SelectValue placeholder="Select Tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic / Formal</SelectItem>
                    <SelectItem value="keep-voice">Clear & Plain-English</SelectItem>
                    <SelectItem value="punchy">Short & Punchy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            {!isSinglePassageMode && (
              <>
                {/* Header bar */}
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <h4 className="font-medium text-slate-800">Detailed Comparative Analysis</h4>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => {
                        const verdict = document.getElementById('verdict-content');
                        if (verdict) {
                          navigator.clipboard.writeText(verdict.innerText);
                        }
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      <span className="text-xs">Copy</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => generateReportFromData(result, passageATitle, passageBTitle, isSinglePassageMode)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      <span className="text-xs">Download</span>
                    </Button>
                  </div>
                </div>
                
                {/* Verdict content */}
                <div id="verdict-content" className="p-5 space-y-4">
                  {/* Originality */}
                  <div>
                    <h5 className="text-base font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">Originality</h5>
                    <p className="text-slate-700 leading-relaxed">
                      }`}
                      
                      }`}
                      
                      }`}
                    </p>
                  </div>
                  
                  {/* Coherence */}
                  <div>
                    <h5 className="text-base font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">Coherence</h5>
                    <p className="text-slate-700 leading-relaxed">
                      }`}
                      
                      }`}
                      
                      }`}
                    </p>
                  </div>
                  
                  {/* Overall Assessment */}
                  <div>
                    <h5 className="text-base font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">Overall Assessment</h5>
                    <p className="text-slate-700 leading-relaxed">
                      {verdictTone === 'academic' && `Considering both metrics, ${
                        aggregateScoreA > aggregateScoreB
                        : aggregateScoreB > aggregateScoreA
                        : `both passages demonstrate equivalent overall quality, each scoring ${aggregateScoreA.toFixed(1)}/10. However, they achieve this through different strengths: Passage ${moreOriginal || 'A'} excels in originality while Passage ${moreCoherent || 'B'} demonstrates superior coherence. This illustrates how equally valuable scholarship can emerge from different intellectual approaches.`
                      }`}
                      
                      {verdictTone === 'keep-voice' && `Looking at both originality and coherence together, ${
                        aggregateScoreA > aggregateScoreB
                        : aggregateScoreB > aggregateScoreA
                        : `both passages are equally strong overall, with identical scores of ${aggregateScoreA.toFixed(1)}/10. They just have different strengths - Passage ${moreOriginal || 'A'} is more original, while Passage ${moreCoherent || 'B'} is easier to follow. This shows there's more than one way to write effectively.`
                      }`}
                      
                      {verdictTone === 'punchy' && (
                        aggregateScoreA > aggregateScoreB
                        : aggregateScoreB > aggregateScoreA
                      )}
                    </p>
                  </div>
                  
                  {/* Optional additional verdict from API */}
                  {result.verdict && (
                    <div className="mt-6 pt-4 border-t border-slate-200">
                      <p className="text-slate-600 italic">{result.verdict}</p>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {isSinglePassageMode && (
              <div className="p-5">
                <p className="text-secondary-700">{result.verdict}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
