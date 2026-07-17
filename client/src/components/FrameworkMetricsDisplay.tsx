import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalysisResult } from "@/lib/types";
import MathRenderer from "./MathRenderer";

interface FrameworkMetricsDisplayProps {
  result: AnalysisResult;
  analysisType: "originality" | "cogency" | "intelligence" | "quality";
  isSinglePassageMode?: boolean;
}

export default function FrameworkMetricsDisplay({
  result,
  analysisType,
  isSinglePassageMode = false
}: FrameworkMetricsDisplayProps) {
  
  // Get the appropriate metrics based on analysis type - EXACT 80 metrics from the user's specification
  const getMetricsForFramework = (type: string) => {
    switch (type) {
      case "originality":
        return [
          'transformationalSynthesis', 'generativePower', 'disciplinaryRepositioning', 'conceptualReframing',
          'recursiveInnovation', 'unexpectedCrossPollination', 'epistemicReweighting', 'constraintInnovation',
          'ontologyRespecification', 'heuristicLeap', 'problemReIndexing', 'axiomaticInnovation',
          'moralPoliticalRecomputation', 'subtextExcavation', 'secondOrderInnovation', 'temporalInversion',
          'negativeSpaceManipulation', 'unnaturalPairing', 'disciplinaryHijack', 'ontoEpistemicFusion'
        ];
      case "intelligence":
        return [
          'compressionCapacity', 'multiLevelIntegration', 'inferenceArchitecture', 'constraintSatisfaction',
          'patternRecognition', 'abstractionControl', 'analogicalReasoning', 'causalModeling',
          'probabilisticReasoning', 'systemicThinking', 'metacognition', 'attentionalControl',
          'workingMemoryManagement', 'cognitiveFlexibility', 'executiveControl', 'strategicPlanning',
          'problemDecomposition', 'solutionSpace', 'cognitiveEfficiency', 'cognitiveProcessingSpeed'
        ];
      case "cogency":
        return [
          'argumentativeContinuity', 'errorResistance', 'specificityOfCommitment', 'provisionalityControl',
          'loadDistribution', 'errorAnticipation', 'epistemicParsimony', 'scopeClarity',
          'evidenceCalibration', 'redundancyAvoidance', 'conceptualInterlock', 'temporalStability',
          'distinctionAwareness', 'layeredPersuasiveness', 'signalDiscipline', 'causalAlignment',
          'counterexampleImmunity', 'intelligibilityOfObjection', 'dependenceHierarchyAwareness', 'contextBoundedInference'
        ];
      case "quality":
        return [
          'conceptualCompression', 'epistemicFriction', 'inferenceControl', 'asymmetryOfCognitiveLabor',
          'noveltyToBaselineRatio', 'internalDifferentiation', 'problemDensity', 'compressionAcrossLevels',
          'semanticSpecificity', 'explanatoryYield', 'metaCognitiveSignal', 'structuralIntegrity',
          'generativePotential', 'signalToRhetoricRatio', 'dialecticalEngagement', 'topologicalAwareness',
          'disambiguationSkill', 'crossDisciplinaryFluency', 'psychologicalRealism', 'intellectualRiskQuotient'
        ];
      default:
        return [];
    }
  };

  const formatMetricName = (metric: string) => {
    return metric.replace(/([A-Z])/g, ' $1')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();
  };

  const getScoreColor = (score: number) => {
    // Scores are already 0-100 population percentiles
    const normalizedScore = score;
    
    if (normalizedScore >= 85) return "bg-green-500";
    if (normalizedScore >= 70) return "bg-yellow-500";
    if (normalizedScore >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  // Handle the new numbered key format from the 160-metric analysis
  const rawData = result as any;
  const metrics = getMetricsForFramework(analysisType);

  console.log("FrameworkMetricsDisplay debug:", { 
    analysisType, 
    metrics,
    resultKeys: Object.keys(result),
    dataStructure: Object.keys(result).slice(0, 5), // Show first 5 keys
    sampleEntry: rawData["0"] ? rawData["0"] : "No entry at key 0"
  });

  // Check if we have the new numbered key structure (0, 1, 2, ...)
  const hasNumberedKeys = Object.keys(result).some(key => /^\d+$/.test(key));
  
  if (!hasNumberedKeys && Object.keys(result).length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            No {analysisType} analysis data available. Please run the analysis first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {hasNumberedKeys ? (
          // Handle new numbered key format (0-39)
          Array.from({ length: 40 }, (_, i) => {
            const metricData = rawData[i.toString()];
            if (!metricData) return null;

            // Check if this is dual analysis format with passageA/passageB structure
            const isDualFormat = metricData.passageA && metricData.passageB;

            if (isDualFormat) {
              // Handle dual document analysis format
              return (
                <Card key={i} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-semibold text-base">
                        {metricData.metric || `Metric ${i + 1}`}
                      </h4>
                    </div>

                    {/* Passage A Analysis */}
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium text-blue-900">Document A</h5>
                        {metricData.passageA.score !== undefined && (
                          <Badge 
                            className={`${getScoreColor(metricData.passageA.score)} text-white font-bold px-2 py-1 text-sm`}
                          >
                            {metricData.passageA.score}/100
                          </Badge>
                        )}
                      </div>
                      
                      {metricData.passageA.quotation && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-blue-800 mb-1">Direct Quotation:</p>
                          <blockquote className="bg-white p-2 border-l-2 border-blue-300 italic text-gray-800 text-sm">
                            "{metricData.passageA.quotation}"
                          </blockquote>
                        </div>
                      )}
                      
                      {metricData.passageA.explanation && (
                        <div>
                          <p className="text-xs font-medium text-blue-800 mb-1">Analysis:</p>
                          <p className="text-xs text-blue-700 leading-relaxed">
                            <MathRenderer text={metricData.passageA.explanation} />
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Passage B Analysis */}
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium text-green-900">Document B</h5>
                        {metricData.passageB.score !== undefined && (
                          <Badge 
                            className={`${getScoreColor(metricData.passageB.score)} text-white font-bold px-2 py-1 text-sm`}
                          >
                            {metricData.passageB.score}/100
                          </Badge>
                        )}
                      </div>
                      
                      {metricData.passageB.quotation && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-green-800 mb-1">Direct Quotation:</p>
                          <blockquote className="bg-white p-2 border-l-2 border-green-300 italic text-gray-800 text-sm">
                            "{metricData.passageB.quotation}"
                          </blockquote>
                        </div>
                      )}
                      
                      {metricData.passageB.explanation && (
                        <div>
                          <p className="text-xs font-medium text-green-800 mb-1">Analysis:</p>
                          <p className="text-xs text-green-700 leading-relaxed">
                            <MathRenderer text={metricData.passageB.explanation} />
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            } else {
              // Handle single document analysis format
              return (
                <Card key={i} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-base">
                        {metricData.metric || `Metric ${i + 1}`}
                      </h4>
                      {metricData.score !== undefined && (
                        <Badge 
                          className={`${getScoreColor(metricData.score)} text-white font-bold px-2 py-1 text-sm`}
                        >
                          {metricData.score}/100
                        </Badge>
                      )}
                    </div>
                    
                    {metricData.quotation && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Direct Quotation:</p>
                        <blockquote className="bg-gray-50 p-3 border-l-3 border-blue-300 italic text-gray-800">
                          "{metricData.quotation}"
                        </blockquote>
                      </div>
                    )}
                    
                    {metricData.explanation && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Analysis:</p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          <MathRenderer text={metricData.explanation} />
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            }
          })
        ) : (
          // Handle legacy format for backwards compatibility  
          metrics.map((metric) => {
            const metricData = (rawData as any)[metric];
            if (!metricData) return null;

            // Handle both structures: single document (flat) and dual document (nested)
            let passageAData, passageBData;
            
            if (analysisType === "quality") {
              // Quality analysis has direct structure with score, assessment, quote1, quote2
              if (isSinglePassageMode) {
                passageAData = {
                  assessment: metricData.assessment,
                  quotation1: metricData.quote1,
                  quotation2: metricData.quote2,
                  justification1: metricData.justification1,
                  justification2: metricData.justification2
                };
                passageBData = null;
              } else {
                // For dual mode, quality should have passageA/passageB structure
                passageAData = metricData.passageA;
                passageBData = metricData.passageB;
              }
            } else {
              // Other analysis types use the standard structure
              passageAData = metricData.passageA || (isSinglePassageMode ? metricData : null);
              passageBData = metricData.passageB;
            }

            return (
              <Card key={metric}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{formatMetricName(metric)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Passage A Data */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">Your Document</h4>
                    </div>
                    
                    {passageAData?.assessment && (
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">Assessment:</p>
                        <MathRenderer text={passageAData.assessment} className="text-sm" />
                      </div>
                    )}

                    {(passageAData?.quotation1 || passageAData?.quote1) && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">Supporting Quote 1:</p>
                        <div className="text-sm italic">
                          "<MathRenderer text={passageAData.quotation1 || passageAData.quote1} />"
                        </div>
                        {(passageAData.justification1 || passageAData.justification) && (
                          <div className="text-sm mt-1 text-muted-foreground">
                            <strong>Justification:</strong> <MathRenderer text={passageAData.justification1 || passageAData.justification} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}