import express from "express";
import { analyzeSingleDocument, analyzeTwoDocuments } from "./lib/new-anthropic.js";

const app = express();

// SINGLE DOCUMENT ANALYSIS ENDPOINTS
app.post("/api/analyze/single/:mode", async (req, res) => {
  try {
    const mode = req.params.mode as 'intelligence' | 'originality' | 'cogency' | 'overall_quality';
    if (!['intelligence', 'originality', 'cogency', 'overall_quality'].includes(mode)) {
      return res.status(400).json({ error: "Invalid mode. Must be one of: intelligence, originality, cogency, overall_quality" });
    }

    const { passage, analysisMode = 'quick' } = req.body;
    
    if (!passage?.text) {
      return res.status(400).json({ error: "Passage text is required" });
    }

    if (!['quick', 'comprehensive'].includes(analysisMode)) {
      return res.status(400).json({ error: "Analysis mode must be 'quick' or 'comprehensive'" });
    }

    console.log(`Single ${mode} analysis request:`, {
      title: passage.title || 'Untitled',
      textLength: passage.text.length,
      analysisMode
    });

    const result = await analyzeSingleDocument(passage, mode, analysisMode);
    
    res.json(result);
  } catch (error) {
    console.error(`Error in single ${req.params.mode} analysis:`, error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// TWO DOCUMENT ANALYSIS ENDPOINTS  
app.post("/api/analyze/compare/:mode", async (req, res) => {
  try {
    const mode = req.params.mode as 'intelligence' | 'originality' | 'cogency' | 'overall_quality';
    if (!['intelligence', 'originality', 'cogency', 'overall_quality'].includes(mode)) {
      return res.status(400).json({ error: "Invalid mode. Must be one of: intelligence, originality, cogency, overall_quality" });
    }

    const { passageA, passageB, analysisMode = 'quick' } = req.body;
    
    if (!passageA?.text || !passageB?.text) {
      return res.status(400).json({ error: "Both passage texts are required" });
    }

    if (!['quick', 'comprehensive'].includes(analysisMode)) {
      return res.status(400).json({ error: "Analysis mode must be 'quick' or 'comprehensive'" });
    }

    console.log(`Compare ${mode} analysis request:`, {
      passageATitle: passageA.title || 'Untitled A',
      passageALength: passageA.text.length,
      passageBTitle: passageB.title || 'Untitled B', 
      passageBLength: passageB.text.length,
      analysisMode
    });

    const result = await analyzeTwoDocuments(passageA, passageB, mode, analysisMode);
    
    res.json(result);
  } catch (error) {
    console.error(`Error in compare ${req.params.mode} analysis:`, error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// DOWNLOAD REPORT ENDPOINT
app.post("/api/download/:mode", async (req, res) => {
  try {
    const mode = req.params.mode;
    const { analysisResult, passageTitle = 'Untitled' } = req.body;
    
    if (!analysisResult) {
      return res.status(400).json({ error: "Analysis result is required" });
    }

    // Generate text report
    const report = generateTextReport(analysisResult, mode, passageTitle);
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${mode}-analysis-${passageTitle.replace(/[^a-zA-Z0-9]/g, '-')}.txt"`);
    res.send(report);
  } catch (error) {
    console.error(`Error generating download:`, error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

function generateTextReport(analysisResult: any, mode: string, title: string): string {
  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString();
  
  let report = `${mode.toUpperCase()} ANALYSIS REPORT\n`;
  report += `============================================================\n\n`;
  report += `Document: ${title}\n`;
  report += `Analysis Date: ${date}, ${time}\n\n`;

  // Handle single document analysis
  if (typeof analysisResult === 'object' && !analysisResult.documentA && !analysisResult.documentB) {
    const questions = Object.keys(analysisResult);
    
    for (let i = 0; i < questions.length; i++) {
      const questionKey = questions[i];
      const result = analysisResult[questionKey];
      
      if (result) {
        report += `${i + 1}. Question ${questionKey}\n`;
        report += `----------------------------------------\n`;
        report += `Question: ${result.question}\n`;
        report += `Score: ${result.score}/100\n`;
        report += `Quotation: "${result.quotation}"\n`;
        report += `Explanation: ${result.explanation}\n\n`;
      } else {
        report += `${i + 1}. Question ${questionKey}\n`;
        report += `----------------------------------------\n`;
        report += `No data available for this question\n\n`;
      }
    }
  }
  
  // Handle two document comparison
  else if (analysisResult.documentA && analysisResult.documentB) {
    report += `DOCUMENT A ANALYSIS:\n`;
    report += `====================\n\n`;
    
    const questionsA = Object.keys(analysisResult.documentA);
    for (let i = 0; i < questionsA.length; i++) {
      const questionKey = questionsA[i];
      const result = analysisResult.documentA[questionKey];
      
      if (result) {
        report += `${i + 1}. Question ${questionKey}\n`;
        report += `----------------------------------------\n`;
        report += `Question: ${result.question}\n`;
        report += `Score: ${result.score}/100\n`;
        report += `Quotation: "${result.quotation}"\n`;
        report += `Explanation: ${result.explanation}\n\n`;
      }
    }
    
    report += `\nDOCUMENT B ANALYSIS:\n`;
    report += `====================\n\n`;
    
    const questionsB = Object.keys(analysisResult.documentB);
    for (let i = 0; i < questionsB.length; i++) {
      const questionKey = questionsB[i];
      const result = analysisResult.documentB[questionKey];
      
      if (result) {
        report += `${i + 1}. Question ${questionKey}\n`;
        report += `----------------------------------------\n`;
        report += `Question: ${result.question}\n`;
        report += `Score: ${result.score}/100\n`;
        report += `Quotation: "${result.quotation}"\n`;
        report += `Explanation: ${result.explanation}\n\n`;
      }
    }
    
    if (analysisResult.comparison) {
      report += `\nCOMPARISON REPORT:\n`;
      report += `==================\n\n`;
      report += `${analysisResult.comparison}\n\n`;
    }
  }

  report += `\nReport generated by Originality Meter\n`;
  report += `Analysis completed on ${date}, ${time}\n`;

  return report;
}

export default app;