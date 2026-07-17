import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PassageData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Brain, Target, Users, FileText } from "lucide-react";

interface AdvancedComparisonResult {
  is_ripoff: boolean;
  is_development: boolean;
  development_mode: string;
  development_strength: number;
  doctrinal_alignment: {
    type: string;
    affinity_axis: string;
  };
  psychological_profiles: {
    text_a: {
      interests: string[];
      bias: string[];
      cognitive_strength: string[];
      posture: string;
    };
    text_b: {
      interests: string[];
      bias: string[];
      cognitive_strength: string[];
      posture: string;
    };
    narrative_relationship: string;
  };
  summary: string;
}

interface AdvancedComparisonProps {
  passageA: PassageData;
  passageB: PassageData;
  passageATitle: string;
  passageBTitle: string;
}

export default function AdvancedComparison({
  passageA,
  passageB,
  passageATitle,
  passageBTitle
}: AdvancedComparisonProps) {
  const [result, setResult] = useState<AdvancedComparisonResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const runAdvancedComparison = async () => {
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/analyze/advanced', {
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
        throw new Error('Advanced comparison failed');
      }

      const data = await response.json();
      setResult(data);
      
      toast({
        title: 'Advanced Analysis Complete',
        description: 'Comprehensive comparison analysis finished successfully.',
      });
    } catch (error) {
      console.error('Error in advanced comparison:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Unable to complete advanced comparison. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getAlignmentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'kindred': return 'bg-green-100 text-green-800';
      case 'compatible': return 'bg-blue-100 text-blue-800';
      case 'opposed': return 'bg-orange-100 text-orange-800';
      case 'antithetical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!result) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Advanced Comparison Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Run comprehensive analysis including originality scoring, developmental relationships, 
              doctrinal alignment, and psychological profiling of both texts.
            </p>
            <Button 
              onClick={runAdvancedComparison}
              disabled={isAnalyzing}
              className="gap-2"
            >
              <Brain className="h-4 w-4" />
              {isAnalyzing ? 'Analyzing...' : 'Run Advanced Analysis'}
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
            <Brain className="h-5 w-5" />
            Advanced Comparison Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="originality" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="originality">Originality</TabsTrigger>
              <TabsTrigger value="development">Development</TabsTrigger>
              <TabsTrigger value="alignment">Alignment</TabsTrigger>
              <TabsTrigger value="psychology">Psychology</TabsTrigger>
            </TabsList>

            <TabsContent value="originality" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Originality Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getScoreColor(result.originality_score)}`}>
                        {result.originality_score}
                      </div>
                      <div className="text-sm text-gray-600">out of 100</div>
                      <div className="mt-2">
                        <Badge variant={result.is_ripoff ? "destructive" : "default"}>
                          {result.is_ripoff ? "Potential Ripoff" : "Original Work"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Development Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Is Development:</span>
                        <Badge variant={result.is_development ? "default" : "secondary"}>
                          {result.is_development ? "Yes" : "No"}
                        </Badge>
                      </div>
                      {result.is_development && (
                        <>
                          <div className="flex justify-between">
                            <span>Mode:</span>
                            <Badge variant="outline">{result.development_mode}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Strength:</span>
                            <span className={getScoreColor(result.development_strength)}>
                              {result.development_strength}/100
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="development" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Developmental Relationship</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Development Status</label>
                        <div className="mt-1">
                          <Badge variant={result.is_development ? "default" : "secondary"}>
                            {result.is_development ? "Develops Ideas" : "Independent"}
                          </Badge>
                        </div>
                      </div>
                      {result.is_development && (
                        <>
                          <div>
                            <label className="text-sm font-medium">Development Mode</label>
                            <div className="mt-1">
                              <Badge variant="outline">{result.development_mode}</Badge>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Development Strength</label>
                            <div className={`mt-1 text-lg font-semibold ${getScoreColor(result.development_strength)}`}>
                              {result.development_strength}/100
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alignment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Doctrinal Alignment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(result.doctrinal_alignment.alignment_score)}`}>
                        {result.doctrinal_alignment.alignment_score}/100
                      </div>
                      <div className="text-sm text-gray-600">Alignment Score</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Alignment Type</label>
                        <div className="mt-1">
                          <Badge className={getAlignmentTypeColor(result.doctrinal_alignment.type)}>
                            {result.doctrinal_alignment.type}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Affinity Axis</label>
                        <div className="mt-1">
                          <Badge variant="outline">{result.doctrinal_alignment.affinity_axis}</Badge>
                        </div>
                      </div>
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
                      <label className="text-sm font-medium">Interests</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.psychological_profiles.text_a.interests.map((interest, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Biases</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.psychological_profiles.text_a.bias.map((bias, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {bias}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Cognitive Strengths</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.psychological_profiles.text_a.cognitive_strength.map((strength, index) => (
                          <Badge key={index} variant="default" className="text-xs">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Posture</label>
                      <div className="mt-1">
                        <Badge className="bg-purple-100 text-purple-800">
                          {result.psychological_profiles.text_a.posture}
                        </Badge>
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
                      <label className="text-sm font-medium">Interests</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.psychological_profiles.text_b.interests.map((interest, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Biases</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.psychological_profiles.text_b.bias.map((bias, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {bias}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Cognitive Strengths</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.psychological_profiles.text_b.cognitive_strength.map((strength, index) => (
                          <Badge key={index} variant="default" className="text-xs">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Posture</label>
                      <div className="mt-1">
                        <Badge className="bg-purple-100 text-purple-800">
                          {result.psychological_profiles.text_b.posture}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Psychological Relationship</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(result.psychological_profiles.match_score)}`}>
                        {result.psychological_profiles.match_score}/100
                      </div>
                      <div className="text-sm text-gray-600">Psychological Match Score</div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm">{result.psychological_profiles.narrative_relationship}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Summary Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{result.summary}</p>
            </CardContent>
          </Card>

          <div className="mt-4 flex justify-center">
            <Button 
              onClick={runAdvancedComparison}
              disabled={isAnalyzing}
              variant="outline"
              className="gap-2"
            >
              <Brain className="h-4 w-4" />
              {isAnalyzing ? 'Re-analyzing...' : 'Run Analysis Again'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}