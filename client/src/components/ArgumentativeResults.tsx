import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Gavel, Target, CheckCircle, TrendingUp, FileText, Award, Quote, Download } from "lucide-react";

interface CoreParameter {
  assessment: string;
  quotes: string[];
}

interface ArgumentativeResult {
  singlePaperAnalysis?: {
    overallCogencyScore: number;
    cogencyLabel: string;
    argumentSummary: string;
    superiorReconstruction: string;
    coreParameters: {
      inferentialStructure: CoreParameter;
      conceptualControl: CoreParameter;
      argumentativeIntegrity: CoreParameter;
      synthesisIntegration: CoreParameter;
    };
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
    comparisonBreakdown: {
      paperA: {
        inferentialStructure: number;
        conceptualControl: number;
        argumentativeIntegrity: number;
        synthesisIntegration: number;
      };
      paperB: {
        inferentialStructure: number;
        conceptualControl: number;
        argumentativeIntegrity: number;
        synthesisIntegration: number;
      };
    };
    detailedComparison: string;
    reasoning: string;
  };
  reportContent: string;
}

interface ArgumentativeResultsProps {
  result: ArgumentativeResult;
  isSingleMode: boolean;
  passageATitle: string;
  passageBTitle?: string;
}

// Helper function to get parameter labels
const getParameterLabel = (parameter: string) => {
  switch (parameter) {
    case 'inferentialStructure': return 'Inferential Structure';
    case 'conceptualControl': return 'Conceptual Control';
    case 'argumentativeIntegrity': return 'Argumentative Integrity';
    case 'synthesisIntegration': return 'Synthesis & Integration';
    default: return parameter;
  }
};

// Helper function to generate report content
const generateCogencyReportContent = (analysis: any, title: string, isSingleMode: boolean): string => {
  return `
COGENCY ANALYSIS REPORT
${isSingleMode ? 'Single Document Analysis' : 'Comparative Analysis'}
Document: ${title}
Generated: ${new Date().toLocaleDateString()}

OVERALL COGENCY SCORE: ${analysis.overallCogencyScore}/100
COGENCY LEVEL: ${analysis.cogencyLabel}

ARGUMENT SUMMARY:
${analysis.argumentSummary}

SUPERIOR RECONSTRUCTION:
${analysis.superiorReconstruction}

CORE PARAMETERS ANALYSIS:
${Object.entries(analysis.coreParameters).map(([key, param]: [string, any]) => `
${getParameterLabel(key)}:
Assessment: ${param.assessment}
Supporting Quotes: ${param.quotes.map((q: string) => `"${q}"`).join(', ')}
`).join('\n')}

OVERALL JUDGMENT:
${analysis.overallJudgment}
  `.trim();
};

// Helper function to download report
const downloadCogencyReport = (analysis: any, title: string, isSingleMode: boolean) => {
  const content = generateCogencyReportContent(analysis, title, isSingleMode);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cogency-analysis-${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function ArgumentativeResults({ 
  result, 
  isSingleMode, 
  passageATitle, 
  passageBTitle 
}: ArgumentativeResultsProps) {
  
  const getCogencyColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 80) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 70) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (score >= 60) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getParameterIcon = (parameter: string) => {
    switch (parameter) {
      case 'clarityOfArgument': return <FileText className="h-4 w-4" />;
      case 'inferentialCohesion': return <TrendingUp className="h-4 w-4" />;
      case 'conceptualPrecision': return <Target className="h-4 w-4" />;
      case 'evidentialSupport': return <CheckCircle className="h-4 w-4" />;
      case 'counterargumentHandling': return <Gavel className="h-4 w-4" />;
      case 'cognitiveRisk': return <Award className="h-4 w-4" />;
      case 'epistemicControl': return <Quote className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };



  if (isSingleMode && result.singlePaperAnalysis) {
    const analysis = result.singlePaperAnalysis;

    return (
      <div className="space-y-6">
        {/* Overall Score Card */}
        <Card className={`border-2 ${getCogencyColor(analysis.overallCogencyScore)}`}>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Gavel className="h-6 w-6" />
              Argumentative Strength Analysis
            </CardTitle>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{analysis.overallCogencyScore}/100</div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {analysis.cogencyLabel}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            onClick={() => downloadCogencyReport(analysis, passageATitle, isSingleMode)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Report
          </Button>
        </div>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="parameters">Core Parameters</TabsTrigger>
            <TabsTrigger value="reconstruction">Superior Version</TabsTrigger>
            <TabsTrigger value="judgment">Overall Judgment</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Argument Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {analysis.argumentSummary}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-4">
            {Object.entries(analysis.coreParameters).map(([key, param]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getParameterIcon(key)}
                      {getParameterLabel(key)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-sm">
                        Analyzed
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-700 leading-relaxed">
                    {param.assessment}
                  </p>
                  {param.quotes && param.quotes.length > 0 && (
                    <div className="border-l-4 border-blue-200 bg-blue-50 p-3 rounded-r">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-1">
                        <Quote className="h-4 w-4" />
                        Supporting Quotes:
                      </h4>
                      {param.quotes.map((quote, idx) => (
                        <blockquote key={idx} className="text-blue-700 italic mb-2 last:mb-0">
                          "{quote}"
                        </blockquote>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="reconstruction" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Superior Argument Reconstruction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {analysis.superiorReconstruction}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="judgment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Overall Judgment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {analysis.overallJudgment}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  if (!isSingleMode && result.comparativeAnalysis) {
    const comparison = result.comparativeAnalysis;

    return (
      <div className="space-y-6">
        {/* Winner Declaration */}
        <Card className={`border-2 ${getCogencyColor(comparison.winnerScore)}`}>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Award className="h-6 w-6" />
              Comparative Analysis Result
            </CardTitle>
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                Winner: Paper {comparison.winner}
              </div>
              <div className="text-lg text-gray-600 mb-2">
                Score: {comparison.winnerScore}/100
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                  <div className="font-medium">{passageATitle}</div>
                  <Badge variant="outline" className={getCogencyColor(comparison.paperAScore)}>
                    {comparison.paperAScore}/100
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="font-medium">{passageBTitle}</div>
                  <Badge variant="outline" className={getCogencyColor(comparison.paperBScore)}>
                    {comparison.paperBScore}/100
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="summaries" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summaries">Summaries</TabsTrigger>
            <TabsTrigger value="parameters">Parameter Comparison</TabsTrigger>
            <TabsTrigger value="reconstructions">Superior Versions</TabsTrigger>
            <TabsTrigger value="reasoning">Winner Justification</TabsTrigger>
          </TabsList>

          <TabsContent value="summaries" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Paper A: {passageATitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {comparison.paperASummary}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Paper B: {passageBTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {comparison.paperBSummary}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-4">
            {Object.keys(comparison.comparisonBreakdown.paperA).map((parameter) => {
              const scoreA = comparison.comparisonBreakdown.paperA[parameter as keyof typeof comparison.comparisonBreakdown.paperA];
              const scoreB = comparison.comparisonBreakdown.paperB[parameter as keyof typeof comparison.comparisonBreakdown.paperB];
              const winner = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'Tie';
              
              return (
                <Card key={parameter}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getParameterIcon(parameter)}
                        {getParameterLabel(parameter)}
                      </div>
                      <Badge variant="outline">
                        Winner: Paper {winner}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="font-medium mb-2">Paper A</div>
                        <div className="flex items-center gap-2">
                          <Progress value={scoreA} className="flex-1" />
                          <Badge variant="outline" className={getCogencyColor(scoreA)}>
                            {scoreA}/100
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium mb-2">Paper B</div>
                        <div className="flex items-center gap-2">
                          <Progress value={scoreB} className="flex-1" />
                          <Badge variant="outline" className={getCogencyColor(scoreB)}>
                            {scoreB}/100
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="reconstructions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Paper A: Enhanced Version</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {comparison.paperASuperiorReconstruction}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Paper B: Enhanced Version</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {comparison.paperBSuperiorReconstruction}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reasoning" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Detailed Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-4">
                  {comparison.detailedComparison}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Winner Justification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {comparison.reasoning}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-gray-500 text-center">No analysis results available.</p>
      </CardContent>
    </Card>
  );
}