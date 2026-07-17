import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function splitIntoParagraphs(text: string): string[] {
  if (!text) return [];
  
  // Split by double newlines or single newlines
  const paragraphs = text.split(/\n\n|\n/).filter(p => p.trim().length > 0);
  
  // If no paragraphs were found (no newlines), treat the whole text as one paragraph
  if (paragraphs.length === 0 && text.trim().length > 0) {
    return [text.trim()];
  }
  
  return paragraphs;
}

/**
 * Returns a tailwind color class based on the score value
 * @param score A score from 0-10
 * @returns A Tailwind CSS class for background color
 */
export function getScoreColorClass(score: number): string {
  if (score >= 8) return 'bg-green-600';
  if (score >= 6) return 'bg-green-500';
  if (score >= 4) return 'bg-amber-500';
  if (score >= 2) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * Returns a tailwind text color class based on the score value
 * @param score A score from 0-10
 * @returns A Tailwind CSS class for text color
 */
export function getScoreTextColorClass(score: number): string {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-green-500';
  if (score >= 4) return 'text-amber-500';
  if (score >= 2) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Returns a label for a score
 * @param score A score from 0-10
 * @param type The type of score (originality, coherence, etc.)
 * @returns A human-readable label for the score
 */
export function getScoreLabel(score: number, type: string): string {
  const highLabel = type === 'originality' ? 'High Originality' : 
                    type === 'coherence' ? 'High Coherence' : 'Excellent';
  
  const moderateLabel = type === 'originality' ? 'Moderate Originality' : 
                        type === 'coherence' ? 'Moderate Coherence' : 'Good';
  
  const lowLabel = type === 'originality' ? 'Low Originality' : 
                   type === 'coherence' ? 'Low Coherence' : 'Fair';
  
  if (score >= 7) return highLabel;
  if (score >= 4) return moderateLabel;
  return lowLabel;
}
