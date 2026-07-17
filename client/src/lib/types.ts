export interface PassageData {
  title: string;
  text: string;
  userContext?: string;
}

export interface FeedbackData {
  comment: string;
  aiResponse: string;
  isRevised: boolean;
}

export interface SupportingDocument {
  title: string;
  content: string;
}

export interface AnalysisResult {
  userContext?: string;
  conceptualLineage?: {
    passageA?: {
      primaryInfluences: string | string[];
      intellectualTrajectory: string;
      secondaryInfluences?: string | string[];
    };
    passageB?: {
      primaryInfluences: string | string[];
      intellectualTrajectory: string;
      secondaryInfluences?: string | string[];
    };
    feedback?: FeedbackData;
  };
  semanticDistance?: {
    passageA?: {
      distance: number;
      label: string;
    };
    passageB?: {
      distance: number;
      label: string;
    };
    keyFindings?: string[];
    semanticInnovation?: string;
    feedback?: FeedbackData;
  };
  noveltyHeatmap?: {
    passageA?: Array<{
      content: string;
      heat: number;
      quote?: string;
      explanation?: string;
    }>;
    passageB?: Array<{
      content: string;
      heat: number;
      quote?: string;
      explanation?: string;
    }>;
    feedback?: FeedbackData;
  };
  derivativeIndex?: {
    passageA?: {
      components?: Array<{
        name: string;
      }>;
      description?: string;
      assessment?: string;
    };
    passageB?: {
      components?: Array<{
        name: string;
      }>;
      description?: string;
      assessment?: string;
    };
    feedback?: FeedbackData;
  };
  conceptualParasite?: {
    passageA?: {
      level: "Low" | "Moderate" | "High";
      elements: string[];
      assessment: string;
    };
    passageB?: {
      level: "Low" | "Moderate" | "High";
      elements: string[];
      assessment: string;
    };
    feedback?: FeedbackData;
  };
  parasiteIndex?: {
    passageA?: {
      level: "Low" | "Moderate" | "High";
      description?: string;
    };
    passageB?: {
      level: "Low" | "Moderate" | "High";
      description?: string;
    };
  };
  coherence?: {
    passageA?: {
      assessment: string;
      strengths: string[];
      weaknesses: string[];
      description?: string;
    };
    passageB?: {
      assessment: string;
      strengths: string[];
      weaknesses: string[];
      description?: string;
    };
    feedback?: FeedbackData;
  };
  accuracy?: {
    passageA?: {
      assessment: string;
      strengths: string[];
      weaknesses: string[];
    };
    passageB?: {
      assessment: string;
      strengths: string[];
      weaknesses: string[];
    };
    feedback?: FeedbackData;
  };
  depth?: {
    passageA?: {
      assessment: string;
      strengths: string[];
      weaknesses: string[];
    };
    passageB?: {
      assessment: string;
      strengths: string[];
      weaknesses: string[];
    };
    feedback?: FeedbackData;
  };
  clarity?: {
    passageA?: {
      assessment: string;
      strengths: string[];
      weaknesses: string[];
    };
    passageB?: {
      assessment: string;
      strengths: string[];
      weaknesses: string[];
    };
    feedback?: FeedbackData;
  };
  novelty?: {
    passageA?: {
      description?: string;
      assessment?: string;
    };
    passageB?: {
      description?: string;
      assessment?: string;
    };
  };
  conceptualOverlap?: {
    description?: string;
  };
  aiDetection?: {
    passageA?: {
      isAIGenerated: boolean;
      confidence: string;
      details?: string;
      score?: number;
    };
    passageB?: {
      isAIGenerated: boolean;
      confidence: string;
      details?: string;
      score?: number;
    };
  };
  verdict: string;
  supportingDocuments?: SupportingDocument[];
  reportContent?: string;
  
  // Raw framework analysis data
  rawOriginalityAnalysis?: any;
  rawIntelligenceAnalysis?: any;
  rawCogencyAnalysis?: any;
  rawQualityAnalysis?: any;
}

export interface AnalyzePassagesRequest {
  passageA: PassageData;
  passageB: PassageData;
}

export interface SubmitFeedbackRequest {
  analysisId: number;
  category: 'conceptualLineage' | 'semanticDistance' | 'noveltyHeatmap' | 'derivativeIndex' | 'conceptualParasite' | 'coherence' | 'accuracy' | 'depth' | 'clarity';
  feedback: string;
  supportingDocument?: SupportingDocument;
  originalResult: AnalysisResult;
  passageA: PassageData;
  passageB: PassageData;
  isSinglePassageMode: boolean;
}

export type StyleOption = 'keep-voice' | 'academic' | 'punchy' | 'prioritize-originality';

export interface GenerateOriginalVersionRequest {
  passage: PassageData;
  analysisResult: AnalysisResult;
  styleOption?: StyleOption;
  customInstructions?: string;
}

export interface GeneratedPassageResult {
  originalPassage: PassageData;
  improvedPassage: PassageData;
  estimatedDerivativeIndex: number;
  improvementSummary: string;
}

export interface AIDetectionResult {
  isAIGenerated: boolean;
  confidence: string;  // "Low", "Medium", "High"
  details?: string;    // Optional explanation
}
