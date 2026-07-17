import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { printElementById } from '@/lib/printToPdf';

interface PDFExporterProps {
  elementId: string;
  filename?: string;
  title?: string;
}

export default function PDFExporter({ 
  elementId, 
  filename = "document",
  title = "Export PDF"
}: PDFExporterProps) {
  
  const exportToPDF = async () => {
    try {
      // Wait a moment for any math rendering to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      printElementById(elementId, filename, { withMathJax: true });
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <Button 
      onClick={exportToPDF}
      variant="outline"
      className="flex items-center gap-2"
    >
      <FileText className="w-4 h-4" />
      {title}
    </Button>
  );
}
