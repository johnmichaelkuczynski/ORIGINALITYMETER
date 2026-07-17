import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TextSharingContextType {
  // Functions to send text to different components
  sendToHumanizer: (text: string) => void;
  sendToHomeworkHelper: (text: string) => void;
  sendToDocumentRewriter: (text: string) => void;
  sendToOriginalityAnalysis: (text: string) => void;
  
  // State for pending text transfers
  pendingTexts: {
    humanizer: string | null;
    homeworkHelper: string | null;
    documentRewriter: string | null;
    originalityAnalysis: string | null;
  };
  
  // Functions to consume pending texts
  consumeHumanizerText: () => string | null;
  consumeHomeworkHelperText: () => string | null;
  consumeDocumentRewriterText: () => string | null;
  consumeOriginalityAnalysisText: () => string | null;
}

const TextSharingContext = createContext<TextSharingContextType | undefined>(undefined);

export function TextSharingProvider({ children }: { children: ReactNode }) {
  const [pendingTexts, setPendingTexts] = useState({
    humanizer: null as string | null,
    homeworkHelper: null as string | null,
    documentRewriter: null as string | null,
    originalityAnalysis: null as string | null,
  });

  const sendToHumanizer = (text: string) => {
    setPendingTexts(prev => ({ ...prev, humanizer: text }));
    // Scroll to GPT Bypass section
    setTimeout(() => {
      document.getElementById('gpt-bypass')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendToHomeworkHelper = (text: string) => {
    setPendingTexts(prev => ({ ...prev, homeworkHelper: text }));
    // Scroll to Homework Helper section
    setTimeout(() => {
      document.getElementById('homework-helper')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendToDocumentRewriter = (text: string) => {
    setPendingTexts(prev => ({ ...prev, documentRewriter: text }));
    // Scroll to Document Rewriter section
    setTimeout(() => {
      document.getElementById('document-rewriter')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendToOriginalityAnalysis = (text: string) => {
    setPendingTexts(prev => ({ ...prev, originalityAnalysis: text }));
    // Scroll to Originality Analysis section
    setTimeout(() => {
      document.getElementById('originality-analysis')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const consumeHumanizerText = () => {
    const text = pendingTexts.humanizer;
    if (text) {
      setPendingTexts(prev => ({ ...prev, humanizer: null }));
    }
    return text;
  };

  const consumeHomeworkHelperText = () => {
    const text = pendingTexts.homeworkHelper;
    if (text) {
      setPendingTexts(prev => ({ ...prev, homeworkHelper: null }));
    }
    return text;
  };

  const consumeDocumentRewriterText = () => {
    const text = pendingTexts.documentRewriter;
    if (text) {
      setPendingTexts(prev => ({ ...prev, documentRewriter: null }));
    }
    return text;
  };

  const consumeOriginalityAnalysisText = () => {
    const text = pendingTexts.originalityAnalysis;
    if (text) {
      setPendingTexts(prev => ({ ...prev, originalityAnalysis: null }));
    }
    return text;
  };

  const value = {
    sendToHumanizer,
    sendToHomeworkHelper,
    sendToDocumentRewriter,
    sendToOriginalityAnalysis,
    pendingTexts,
    consumeHumanizerText,
    consumeHomeworkHelperText,
    consumeDocumentRewriterText,
    consumeOriginalityAnalysisText,
  };

  return (
    <TextSharingContext.Provider value={value}>
      {children}
    </TextSharingContext.Provider>
  );
}

export function useTextSharing() {
  const context = useContext(TextSharingContext);
  if (context === undefined) {
    throw new Error('useTextSharing must be used within a TextSharingProvider');
  }
  return context;
}