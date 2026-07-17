import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface TextBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  minHeight?: string;
  showWordCount?: boolean;
  showCharCount?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  'data-testid'?: string;
}

export function TextBox({
  value,
  onChange,
  placeholder = "Enter your text here...",
  label,
  minHeight = "200px",
  showWordCount = false,
  showCharCount = false,
  disabled = false,
  readOnly = false,
  className,
  'data-testid': testId,
}: TextBoxProps) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={`${className} ${readOnly ? 'cursor-text select-text' : ''}`}
          style={{ minHeight }}
          data-testid={testId}
        />
        
        {(showWordCount || showCharCount) && (
          <div className="flex gap-2 mt-2 justify-end">
            {showWordCount && (
              <Badge variant="outline" className="text-xs">
                {wordCount} words
              </Badge>
            )}
            {showCharCount && (
              <Badge variant="outline" className="text-xs">
                {charCount} characters
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}