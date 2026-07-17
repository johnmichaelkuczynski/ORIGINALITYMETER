import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose 
} from "@/components/ui/dialog";
import { AnalysisResult, PassageData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { printHtmlDocument, escapeHtml, toParagraphs, toOrderedList } from "@/lib/printToPdf";

// Extended type to handle various possible properties from different AI providers
type ExtendedResult = AnalysisResult & {
  novelty?: any;
  aiDetection?: any;
  parasiteIndex?: any;
  conceptualOverlap?: any;
  coherence?: any;
  conceptualLineage?: any;
  derivativeIndex?: any;
};

interface ComprehensiveReportProps {
  result: AnalysisResult;
  passageA: PassageData;
  passageB?: PassageData;
  isSinglePassageMode?: boolean;
}

export default function ComprehensiveReport({
  result,
  passageA,
  passageB,
  isSinglePassageMode = false
}: ComprehensiveReportProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Cast result to extended type for accessing various properties safely
  const extendedResult = result as ExtendedResult;

  // Download functions for each analysis type
  const downloadIntelligenceAnalysis = async () => {
    try {
      setDownloadingType("intelligence");
      
      const reportData = generateReport();
      let content = '';
      
      content += `INTELLIGENCE ANALYSIS REPORT\n`;
      content += `${'='.repeat(50)}\n\n`;
      content += `Document: ${passageA.title || "Untitled Document"}\n`;
      content += `Generated: ${new Date().toLocaleDateString()}\n`;
      content += `Analysis Type: Cognitive Intelligence Assessment\n\n`;
      
      content += `EXECUTIVE SUMMARY\n`;
      content += `${'-'.repeat(20)}\n`;
      content += `${reportData.summary}\n\n`;
      
      content += `INTELLIGENCE METRICS\n`;
      content += `${'-'.repeat(20)}\n`;
        if (data.description) {
          content += `  Analysis: ${data.description}\n`;
        }
        content += `\n`;
      });
      
      content += `COGNITIVE STRENGTHS\n`;
      content += `${'-'.repeat(20)}\n`;
      reportData.strengths.forEach((strength: string, index: number) => {
        content += `${index + 1}. ${strength}\n`;
      });
      content += `\n`;
      
      content += `AREAS FOR DEVELOPMENT\n`;
      content += `${'-'.repeat(20)}\n`;
      reportData.weaknesses.forEach((weakness: string, index: number) => {
        content += `${index + 1}. ${weakness}\n`;
      });
      content += `\n`;
      
      content += `INTELLIGENCE ENHANCEMENT RECOMMENDATIONS\n`;
      content += `${'-'.repeat(20)}\n`;
      reportData.improvements.forEach((improvement: string, index: number) => {
        content += `${index + 1}. ${improvement}\n`;
      });
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `intelligence-analysis-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Complete",
        description: "Intelligence analysis downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading intelligence analysis:", error);
      toast({
        title: "Download Failed",
        description: "Could not download intelligence analysis",
        variant: "destructive",
      });
    } finally {
      setDownloadingType(null);
    }
  };

  const downloadOriginalityAnalysis = async () => {
    try {
      setDownloadingType("originality");
      
      // Create a detailed TXT report based on current analysis
      const reportData = generateReport();
      let content = '';
      
      content += `ORIGINALITY ANALYSIS REPORT\n`;
      content += `${'='.repeat(50)}\n\n`;
      content += `Document: ${passageA.title || "Untitled Document"}\n`;
      content += `Generated: ${new Date().toLocaleDateString()}\n`;
      content += `Analysis Type: ${isSinglePassageMode ? 'Single Passage' : 'Comparative'}\n\n`;
      
      content += `EXECUTIVE SUMMARY\n`;
      content += `${'-'.repeat(20)}\n`;
      content += `${reportData.summary}\n\n`;
      
      content += `DETAILED METRICS\n`;
      content += `${'-'.repeat(20)}\n`;
        if (data.description) {
          content += `  Description: ${data.description}\n`;
        }
        content += `\n`;
      });
      
      content += `STRENGTHS\n`;
      content += `${'-'.repeat(20)}\n`;
      reportData.strengths.forEach((strength: string, index: number) => {
        content += `${index + 1}. ${strength}\n`;
      });
      content += `\n`;
      
      content += `AREAS FOR IMPROVEMENT\n`;
      content += `${'-'.repeat(20)}\n`;
      reportData.weaknesses.forEach((weakness: string, index: number) => {
        content += `${index + 1}. ${weakness}\n`;
      });
      content += `\n`;
      
      content += `RECOMMENDATIONS\n`;
      content += `${'-'.repeat(20)}\n`;
      reportData.improvements.forEach((improvement: string, index: number) => {
        content += `${index + 1}. ${improvement}\n`;
      });
      
      // Create and download the file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `originality-analysis-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Complete",
        description: "Originality analysis downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading originality analysis:", error);
      toast({
        title: "Download Failed",
        description: "Could not download originality analysis",
        variant: "destructive",
      });
    } finally {
      setDownloadingType(null);
    }
  };

  const downloadCogencyAnalysis = async () => {
    try {
      setDownloadingType("cogency");
      
      const reportData = generateReport();
      let content = '';
      
      content += `COGENCY ANALYSIS REPORT\n`;
      content += `${'='.repeat(50)}\n\n`;
      content += `Document: ${passageA.title || "Untitled Document"}\n`;
      content += `Generated: ${new Date().toLocaleDateString()}\n`;
      content += `Analysis Type: Argumentative Cogency Assessment\n\n`;
      
      content += `EXECUTIVE SUMMARY\n`;
      content += `${'-'.repeat(20)}\n`;
      content += `${reportData.summary}\n\n`;
      
      content += `COGENCY METRICS\n`;
      content += `${'-'.repeat(20)}\n`;
        if (data.description) {
          content += `  Assessment: ${data.description}\n`;
        }
        content += `\n`;
      });
      
      content += `ARGUMENTATIVE STRENGTHS\n`;
      content += `${'-'.repeat(20)}\n`;
      reportData.strengths.forEach((strength: string, index: number) => {
        content += `${index + 1}. ${strength}\n`;
      });
      content += `\n`;
      
      content += `LOGICAL WEAKNESSES\n`;
      content += `${'-'.repeat(20)}\n`;
      reportData.weaknesses.forEach((weakness: string, index: number) => {
        content += `${index + 1}. ${weakness}\n`;
      });
      content += `\n`;
      
      content += `COGENCY IMPROVEMENT RECOMMENDATIONS\n`;
      content += `${'-'.repeat(20)}\n`;
      reportData.improvements.forEach((improvement: string, index: number) => {
        content += `${index + 1}. ${improvement}\n`;
      });
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cogency-analysis-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Complete",
        description: "Cogency analysis downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading cogency analysis:", error);
      toast({
        title: "Download Failed",
        description: "Could not download cogency analysis",
        variant: "destructive",
      });
    } finally {
      setDownloadingType(null);
    }
  };

  const downloadQualityAnalysis = async () => {
    try {
      setDownloadingType("quality");
      
      const reportData = generateReport();
      let content = '';
      
      content += `OVERALL QUALITY ANALYSIS REPORT\n`;
      content += `${'='.repeat(50)}\n\n`;
      content += `Document: ${passageA.title || "Untitled Document"}\n`;
      content += `Generated: ${new Date().toLocaleDateString()}\n`;
      content += `Analysis Type: Comprehensive Quality Assessment\n\n`;
      
      content += `EXECUTIVE SUMMARY\n`;
      content += `${'-'.repeat(20)}\n`;
      content += `${reportData.summary}\n\n`;
      
      content += `QUALITY METRICS\n`;
      content += `${'-'.repeat(20)}\n`;
        if (data.description) {
          content += `  Evaluation: ${data.description}\n`;
        }
        content += `\n`;
      });
      
      content += `QUALITY STRENGTHS\n`;
      content += `${'-'.repeat(20)}\n`;
      reportData.strengths.forEach((strength: string, index: number) => {
        content += `${index + 1}. ${strength}\n`;
      });
      content += `\n`;
      
      content += `QUALITY DEFICIENCIES\n`;
      content += `${'-'.repeat(20)}\n`;
      reportData.weaknesses.forEach((weakness: string, index: number) => {
        content += `${index + 1}. ${weakness}\n`;
      });
      content += `\n`;
      
      content += `QUALITY ENHANCEMENT RECOMMENDATIONS\n`;
      content += `${'-'.repeat(20)}\n`;
      reportData.improvements.forEach((improvement: string, index: number) => {
        content += `${index + 1}. ${improvement}\n`;
      });
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quality-analysis-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Complete",
        description: "Quality analysis downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading quality analysis:", error);
      toast({
        title: "Download Failed",
        description: "Could not download quality analysis",
        variant: "destructive",
      });
    } finally {
      setDownloadingType(null);
    }
  };

  const generateReport = () => {
    let reportData: any = {};
    
    // Get the document titles
    const passageATitle = passageA.title || "Untitled Document";
    const passageBTitle = passageB?.title || "Document B";
    
    try {
      // --- AUTHOR ORIGINALITY ANALYSIS ---
      
      // Extract originality scores
      let originalityScoreA = "N/A";
      let originalityScoreB = "N/A";
      let originalityAssessmentA = "";
      let originalityAssessmentB = "";
      
      // Try to get scores from different potential properties based on API provider used
        originalityAssessmentA = extendedResult.novelty.passageA.assessment || "";
        originalityAssessmentA = extendedResult.derivativeIndex.passageA.assessment || "";
      }
      
      if (!isSinglePassageMode) {
          originalityAssessmentB = extendedResult.novelty.passageB.assessment || "";
          originalityAssessmentB = extendedResult.derivativeIndex.passageB.assessment || "";
        }
      }
      
      // Extract conceptual lineage
      let primaryInfluencesA = "";
      
      if (extendedResult.conceptualLineage?.passageA?.primaryInfluences) {
        if (Array.isArray(extendedResult.conceptualLineage.passageA.primaryInfluences)) {
          primaryInfluencesA = extendedResult.conceptualLineage.passageA.primaryInfluences.join(", ");
        } else if (typeof extendedResult.conceptualLineage.passageA.primaryInfluences === 'string') {
          primaryInfluencesA = extendedResult.conceptualLineage.passageA.primaryInfluences;
        }
      }
      
      let intellectualTrajectoryA = extendedResult.conceptualLineage?.passageA?.intellectualTrajectory || "";
      
      // Extract AI detection results
      let aiDetectionResultA = "Unknown";
      let aiConfidenceA = "";
      
      if (extendedResult.aiDetection?.passageA) {
        aiDetectionResultA = extendedResult.aiDetection.passageA.isAIGenerated ? "AI-generated" : "Human-written";
        aiConfidenceA = extendedResult.aiDetection.passageA.confidence || "medium";
      }
      
      // Categorize originality level based on score
      let originalityLevelA = "Unknown";
        if (score >= 0 && score <= 3) {
          originalityLevelA = "Derivative or mimetic";
        } else if (score >= 4 && score <= 6) {
          originalityLevelA = "Marginal novelty";
        } else if (score >= 7 && score <= 8) {
          originalityLevelA = "Moderate originality";
        } else if (score >= 9 && score <= 10) {
          originalityLevelA = "High originality";
        }
        if (score >= 0 && score <= 3) {
          originalityLevelA = "Derivative or mimetic";
        } else if (score >= 4 && score <= 6) {
          originalityLevelA = "Marginal novelty";
        } else if (score >= 7 && score <= 8) {
          originalityLevelA = "Moderate originality";
        } else if (score >= 9 && score <= 10) {
          originalityLevelA = "High originality";
        }
      }
      
      // Build summary according to AUTHOR ORIGINALITY DETECTOR format
      let summary = "";
      
      if (isSinglePassageMode) {
        summary = `AUTHOR ORIGINALITY ESTIMATE: ${originalityScoreA}\n\n`;
        summary += `Analysis of "${passageATitle}" reveals ${originalityLevelA.toLowerCase()} content. `;
        
        if (primaryInfluencesA) {
          summary += `The work shows influences from ${primaryInfluencesA}. `;
        }
        
        if (intellectualTrajectoryA) {
          summary += `${intellectualTrajectoryA} `;
        }
        
        if (aiDetectionResultA !== "Unknown") {
          summary += `The document appears to be ${aiDetectionResultA.toLowerCase()} with ${aiConfidenceA} confidence. `;
        }
      } else {
        // Comparison mode
        let overlapScore = "N/A";
        }
        
        summary = `AUTHOR ORIGINALITY COMPARISON:\n`;
        summary += `"${passageATitle}": ${originalityScoreA}\n`;
        summary += `"${passageBTitle}": ${originalityScoreB}\n\n`;
        
        summary += `Conceptual distinctiveness between documents: ${overlapScore}/10\n\n`;
        
          
          if (scoreA > scoreB) {
            summary += `"${passageATitle}" demonstrates higher originality (${scoreA}/10) than "${passageBTitle}" (${scoreB}/10). `;
          } else if (scoreB > scoreA) {
            summary += `"${passageBTitle}" demonstrates higher originality (${scoreB}/10) than "${passageATitle}" (${scoreA}/10). `;
          } else {
            summary += `Both documents show the same level of originality (${scoreA}/10). `;
          }
        }
      }
      
      reportData.summary = summary;
    } catch (error) {
      console.error("Error generating summary:", error);
      reportData.summary = `Analysis generated for "${passageATitle}"${isSinglePassageMode ? '' : ` and "${passageBTitle}"`}. Some metrics may be incomplete due to document complexity or size.`;
    }
    
    // Extract quality metric scores with quotations and justifications
    const qualityMetrics: any = {};
    
    const metricKeys = [
      'conceptualCompression', 'epistemicFriction', 'inferenceControl', 'asymmetryOfCognitiveLabor',
      'noveltyToBaselineRatio', 'internalDifferentiation', 'problemDensity', 'compressionAcrossLevels',
      'semanticSpecificity', 'explanatoryYield', 'metaCognitiveSignal', 'structuralIntegrity',
      'generativePotential', 'signalToRhetoricRatio', 'dialecticalEngagement', 'topologicalAwareness',
      'disambiguationSkill', 'crossDisciplinaryFluency', 'psychologicalRealism', 'intellectualRiskQuotient'
    ];
    
    const metricLabels = {
      'conceptualCompression': 'Conceptual Compression',
      'epistemicFriction': 'Epistemic Friction',
      'inferenceControl': 'Inference Control',
      'asymmetryOfCognitiveLabor': 'Asymmetry of Cognitive Labor',
      'noveltyToBaselineRatio': 'Novelty-to-Baseline Ratio',
      'internalDifferentiation': 'Internal Differentiation',
      'problemDensity': 'Problem Density',
      'compressionAcrossLevels': 'Compression Across Levels',
      'semanticSpecificity': 'Semantic Specificity',
      'explanatoryYield': 'Explanatory Yield',
      'metaCognitiveSignal': 'Meta-Cognitive Signal',
      'structuralIntegrity': 'Structural Integrity',
      'generativePotential': 'Generative Potential',
      'signalToRhetoricRatio': 'Signal-to-Rhetoric Ratio',
      'dialecticalEngagement': 'Dialectical Engagement',
      'topologicalAwareness': 'Topological Awareness',
      'disambiguationSkill': 'Disambiguation Skill',
      'crossDisciplinaryFluency': 'Cross-Disciplinary Fluency',
      'psychologicalRealism': 'Psychological Realism',
      'intellectualRiskQuotient': 'Intellectual Risk Quotient'
    };
    
    try {
      metricKeys.forEach(key => {
        if (extendedResult[key]?.passageA) {
          qualityMetrics[key] = {
            label: metricLabels[key],
            assessment: extendedResult[key].passageA.assessment || "No assessment available",
            quotation1: extendedResult[key].passageA.quotation1 || "No quotation provided",
            justification1: extendedResult[key].passageA.justification1 || "No justification provided",
            quotation2: extendedResult[key].passageA.quotation2 || "No quotation provided",
            justification2: extendedResult[key].passageA.justification2 || "No justification provided"
          };
        }
      });
    } catch (error) {
      console.error("Error extracting quality metrics:", error);
    }
    
    reportData.qualityMetrics = qualityMetrics;
    
    // Extract legacy scores for compatibility
    const scores: any = {};
    
    try {
      if (isSinglePassageMode) {
        if (extendedResult.aiDetection?.passageA) {
          scores.aiDetection = {
            label: "AI Detection",
            isAIGenerated: extendedResult.aiDetection.passageA.isAIGenerated,
            confidence: extendedResult.aiDetection.passageA.confidence || "Unknown",
            details: extendedResult.aiDetection.passageA.details || "No details available"
          };
        }
      } else {
        // Comparison mode scores
        if (extendedResult.conceptualOverlap) {
          scores.overlap = {
            label: "Conceptual Distinctiveness",
            description: extendedResult.conceptualOverlap.description || "No description available"
          };
        }
        
        if (extendedResult.novelty?.passageA) {
          scores.originalityA = {
            label: `Originality: ${passageATitle}`,
            description: extendedResult.novelty.passageA.description || "No description available"
          };
        }
        
        if (extendedResult.novelty?.passageB) {
          scores.originalityB = {
            label: `Originality: ${passageBTitle}`,
            description: extendedResult.novelty.passageB.description || "No description available"
          };
        }
      }
    } catch (error) {
      console.error("Error extracting scores:", error);
      scores.error = {
        label: "Analysis Metrics",
        description: "Unable to extract detailed metrics due to document complexity or size."
      };
    }
    
    
    // Extract strengths and weaknesses
    let strengths: string[] = [];
    let weaknesses: string[] = [];
    
    try {
      if (isSinglePassageMode) {
        // Single passage mode - check both novelty and derivativeIndex
        
        if (originalityScore !== undefined) {
          if (originalityScore >= 7) {
            strengths.push("High originality score, indicating innovative thinking and unique perspectives.");
          } else if (originalityScore <= 4) {
            weaknesses.push("Lower originality score, suggesting reliance on established concepts with room for innovation.");
          }
        } else {
          // If no score available, add a generic strength about originality based on document type
          const isAcademic = (passageA.title || "").toLowerCase().includes("logic") || 
                          (passageA.title || "").toLowerCase().includes("philosophy") ||
                          (passageA.title || "").toLowerCase().includes("mathematics");
                          
          if (isAcademic) {
            strengths.push("The document shows a good understanding of foundational concepts in the field.");
          }
        }
        
        // Coherence evaluation
            strengths.push("Excellent coherence, with well-structured argumentation and logical flow.");
            weaknesses.push("Some improvement needed in coherence, particularly in structuring arguments and maintaining logical flow.");
          }
        }
        
        if (extendedResult.parasiteIndex?.passageA?.level) {
          if (extendedResult.parasiteIndex.passageA.level === "Low") {
            strengths.push("Low conceptual parasitism, indicating good transformation of borrowed ideas into original content.");
          } else if (extendedResult.parasiteIndex.passageA.level === "High") {
            weaknesses.push("High conceptual parasitism, showing excessive reliance on existing ideas without sufficient transformation.");
          }
        }
        
        if (extendedResult.aiDetection?.passageA) {
          if (!extendedResult.aiDetection.passageA.isAIGenerated) {
            strengths.push("Appears to be authentic human-written content with distinctive style and perspective.");
          } else {
            weaknesses.push("Shows characteristics of AI-generated content, which may lack authentic human perspective.");
          }
        }
      } else {
        // Comparison mode
            strengths.push("High conceptual distinctiveness between the documents, indicating complementary perspectives.");
            weaknesses.push("Low conceptual distinctiveness, suggesting redundant content across documents.");
          }
        }
        
            strengths.push(`"${passageATitle}" shows high originality and innovative thinking.`);
            weaknesses.push(`"${passageATitle}" demonstrates low originality, relying heavily on established concepts.`);
          }
        }
        
            strengths.push(`"${passageBTitle}" shows high originality and innovative thinking.`);
            weaknesses.push(`"${passageBTitle}" demonstrates low originality, relying heavily on established concepts.`);
          }
        }
      }
    } catch (error) {
      console.error("Error generating strengths and weaknesses:", error);
    }
    
    // Add generic strengths/weaknesses if we don't have enough
    if (strengths.length < 2) {
      strengths.push("The document contributes valuable perspectives to the field.");
      strengths.push("Shows clear understanding of the subject matter.");
    }
    
    if (weaknesses.length < 2) {
      weaknesses.push("Could benefit from more innovative approaches to the subject matter.");
      weaknesses.push("Consider expanding the depth of analysis in certain sections.");
    }
    
    reportData.strengths = strengths;
    reportData.weaknesses = weaknesses;
    
    // Generate improvement suggestions
    const improvements: string[] = [];
    
    try {
      if (isSinglePassageMode) {
          improvements.push("Enhance originality by challenging conventional perspectives and developing more innovative viewpoints.");
        }
        
          improvements.push("Improve logical structure and flow between sections to strengthen overall coherence.");
        }
        
        if (extendedResult.parasiteIndex?.passageA?.level && extendedResult.parasiteIndex.passageA.level !== "Low") {
          improvements.push("Reduce conceptual parasitism by transforming borrowed ideas more thoroughly through critical analysis and novel application.");
        }
        
        if (extendedResult.aiDetection?.passageA?.isAIGenerated) {
          improvements.push("Add more personal insights, specific examples, and nuanced perspectives to reduce AI-generated characteristics.");
        }
      } else {
          improvements.push("Increase conceptual distinctiveness between documents by focusing on different aspects of the subject matter.");
        }
      }
    } catch (error) {
      console.error("Error generating improvement suggestions:", error);
    }
    
    // Generic improvements
    if (improvements.length < 2) {
      improvements.push("Consider incorporating interdisciplinary perspectives to enrich the conceptual framework.");
      improvements.push("Explicitly acknowledge influences while clarifying how your work extends beyond them.");
    }
    
    reportData.improvements = improvements;
    
    return reportData;
  };

  const handleDownloadPdf = () => {
    try {
      setIsGenerating(true);
      toast({
        title: "Generating PDF",
        description: "Please wait while we prepare your comprehensive report...",
      });

      const reportData = generateReport();
      
      const title = isSinglePassageMode 
        ? `Comprehensive Analysis: ${passageA.title || "Untitled Document"}`
        : `Comparative Analysis: ${passageA.title || "Document A"} & ${passageB?.title || "Document B"}`;

      const date = new Date().toLocaleDateString();
      const parts: string[] = [];
      parts.push(`<h1>${escapeHtml(title)}</h1>`);
      parts.push(`<p class="muted">Generated by Originality Meter &middot; ${escapeHtml(date)}</p><hr />`);

      parts.push(`<h2>Executive Summary</h2>`);
      parts.push(toParagraphs(reportData.summary || ""));

      parts.push(`<h2>Quality Metrics Analysis</h2>`);
      if (reportData.qualityMetrics && Object.keys(reportData.qualityMetrics).length > 0) {
        Object.values(reportData.qualityMetrics).forEach((metric: any) => {
          if (metric?.label) parts.push(`<h3>${escapeHtml(metric.label)}</h3>`);
          if (metric?.assessment) parts.push(`<p>${escapeHtml(metric.assessment)}</p>`);
          if (metric?.quotation1) {
            parts.push(`<p class="muted">Supporting Evidence 1:</p><blockquote>${escapeHtml(metric.quotation1)}</blockquote>`);
            if (metric?.justification1) parts.push(`<p>${escapeHtml(metric.justification1)}</p>`);
          }
          if (metric?.quotation2) {
            parts.push(`<p class="muted">Supporting Evidence 2:</p><blockquote>${escapeHtml(metric.quotation2)}</blockquote>`);
            if (metric?.justification2) parts.push(`<p>${escapeHtml(metric.justification2)}</p>`);
          }
        });
      } else {
        parts.push(`<p>Quality metrics are being processed. This may take longer for complex documents.</p>`);
      }

      if (Array.isArray(reportData.strengths) && reportData.strengths.length) {
        parts.push(`<h2>Strengths</h2>`);
        parts.push(toOrderedList(reportData.strengths));
      }
      if (Array.isArray(reportData.weaknesses) && reportData.weaknesses.length) {
        parts.push(`<h2>Areas for Improvement</h2>`);
        parts.push(toOrderedList(reportData.weaknesses));
      }
      if (Array.isArray(reportData.improvements) && reportData.improvements.length) {
        parts.push(`<h2>Improvement Recommendations</h2>`);
        parts.push(toOrderedList(reportData.improvements));
      }

      parts.push(`<hr /><p class="muted">This report was generated using advanced AI analysis tools and should be used as a guide. Results may vary based on document complexity and length.</p>`);

      printHtmlDocument(title, parts.join("\n"), { withMathJax: true });

      const fileName = isSinglePassageMode
        ? `analysis_${passageA.title?.replace(/\s+/g, '_') || 'document'}.pdf`
        : `comparison_${passageA.title?.replace(/\s+/g, '_') || 'document1'}_${passageB?.title?.replace(/\s+/g, '_') || 'document2'}.pdf`;
      
      setIsGenerating(false);
      toast({
        title: "PDF Report Generated",
        description: `Your report has been downloaded as "${fileName}"`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      setIsGenerating(false);
      toast({
        title: "Error Generating Report",
        description: "There was a problem creating your report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadWord = () => {
    try {
      setIsGenerating(true);
      toast({
        title: "Generating Text Report",
        description: "Please wait while we prepare your originality report...",
      });

      const reportData = generateReport();
      
      // Creating a text-based document with Author Originality Detector format
      let docContent = '';

      // Title and Header
      docContent += "AUTHOR ORIGINALITY DETECTOR REPORT\n";
      docContent += "==================================================\n";
      docContent += `Generated on ${new Date().toLocaleDateString()} by Originality Meter\n\n`;

      // Document Information
      docContent += "DOCUMENT INFORMATION\n";
      docContent += "-----------------\n";
      docContent += `Title: ${passageA.title || "Untitled Document"}\n`;
      docContent += `Word Count: ${passageA.text?.split(/\s+/).length || 0}\n`;
      if (!isSinglePassageMode && passageB) {
        docContent += `\nComparison Document: ${passageB.title || "Document B"}\n`;
        docContent += `Word Count: ${passageB.text?.split(/\s+/).length || 0}\n`;
      }
      docContent += "\n";

      // Summary - Primary Assessment
      docContent += "AUTHOR ORIGINALITY ASSESSMENT\n";
      docContent += "==================================================\n";
      docContent += reportData.summary;
      docContent += "\n\n";
      
      // Only in single passage mode, add full detector format
      if (isSinglePassageMode) {
        // Core Evaluation
        docContent += "CORE EVALUATION QUESTION\n";
        docContent += "-----------------\n";
        docContent += "If this text is true, what exactly is learned — and could that have been known already?\n\n";
        
        // Step 1 - Distill Contribution
        docContent += "STEP 1 — Distill the Contribution:\n";
        docContent += `What would a reader learn from this that they likely didn't already know?\n`;
        
        const contributionInsight = extendedResult.novelty?.passageA?.description || 
                                   extendedResult.derivativeIndex?.passageA?.description ||
                                   "No specific novel contribution identified.";
        docContent += `→ ${contributionInsight}\n\n`;
        
        // Step 2 - Novelty Isolation
        docContent += "STEP 2 — Novelty Isolation:\n";
        docContent += `Could this idea have been produced simply by combining existing platitudes?\n`;
        docContent += `Does the text reframe a problem or introduce a new one?\n`;
        
        const intellectualFraming = extendedResult.conceptualLineage?.passageA?.intellectualTrajectory || 
                                   "Insufficient data to determine novelty isolation.";
        docContent += `→ ${intellectualFraming}\n\n`;
        
        // Step 3 - Generativity Test
        docContent += "STEP 3 — Generativity Test:\n";
        docContent += `Can this idea generate downstream insights or solutions?\n`;
        docContent += `Is the framing transferable beyond its immediate context?\n`;
        
        // Try to extract generativity insights from various fields
        const generativityInsights = extendedResult.novelty?.passageA?.assessment || 
                                    extendedResult.derivativeIndex?.passageA?.assessment ||
                                    "Insufficient data to assess generative potential of the ideas.";
        docContent += `→ ${generativityInsights}\n\n`;
        
        // Step 4 - Imitation Filter
        docContent += "STEP 4 — Imitation Filter:\n";
        docContent += `Would an academic LLM trained on field literature be able to generate this by pattern-matching?\n`;
        
        // Try to determine if AI-generated or human-original
        const imitationAssessment = extendedResult.aiDetection?.passageA ? 
          `The text appears to be ${extendedResult.aiDetection.passageA.isAIGenerated ? 
            "potentially generated through pattern-matching (AI-generated)" : 
            "not likely generated through simple pattern-matching (Human-written)"} with ${extendedResult.aiDetection.passageA.confidence} confidence.` :
          "Unable to determine imitation pattern.";
        docContent += `→ ${imitationAssessment}\n\n`;
        
        // Justification and Verdict
        docContent += "JUSTIFICATION\n";
        docContent += "-----------------\n";
        
        // Extract primary influences for justification
        let primaryInfluences = "";
        if (extendedResult.conceptualLineage?.passageA?.primaryInfluences) {
          if (Array.isArray(extendedResult.conceptualLineage.passageA.primaryInfluences)) {
            primaryInfluences = extendedResult.conceptualLineage.passageA.primaryInfluences.join(", ");
          } else if (typeof extendedResult.conceptualLineage.passageA.primaryInfluences === 'string') {
            primaryInfluences = extendedResult.conceptualLineage.passageA.primaryInfluences;
          }
        }
        
        // Add justification based on conceptual lineage and other metrics
        if (primaryInfluences) {
          docContent += `- The document shows clear influences from: ${primaryInfluences}\n`;
        }
        
        // Get originality level
        let originalityLevel = "Unknown";
        let originalityScore = 0;
        
        }
        
        if (originalityScore >= 0 && originalityScore <= 3) {
          originalityLevel = "Derivative or mimetic";
          docContent += `- ${originalityLevel}: The text largely restates known ideas in slightly different terms.\n`;
        } else if (originalityScore >= 4 && originalityScore <= 6) {
          originalityLevel = "Marginal novelty";
          docContent += `- ${originalityLevel}: The text contains some nonstandard phrasing or emphasis, but minimal genuine insight.\n`;
        } else if (originalityScore >= 7 && originalityScore <= 8) {
          originalityLevel = "Moderate originality";
          docContent += `- ${originalityLevel}: The text offers clear framing or nontrivial synthesis, teaching something new.\n`;
        } else if (originalityScore >= 9 && originalityScore <= 10) {
          originalityLevel = "High originality";
          docContent += `- ${originalityLevel}: The text introduces frameworks, distinctions, or concepts with real explanatory power.\n`;
        } else {
          docContent += `- Originality assessment could not be determined with confidence.\n`;
        }
        
        // Include coherence assessment if available
        if (extendedResult.coherence?.passageA?.label) {
          docContent += `- Coherence: ${extendedResult.coherence.passageA.label}\n`;
        }
        
        // Final verdict
        docContent += "\nVERDICT\n";
        docContent += "-----------------\n";
        
        if (originalityScore >= 7) {
          docContent += `"This author is conceptually original in their approach."\n`;
        } else if (originalityScore >= 4 && originalityScore < 7) {
          docContent += `"The text restates known ideas in slightly different terms, with limited novelty."\n`;
        } else {
          docContent += `"This is largely boilerplate disguised as novelty."\n`;
        }
      } else {
        // For comparison mode, add comparison analysis
        docContent += "COMPARATIVE ANALYSIS\n";
        docContent += "-----------------\n";
        
        // Add specific comparison metrics
        if (extendedResult.conceptualOverlap) {
          docContent += `${extendedResult.conceptualOverlap.description || ""}\n\n`;
        }
        
        // Compare originality of both passages
        if (extendedResult.novelty?.passageA && extendedResult.novelty?.passageB) {
          
          docContent += "ORIGINALITY COMPARISON\n";
          docContent += `"${passageA.title || "Document A"}": ${scoreA}/10\n`;
          docContent += `"${passageB?.title || "Document B"}": ${scoreB}/10\n\n`;
          
          if (scoreA > scoreB) {
            docContent += `Document A demonstrates higher conceptual originality.\n`;
          } else if (scoreB > scoreA) {
            docContent += `Document B demonstrates higher conceptual originality.\n`;
          } else {
            docContent += `Both documents demonstrate similar levels of conceptual originality.\n`;
          }
        }
      }
      
      // Add strengths and weaknesses
      docContent += "\n\nSTRENGTHS & WEAKNESSES\n";
      docContent += "==================================================\n";
      
      // Strengths
      docContent += `\nStrengths:\n`;
      (reportData.strengths || []).forEach((strength: string, index: number) => {
        docContent += `${index + 1}. ${strength}\n`;
      });
      
      // Weaknesses
      docContent += `\nWeaknesses:\n`;
      (reportData.weaknesses || []).forEach((weakness: string, index: number) => {
        docContent += `${index + 1}. ${weakness}\n`;
      });
      
      // Add score breakdown if available
        docContent += "\n\nDETAILED METRICS\n";
        docContent += "==================================================\n";
        
          docContent += `\n${data.label}\n`;
          docContent += `${'-'.repeat(data.label.length)}\n`;
          
          } else if (data.level !== undefined) {
            docContent += `Level: ${data.level}\n`;
          } else if (data.isAIGenerated !== undefined) {
            docContent += `Assessment: ${data.isAIGenerated ? "AI-Generated" : "Human-Written"}\n`;
            docContent += `Confidence: ${data.confidence}\n`;
          }
          
          if (data.description) {
            docContent += `Description: ${data.description}\n`;
          }
        });
      }
      
      // Disclaimer
      docContent += `\n\n${'='.repeat(50)}\n`;
      docContent += `This report was generated using the Author Originality Detector framework.\n`;
      docContent += `Report focuses on epistemic originality, not style, correctness, or theme novelty.\n`;

      // Create a blob and download with consistent encoding
      const encoder = new TextEncoder();
      const data = encoder.encode(docContent);
      const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      // Ensure filename is cleaned of any problematic characters
      const sanitizeForFilename = (str: string) => {
        if (!str) return 'untitled';
        return str.replace(/[^a-z0-9_\-]/gi, '_').slice(0, 50);
      };
      
      const fileName = isSinglePassageMode
        ? `author-originality-detector-${new Date().toISOString().split('T')[0]}.txt`
        : `author-originality-comparison-${new Date().toISOString().split('T')[0]}.txt`;
      
      console.log("Downloading report with content length:", docContent.length);
      
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsGenerating(false);
      toast({
        title: "Text Report Generated",
        description: `Your report has been downloaded as "${fileName}"`,
      });
    } catch (error) {
      console.error("Error generating text report:", error);
      setIsGenerating(false);
      toast({
        title: "Error Generating Report",
        description: "There was a problem creating your report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        className="w-full md:w-auto" 
        onClick={() => setOpen(true)}
      >
        Generate Comprehensive Report
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comprehensive Analysis Report</DialogTitle>
            <DialogDescription>
              A detailed analysis report of your document with actionable insights.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 my-4">
            <div className="border rounded-lg p-4 bg-muted/20">
              <h3 className="text-lg font-medium mb-2">Executive Summary</h3>
              <p className="text-sm text-muted-foreground">
                {generateReport().summary}
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Key Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div key={key} className="border rounded-lg p-3">
                    <h4 className="font-medium">{data.label}</h4>
                    )}
                    {data.level !== undefined && (
                      <p className="text-sm font-semibold mt-1">Level: {data.level}</p>
                    )}
                    {data.isAIGenerated !== undefined && (
                      <>
                        <p className="text-sm font-semibold mt-1">
                          Assessment: {data.isAIGenerated ? "AI-Generated" : "Human-Written"}
                        </p>
                        <p className="text-sm mt-1">Confidence: {data.confidence}</p>
                      </>
                    )}
                    {data.description && (
                      <p className="text-xs text-muted-foreground mt-1">{data.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Strengths</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {generateReport().strengths.map((strength: string, index: number) => (
                    <li key={index} className="text-sm">{strength}</li>
                  ))}
                </ul>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Areas for Improvement</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {generateReport().weaknesses.map((weakness: string, index: number) => (
                    <li key={index} className="text-sm">{weakness}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Improvement Recommendations</h3>
              <ul className="list-decimal pl-5 space-y-2">
                {generateReport().improvements.map((improvement: string, index: number) => (
                  <li key={index} className="text-sm">{improvement}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {/* Framework-specific TXT download buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {/* Always show TXT download buttons for current analysis */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={downloadOriginalityAnalysis}
                disabled={downloadingType === "originality"}
              >
                {downloadingType === "originality" ? "Downloading..." : "Originality TXT"}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={downloadIntelligenceAnalysis}
                disabled={downloadingType === "intelligence"}
              >
                {downloadingType === "intelligence" ? "Downloading..." : "Intelligence TXT"}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={downloadCogencyAnalysis}
                disabled={downloadingType === "cogency"}
              >
                {downloadingType === "cogency" ? "Downloading..." : "Cogency TXT"}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={downloadQualityAnalysis}
                disabled={downloadingType === "quality"}
              >
                {downloadingType === "quality" ? "Downloading..." : "Quality TXT"}
              </Button>
            </div>
            
            <Button 
              variant="secondary" 
              onClick={handleDownloadWord}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Download as Text"}
            </Button>
            <Button 
              onClick={handleDownloadPdf}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Download as PDF"}
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}