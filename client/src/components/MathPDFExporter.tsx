import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';

interface MathPDFExporterProps {
  content: string;
  title: string;
  buttonText?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  icon?: 'download' | 'print';
}

export function MathPDFExporter({ 
  content, 
  title, 
  buttonText = 'Save as PDF',
  variant = 'outline',
  icon = 'download'
}: MathPDFExporterProps) {
  const printContentRef = useRef<HTMLDivElement>(null);

  const handlePrintToPDF = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to save as PDF');
      return;
    }

    // Process content to ensure proper MathJax formatting
    let processedContent = content;
    
    // Convert markdown math notation to MathJax format if not already converted
    if (!processedContent.includes('\\(') && !processedContent.includes('\\[')) {
      // Convert inline math $...$ to \(...\)
      processedContent = processedContent.replace(/\$([^$]+)\$/g, '\\($1\\)');
      // Convert display math $$...$$ to \[...\]
      processedContent = processedContent.replace(/\$\$([^$]+)\$\$/g, '\\[$1\\]');
    }
    
    // Convert markdown formatting
    processedContent = processedContent
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    // Wrap in paragraphs
    if (!processedContent.includes('<p>')) {
      processedContent = `<p>${processedContent}</p>`;
    }
    
    // Clean up empty paragraphs
    processedContent = processedContent.replace(/<p><\/p>/g, '').replace(/<p><br><\/p>/g, '');

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <!-- MathJax Configuration -->
    <script>
        window.MathJax = {
            tex: {
                inlineMath: [['\\\\(', '\\\\)']],
                displayMath: [['\\\\[', '\\\\]']],
                processEscapes: true,
                processEnvironments: true,
                packages: {'[+]': ['ams', 'newcommand', 'configmacros']}
            },
            options: {
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
                processHtmlClass: 'math-container'
            },
            startup: {
                ready() {
                    MathJax.startup.defaultReady();
                    // Wait for MathJax to finish rendering before showing print dialog
                    MathJax.startup.promise.then(() => {
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    });
                }
            }
        };
    </script>
    <script type="text/javascript" id="MathJax-script" async
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js">
    </script>
    
    <style>
        @media print {
            @page {
                margin: 0.75in;
                size: letter;
            }
            
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .no-print {
                display: none !important;
            }
        }
        
        body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
            background: white;
            max-width: none;
            margin: 0;
            padding: 20px;
        }
        
        h1 {
            font-size: 18pt;
            font-weight: bold;
            margin: 0 0 20px 0;
            page-break-after: avoid;
        }
        
        h2 {
            font-size: 16pt;
            font-weight: bold;
            margin: 20px 0 10px 0;
            page-break-after: avoid;
        }
        
        h3 {
            font-size: 14pt;
            font-weight: bold;
            margin: 15px 0 8px 0;
            page-break-after: avoid;
        }
        
        p {
            margin: 0 0 12px 0;
            text-align: justify;
            orphans: 2;
            widows: 2;
        }
        
        /* Math styling */
        .MathJax {
            font-size: inherit !important;
        }
        
        mjx-container[display="true"] {
            margin: 15px 0 !important;
            text-align: center;
        }
        
        mjx-container[display="false"] {
            margin: 0 2px;
        }
        
        /* Ensure proper page breaks */
        .page-break-before {
            page-break-before: always;
        }
        
        .page-break-after {
            page-break-after: always;
        }
        
        .no-break {
            page-break-inside: avoid;
        }
        
        /* Fix for equations that might break */
        mjx-math {
            page-break-inside: avoid;
        }
        
        strong {
            font-weight: bold;
        }
        
        em {
            font-style: italic;
        }
    </style>
</head>
<body class="math-container">
    <h1>${title}</h1>
    <div class="content">
        ${processedContent}
    </div>
    
    <script>
        // Fallback if MathJax doesn't load
        setTimeout(() => {
            if (!window.MathJax) {
                window.print();
                window.close();
            }
        }, 3000);
    </script>
</body>
</html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Focus the print window
    printWindow.focus();
  };

  const IconComponent = icon === 'print' ? Printer : Download;

  return (
    <Button
      onClick={handlePrintToPDF}
      variant={variant}
      className="flex items-center gap-2"
    >
      <IconComponent className="h-4 w-4" />
      {buttonText}
    </Button>
  );
}