import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TextBox } from './TextBox';
import { writingSamples, getSampleById } from '../../data/writingSamples';

interface StyleMixingSectionProps {
  styleText: string;
  setStyleText: (text: string) => void;
  contentMixText: string;
  setContentMixText: (text: string) => void;
  mixingMode: 'style' | 'content' | 'both';
  setMixingMode: (mode: 'style' | 'content' | 'both') => void;
}

export function StyleMixingSection({
  styleText,
  setStyleText,
  contentMixText,
  setContentMixText,
  mixingMode,
  setMixingMode,
}: StyleMixingSectionProps) {
  // Set default to "Formal and Functional Relationships" on mount
  useEffect(() => {
    if (!styleText) {
      const defaultSample = getSampleById('formal-functional-relationships');
      if (defaultSample) {
        setStyleText(defaultSample.content);
      }
    }
  }, [styleText, setStyleText]);

  const handleStyleSampleSelect = (sampleKey: string) => {
    const sample = getSampleById(sampleKey);
    if (sample) {
      setStyleText(sample.content);
    }
  };

  const handleContentSampleSelect = (sampleKey: string) => {
    const sample = getSampleById(sampleKey);
    if (sample) {
      setContentMixText(sample.content);
    }
  };

  const renderSampleSelect = (onSelect: (key: string) => void, label: string, currentValue?: string) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Select onValueChange={onSelect} defaultValue="formal-functional-relationships">
        <SelectTrigger data-testid={`select-${label.toLowerCase().replace(' ', '-')}`}>
          <SelectValue placeholder="Choose a sample..." />
        </SelectTrigger>
        <SelectContent>
          {writingSamples.map((sample) => (
            <SelectItem key={sample.id} value={sample.id}>
              {sample.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Style & Content Mixing</CardTitle>
        <div className="flex gap-2">
          <Button
            variant={mixingMode === 'style' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMixingMode('style')}
            data-testid="button-mode-style"
          >
            Style Only
          </Button>
          <Button
            variant={mixingMode === 'content' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMixingMode('content')}
            data-testid="button-mode-content"
          >
            Content Only
          </Button>
          <Button
            variant={mixingMode === 'both' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMixingMode('both')}
            data-testid="button-mode-both"
          >
            Both
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(mixingMode === 'style' || mixingMode === 'both') && (
          <div className="space-y-3">
            {renderSampleSelect(handleStyleSampleSelect, 'Style Sample', styleText)}
            <TextBox
              value={styleText}
              onChange={setStyleText}
              placeholder="Enter style reference text..."
              label="Style Reference Text"
              minHeight="150px"
              showWordCount
              data-testid="textbox-style"
            />
          </div>
        )}

        {(mixingMode === 'content' || mixingMode === 'both') && (
          <div className="space-y-3">
            {renderSampleSelect(handleContentSampleSelect, 'Content Sample', contentMixText)}
            <TextBox
              value={contentMixText}
              onChange={setContentMixText}
              placeholder="Enter content reference text..."
              label="Content Reference Text"
              minHeight="150px"
              showWordCount
              data-testid="textbox-content"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}