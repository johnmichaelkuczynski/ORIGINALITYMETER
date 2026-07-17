import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { AnalysisResult, PassageData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Mail } from "lucide-react";


interface EnhancedComprehensiveReportProps {
  result: AnalysisResult;
  passageA: PassageData;
  passageB?: PassageData;
  isSinglePassageMode?: boolean;
}

export default function EnhancedComprehensiveReport({
  result,
  passageA,
  passageB,
  isSinglePassageMode = false
}: EnhancedComprehensiveReportProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportContent, setReportContent] = useState<string>("");
  const { toast } = useToast();

  const generateComprehensiveReport = async () => {
    setIsGenerating(true);
    
    try {
      // Generate comprehensive report with detailed analysis
      const response = await fetch('/api/generate-comprehensive-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          result,
          passageA,
          passageB: isSinglePassageMode ? undefined : passageB,
          isSinglePassageMode
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setReportContent(data.report);
        setOpen(true);
      } else {
        throw new Error(data.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      toast({
        title: 'Report Generation Failed',
        description: 'Unable to generate comprehensive report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = async (format: 'pdf' | 'txt' | 'html') => {
    if (!reportContent) return;

    try {
      const response = await fetch('/api/download-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: reportContent,
          format,
          title: `Comprehensive Originality Analysis Report - ${new Date().toLocaleDateString()}`
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comprehensive-report.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: 'Report Downloaded',
          description: `Comprehensive report downloaded as ${format.toUpperCase()}.`,
        });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: 'Download Failed',
        description: 'Unable to download report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={generateComprehensiveReport}
        disabled={isGenerating}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        {isGenerating ? 'Generating...' : 'Comprehensive Report'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comprehensive Originality Analysis Report</DialogTitle>
            <DialogDescription>
              Complete analysis with quotations, detailed metrics, and in-depth evaluation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reportContent ? (
              <div 
                className="prose prose-sm max-w-none border rounded-lg p-6 bg-gray-50 math-container"
                dangerouslySetInnerHTML={{ __html: reportContent }}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                Generate a comprehensive report to view detailed analysis with quotations and evidence.
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => downloadReport('pdf')}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadReport('html')}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download HTML
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadReport('txt')}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download TXT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}