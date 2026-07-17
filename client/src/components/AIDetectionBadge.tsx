import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AIDetectionResult } from '@/lib/types';
import { Loader2, AlertCircle, Check, ExternalLink } from 'lucide-react';

interface AIDetectionBadgeProps {
  result: AIDetectionResult | null;
  isDetecting: boolean;
  textId: string;
  onDetect?: () => void;
  className?: string;
}

export default function AIDetectionBadge({ 
  result, 
  isDetecting, 
  textId, 
  onDetect,
  className = ""
}: AIDetectionBadgeProps) {
  
  // If we're detecting, show loading state
  if (isDetecting) {
    return (
      <Badge variant="outline" className={`bg-slate-100 text-slate-700 ${className}`}>
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
        Detecting AI
      </Badge>
    );
  }
  
  // If we have a result, show appropriate badge
  if (result) {
    // Colors based on the confidence and whether it's AI-generated
    let badgeColor = '';
    let textColor = '';
    let icon = null;
    
    if (result.isAIGenerated) {
      if (result.confidence === 'High') {
        badgeColor = 'bg-red-100';
        textColor = 'text-red-700';
        icon = <AlertCircle className="h-3 w-3 mr-1 text-red-600" />;
      } else if (result.confidence === 'Medium') {
        badgeColor = 'bg-amber-100';
        textColor = 'text-amber-700';
        icon = <AlertCircle className="h-3 w-3 mr-1 text-amber-600" />;
      } else {
        badgeColor = 'bg-yellow-100';
        textColor = 'text-yellow-700';
        icon = <AlertCircle className="h-3 w-3 mr-1 text-yellow-600" />;
      }
    } else {
      badgeColor = 'bg-green-100';
      textColor = 'text-green-700';
      icon = <Check className="h-3 w-3 mr-1 text-green-600" />;
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`${badgeColor} ${textColor} ${className}`}
            >
              {icon}
              {result.isAIGenerated 
                ? `AI Content (${result.confidence})` 
                : `Human-Written (${result.confidence})`}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="text-sm">
              <div className="font-semibold">
                {result.isAIGenerated 
                  ? `AI Content Detected (${result.confidence} Confidence)` 
                  : `Likely Human-Written (${result.confidence} Confidence)`}
              </div>
              <div className="text-xs mt-1">{result.details || 'No additional details available'}</div>
              <div className="text-xs mt-1 flex items-center text-slate-500">
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // If no result yet and we have a callback to detect
  if (onDetect) {
    return (
      <Badge 
        variant="outline" 
        className={`bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer ${className}`}
        onClick={onDetect}
      >
        <ExternalLink className="h-3 w-3 mr-1" />
        Detect AI
      </Badge>
    );
  }
  
  // Fallback - empty badge
  return null;
}