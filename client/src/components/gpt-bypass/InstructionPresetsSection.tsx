import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X } from 'lucide-react';
import { TextBox } from './TextBox';
import { 
  instructionPresets, 
  presetCategories, 
  getPresetsByCategory,
  getHighPriorityPresets
} from '../../data/instructionPresets';

interface InstructionPresetsSectionProps {
  selectedPresets: string[];
  setSelectedPresets: (presets: string[]) => void;
  customInstructions: string;
  setCustomInstructions: (instructions: string) => void;
}

export function InstructionPresetsSection({
  selectedPresets,
  setSelectedPresets,
  customInstructions,
  setCustomInstructions,
}: InstructionPresetsSectionProps) {
  const togglePreset = (presetKey: string) => {
    if (selectedPresets.includes(presetKey)) {
      setSelectedPresets(selectedPresets.filter(key => key !== presetKey));
    } else {
      setSelectedPresets([...selectedPresets, presetKey]);
    }
  };

  const removePreset = (presetKey: string) => {
    setSelectedPresets(selectedPresets.filter(key => key !== presetKey));
  };

  const clearAllPresets = () => {
    setSelectedPresets([]);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Instruction Presets</CardTitle>
          {selectedPresets.length > 0 && (
            <Button
              onClick={clearAllPresets}
              variant="ghost"
              size="sm"
              data-testid="button-clear-presets"
            >
              Clear All
            </Button>
          )}
        </div>
        
        {selectedPresets.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Selected Presets:</div>
            <div className="flex flex-wrap gap-2">
              {selectedPresets.map((presetId) => {
                const preset = instructionPresets.find(p => p.id === presetId);
                if (!preset) return null;
                return (
                  <Badge
                    key={presetId}
                    variant={preset.isHighPriority ? "destructive" : "secondary"}
                    className="flex items-center gap-1"
                    data-testid={`badge-preset-${presetId}`}
                  >
                    {preset.isHighPriority && <span className="text-xs">★</span>}
                    {preset.name}
                    <Button
                      onClick={() => removePreset(presetId)}
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                      data-testid={`button-remove-preset-${presetId}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Preset Categories */}
        <div className="space-y-4">
          <div className="text-sm font-medium">Available Presets (Top 8 most effective for humanization):</div>
          <ScrollArea className="h-64 w-full border rounded-lg">
            <div className="p-4 space-y-4">
              {presetCategories.map((category) => (
                <div key={category} className="space-y-2">
                  <div className={`text-sm font-semibold uppercase tracking-wide ${
                    category === 'Most Important for Humanization' 
                      ? 'text-red-600 bg-red-50 p-2 rounded' 
                      : 'text-gray-600'
                  }`}>
                    {category}
                  </div>
                  <div className="space-y-1">
                    {getPresetsByCategory(category).map((preset) => (
                      <div key={preset.id} className="space-y-1">
                        <Button
                          onClick={() => togglePreset(preset.id)}
                          variant={selectedPresets.includes(preset.id) ? 'default' : 'ghost'}
                          size="sm"
                          className={`w-full justify-start text-left ${
                            preset.isHighPriority ? 'border-red-200 bg-red-50' : ''
                          }`}
                          data-testid={`button-preset-${preset.id}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate flex items-center gap-2">
                              {preset.isHighPriority && <span className="text-red-500 text-xs">★</span>}
                              {preset.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {preset.description.slice(0, 80)}...
                            </div>
                          </div>
                        </Button>
                      </div>
                    ))}
                  </div>
                  {presetCategories.indexOf(category) < presetCategories.length - 1 && (
                    <Separator />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Custom Instructions */}
        <div className="space-y-2">
          <TextBox
            value={customInstructions}
            onChange={setCustomInstructions}
            placeholder="Enter custom rewriting instructions..."
            label="Custom Instructions"
            minHeight="120px"
            showCharCount
            data-testid="textbox-custom-instructions"
          />
        </div>
      </CardContent>
    </Card>
  );
}