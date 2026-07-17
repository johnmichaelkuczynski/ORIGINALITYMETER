import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PassageData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Brain, Users, Target, TrendingUp, Shield, AlertTriangle, BookOpen, Zap } from "lucide-react";

const ProgressBar = ({ value, className = "" }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-blue-600 h-2 rounded-full" 
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    ></div>
  </div>
);

interface ComparisonVector {
  contentSimilarity: {
    lexicalOverlap: number;
    conceptualParaphraseOverlap: number;
    argumentStructureMatching: number;
  };
  stylisticSimilarity: {
    sentenceRhythm: number;
    rhetoricalDevicePatterning: number;
    toneRegister: number;
  };
  epistemicProfileSimilarity: {
    compressionDegree: number;
    abstractionLevel: number;
    inferentialChainComplexity: number;
    frictionLevel: number;
  };
  narrativeTopicalSimilarity: {
    subjectMatterOverlap: number;
    illustrativeStructure: number;
    sharedReferencePoints: number;
  };
}

interface RipOffRisk {
  label: string;
  explanation: string;
  matchingSections?: string[];
}

interface DevelopmentRelationship {
  direction: string;
  description: string;
}

interface DoctrinalAffinity {
  classification: string;
  justification: string;
  contentAgreement: number;
  methodologicalSimilarity: number;
}

interface AuthorProfile {
  intellectualInterests: string[];
  intellectualStrengths: string[];
  cognitiveWeaknesses: string[];
  emotionalSignatures: string[];
  personalAgenda: string;
}

interface ComparativeProfile {
  sharedTraits: string[];
  conflictingTraits: string[];
  authoralStance: string;
}

interface EnhancedComparisonResult {
  overallSimilarityScore: number;
  ripOffRisk: RipOffRisk;
  developmentRelationship: DevelopmentRelationship;
  doctrinalAffinity: DoctrinalAffinity;
  authorProfiles: {
    textA: AuthorProfile;
    textB: AuthorProfile;
  };
  comparativeProfile: ComparativeProfile;
  comparisonVectors: ComparisonVector;
  detailedAnalysis: string;
}

interface EnhancedComparisonProps {
  passageA: PassageData;
  passageB: PassageData;
  passageATitle: string;
  passageBTitle: string;
}

export default function EnhancedComparison({
  passageA,
  passageB,
  passageATitle,
  passageBTitle
}: EnhancedComparisonProps) {
  const [result, setResult] = useState<EnhancedComparisonResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const runEnhancedComparison = async () => {
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/analyze/enhanced-comparison', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          textA: passageA,
          textB: passageB
        }),
      });

      if (!response.ok) {
        throw new Error('Enhanced comparison failed');
      }

      const data = await response.json();
      setResult(data);
      
      toast({
        title: 'Enhanced Analysis Complete',
        description: 'Multi-dimensional comparison analysis finished successfully.',
      });
    } catch (error) {
      console.error('Error in enhanced comparison:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Unable to complete enhanced comparison. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-blue-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

    if (score <= 30) return 'bg-green-100 text-green-800';
    if (score <= 60) return 'bg-yellow-100 text-yellow-800';
    if (score <= 85) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getAffinityColor = (classification: string) => {
    if (classification.includes('kindred')) return 'bg-green-100 text-green-800';
    if (classification.includes('opposed')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (!result) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Enhanced Multi-Dimensional Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Run comprehensive multi-dimensional analysis including content similarity, stylistic patterns, 
              epistemic profiles, author psychology, and doctrinal relationships.
            </p>
            <Button 
              onClick={runEnhancedComparison}
              disabled={isAnalyzing}
              className="gap-2"
            >
              <Zap className="h-4 w-4" />
              {isAnalyzing ? 'Analyzing...' : 'Run Enhanced Analysis'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Enhanced Multi-Dimensional Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="vectors">Vectors</TabsTrigger>
              <TabsTrigger value="ripoff">Rip-Off Risk</TabsTrigger>
              <TabsTrigger value="development">Development</TabsTrigger>
              <TabsTrigger value="doctrine">Doctrine</TabsTrigger>
              <TabsTrigger value="psychology">Psychology</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Overall Similarity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(result.overallSimilarityScore / 10)}`}>
                        {result.overallSimilarityScore}%
                      </div>
                      <ProgressBar value={result.overallSimilarityScore} className="mt-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Rip-Off Risk
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                        {result.ripOffRisk.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Development Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {result.developmentRelationship.direction}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Detailed Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{result.detailedAnalysis}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vectors" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Content Similarity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Lexical Overlap</span>
                      <span className={`font-semibold ${getScoreColor(result.comparisonVectors.contentSimilarity.lexicalOverlap)}`}>
                        {result.comparisonVectors.contentSimilarity.lexicalOverlap}/10
                      </span>
                    </div>
                    <ProgressBar value={result.comparisonVectors.contentSimilarity.lexicalOverlap * 10} />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Conceptual Paraphrase</span>
                      <span className={`font-semibold ${getScoreColor(result.comparisonVectors.contentSimilarity.conceptualParaphraseOverlap)}`}>
                        {result.comparisonVectors.contentSimilarity.conceptualParaphraseOverlap}/10
                      </span>
                    </div>
                    <ProgressBar value={result.comparisonVectors.contentSimilarity.conceptualParaphraseOverlap * 10} />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Argument Structure</span>
                      <span className={`font-semibold ${getScoreColor(result.comparisonVectors.contentSimilarity.argumentStructureMatching)}`}>
                        {result.comparisonVectors.contentSimilarity.argumentStructureMatching}/10
                      </span>
                    </div>
                    <Progress value={result.comparisonVectors.contentSimilarity.argumentStructureMatching * 10} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Stylistic Similarity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Sentence Rhythm</span>
                      <span className={`font-semibold ${getScoreColor(result.comparisonVectors.stylisticSimilarity.sentenceRhythm)}`}>
                        {result.comparisonVectors.stylisticSimilarity.sentenceRhythm}/10
                      </span>
                    </div>
                    <Progress value={result.comparisonVectors.stylisticSimilarity.sentenceRhythm * 10} />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Rhetorical Devices</span>
                      <span className={`font-semibold ${getScoreColor(result.comparisonVectors.stylisticSimilarity.rhetoricalDevicePatterning)}`}>
                        {result.comparisonVectors.stylisticSimilarity.rhetoricalDevicePatterning}/10
                      </span>
                    </div>
                    <Progress value={result.comparisonVectors.stylisticSimilarity.rhetoricalDevicePatterning * 10} />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tone & Register</span>
                      <span className={`font-semibold ${getScoreColor(result.comparisonVectors.stylisticSimilarity.toneRegister)}`}>
                        {result.comparisonVectors.stylisticSimilarity.toneRegister}/10
                      </span>
                    </div>
                    <Progress value={result.comparisonVectors.stylisticSimilarity.toneRegister * 10} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Epistemic Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Compression Degree</span>
                      <span className={`font-semibold ${getScoreColor(result.comparisonVectors.epistemicProfileSimilarity.compressionDegree)}`}>
                        {result.comparisonVectors.epistemicProfileSimilarity.compressionDegree}/10
                      </span>
                    </div>
                    <Progress value={result.comparisonVectors.epistemicProfileSimilarity.compressionDegree * 10} />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Abstraction Level</span>
                      <span className={`font-semibold ${getScoreColor(result.comparisonVectors.epistemicProfileSimilarity.abstractionLevel)}`}>
                        {result.comparisonVectors.epistemicProfileSimilarity.abstractionLevel}/10
                      </span>
                    </div>
                    <Progress value={result.comparisonVectors.epistemicProfileSimilarity.abstractionLevel * 10} />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Inferential Complexity</span>
                      <span className={`font-semibold ${getScoreColor(result.comparisonVectors.epistemicProfileSimilarity.inferentialChainComplexity)}`}>
                        {result.comparisonVectors.epistemicProfileSimilarity.inferentialChainComplexity}/10
                      </span>
                    </div>
                    <Progress value={result.comparisonVectors.epistemicProfileSimilarity.inferentialChainComplexity * 10} />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Friction Level</span>
                      <span className={`font-semibold ${getScoreColor(result.comparisonVectors.epistemicProfileSimilarity.frictionLevel)}`}>
                        {result.comparisonVectors.epistemicProfileSimilarity.frictionLevel}/10
                      </span>
                    </div>
                    <Progress value={result.comparisonVectors.epistemicProfileSimilarity.frictionLevel * 10} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Narrative & Topical</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Subject Matter</span>
                      <span className={`font-semibold ${getScoreColor(result.comparisonVectors.narrativeTopicalSimilarity.subjectMatterOverlap)}`}>
                        {result.comparisonVectors.narrativeTopicalSimilarity.subjectMatterOverlap}/10
                      </span>
                    </div>
                    <Progress value={result.comparisonVectors.narrativeTopicalSimilarity.subjectMatterOverlap * 10} />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Illustrative Structure</span>
                      <span className={`font-semibold ${getScoreColor(result.comparisonVectors.narrativeTopicalSimilarity.illustrativeStructure)}`}>
                        {result.comparisonVectors.narrativeTopicalSimilarity.illustrativeStructure}/10
                      </span>
                    </div>
                    <Progress value={result.comparisonVectors.narrativeTopicalSimilarity.illustrativeStructure * 10} />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Reference Points</span>
                      <span className={`font-semibold ${getScoreColor(result.comparisonVectors.narrativeTopicalSimilarity.sharedReferencePoints)}`}>
                        {result.comparisonVectors.narrativeTopicalSimilarity.sharedReferencePoints}/10
                      </span>
                    </div>
                    <Progress value={result.comparisonVectors.narrativeTopicalSimilarity.sharedReferencePoints * 10} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ripoff" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Rip-Off Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                        {result.ripOffRisk.label}
                      </Badge>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm leading-relaxed">{result.ripOffRisk.explanation}</p>
                    </div>
                    
                    {result.ripOffRisk.matchingSections && result.ripOffRisk.matchingSections.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Matching Sections:</h4>
                        <div className="space-y-2">
                          {result.ripOffRisk.matchingSections.map((section, index) => (
                            <div key={index} className="p-2 bg-yellow-50 border-l-4 border-yellow-400 text-sm">
                              {section}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="development" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Development Relationship
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      </div>
                      <Badge variant="outline" className="mt-2">
                        {result.developmentRelationship.direction}
                      </Badge>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm leading-relaxed">{result.developmentRelationship.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="doctrine" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Doctrinal Affinity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <Badge className={`${getAffinityColor(result.doctrinalAffinity.classification)} text-lg px-4 py-2`}>
                        {result.doctrinalAffinity.classification}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Content Agreement</label>
                        <div className={`text-xl font-semibold ${getScoreColor(result.doctrinalAffinity.contentAgreement)}`}>
                          {result.doctrinalAffinity.contentAgreement}/10
                        </div>
                        <Progress value={result.doctrinalAffinity.contentAgreement * 10} className="mt-1" />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Methodological Similarity</label>
                        <div className={`text-xl font-semibold ${getScoreColor(result.doctrinalAffinity.methodologicalSimilarity)}`}>
                          {result.doctrinalAffinity.methodologicalSimilarity}/10
                        </div>
                        <Progress value={result.doctrinalAffinity.methodologicalSimilarity * 10} className="mt-1" />
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm leading-relaxed">{result.doctrinalAffinity.justification}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="psychology" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {passageATitle || "Text A"} Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Intellectual Interests</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.authorProfiles.textA.intellectualInterests.map((interest, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Intellectual Strengths</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.authorProfiles.textA.intellectualStrengths.map((strength, index) => (
                          <Badge key={index} variant="default" className="text-xs">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Cognitive Weaknesses</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.authorProfiles.textA.cognitiveWeaknesses.map((weakness, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {weakness}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Emotional Signatures</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.authorProfiles.textA.emotionalSignatures.map((signature, index) => (
                          <Badge key={index} className="bg-purple-100 text-purple-800 text-xs">
                            {signature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Personal Agenda</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                        {result.authorProfiles.textA.personalAgenda}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {passageBTitle || "Text B"} Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Intellectual Interests</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.authorProfiles.textB.intellectualInterests.map((interest, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Intellectual Strengths</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.authorProfiles.textB.intellectualStrengths.map((strength, index) => (
                          <Badge key={index} variant="default" className="text-xs">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Cognitive Weaknesses</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.authorProfiles.textB.cognitiveWeaknesses.map((weakness, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {weakness}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Emotional Signatures</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.authorProfiles.textB.emotionalSignatures.map((signature, index) => (
                          <Badge key={index} className="bg-purple-100 text-purple-800 text-xs">
                            {signature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Personal Agenda</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                        {result.authorProfiles.textB.personalAgenda}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Comparative Psychology</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Shared Traits</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.comparativeProfile.sharedTraits.map((trait, index) => (
                          <Badge key={index} className="bg-green-100 text-green-800 text-xs">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Conflicting Traits</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.comparativeProfile.conflictingTraits.map((trait, index) => (
                          <Badge key={index} className="bg-red-100 text-red-800 text-xs">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Authorial Stance</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded text-sm">
                        {result.comparativeProfile.authoralStance}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-center">
            <Button 
              onClick={runEnhancedComparison}
              disabled={isAnalyzing}
              variant="outline"
              className="gap-2"
            >
              <Zap className="h-4 w-4" />
              {isAnalyzing ? 'Re-analyzing...' : 'Run Analysis Again'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}