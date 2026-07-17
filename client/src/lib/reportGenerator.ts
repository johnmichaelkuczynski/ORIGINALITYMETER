import { AnalysisResult, PassageData } from "./types";
import { printElementById, printHtmlDocument, escapeHtml } from "./printToPdf";

/**
 * Generates a PDF from an element on the page (via browser print-to-PDF).
 */
export async function generatePdfFromElement(
  elementId: string,
  passageATitle: string,
  passageBTitle: string,
  isSinglePassageMode: boolean = false
) {
  const title = isSinglePassageMode
    ? `Analysis: ${passageATitle}`
    : `Comparison: ${passageATitle} & ${passageBTitle}`;

  try {
    printElementById(elementId, title, { withMathJax: true });
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

/**
 * Generates a structured report from analysis data (via browser print-to-PDF).
 */
export function generateReportFromData(
  result: AnalysisResult,
  passageATitle: string,
  passageBTitle: string,
  isSinglePassageMode: boolean = false
) {
  try {
    const title = isSinglePassageMode
      ? `Analysis Report: ${passageATitle}`
      : `Comparison Report: ${passageATitle} & ${passageBTitle}`;

    const sections: string[] = [];
    sections.push(`<h1>${escapeHtml(title)}</h1>`);
    sections.push(`<p class="muted">Generated on: ${escapeHtml(new Date().toLocaleDateString())}</p><hr />`);

    sections.push(`<h2>Originality Metrics</h2>`);

    if (result.conceptualOverlap) {
      const overlapData: any = isSinglePassageMode
        ? result.conceptualOverlap.passageA
        : result.conceptualOverlap;
      sections.push(`<h3>Conceptual Distinctiveness</h3>`);
      if (overlapData?.description) {
        sections.push(`<p>${escapeHtml(overlapData.description)}</p>`);
      }
    }

    if (result.novelty) {
      const noveltyData: any = isSinglePassageMode
        ? result.novelty.passageA
        : result.novelty;
      sections.push(`<h3>Originality Score</h3>`);
      if (noveltyData?.description) {
        sections.push(`<p>${escapeHtml(noveltyData.description)}</p>`);
      }
    }

    if (result.conceptualLineage) {
      const lineageData: any = isSinglePassageMode
        ? result.conceptualLineage.passageA
        : result.conceptualLineage;
      sections.push(`<h3>Intellectual Framework</h3>`);
      if (lineageData?.primaryInfluences?.length) {
        sections.push(`<p><em>Primary Influences:</em></p><ul>${lineageData.primaryInfluences
          .map((i: string) => `<li>${escapeHtml(i)}</li>`)
          .join("")}</ul>`);
      }
      if (lineageData?.secondaryInfluences?.length) {
        sections.push(`<p><em>Secondary Influences:</em></p><ul>${lineageData.secondaryInfluences
          .map((i: string) => `<li>${escapeHtml(i)}</li>`)
          .join("")}</ul>`);
      }
      if (!isSinglePassageMode && lineageData?.description) {
        sections.push(`<p>${escapeHtml(lineageData.description)}</p>`);
      }
    }

    if (result.aiDetection) {
      sections.push(`<h3>AI Detection Results</h3>`);
      if (result.aiDetection.passageA) {
        sections.push(`<p>Passage A (${escapeHtml(passageATitle)}): ${
          result.aiDetection.passageA.isAIGenerated ? "Likely AI-generated" : "Likely human-written"
        } (Confidence: ${escapeHtml(String(result.aiDetection.passageA.confidence))})</p>`);
        if (result.aiDetection.passageA.details) {
          sections.push(`<p>${escapeHtml(result.aiDetection.passageA.details)}</p>`);
        }
      }
      if (!isSinglePassageMode && result.aiDetection.passageB) {
        sections.push(`<p>Passage B (${escapeHtml(passageBTitle)}): ${
          result.aiDetection.passageB.isAIGenerated ? "Likely AI-generated" : "Likely human-written"
        } (Confidence: ${escapeHtml(String(result.aiDetection.passageB.confidence))})</p>`);
        if (result.aiDetection.passageB.details) {
          sections.push(`<p>${escapeHtml(result.aiDetection.passageB.details)}</p>`);
        }
      }
    }

    printHtmlDocument(title, sections.join("\n"), { withMathJax: false });
    return;
  } catch (error) {
    console.error("Error generating text report:", error);
    throw error;
  }
}

/**
 * Generates a comprehensive analysis report
 */
export async function generateComprehensiveReport(
  result: AnalysisResult,
  passageA: PassageData,
  passageB?: PassageData,
  isSinglePassageMode: boolean = false
): Promise<any> {
  try {
    // Simulate API call to generate comprehensive report
    // In a real implementation, this would call the server to generate a detailed report
    return new Promise((resolve) => {
      setTimeout(() => {
        // Extract data points from the analysis result
        const reportData = {
          summary: generateSummary(result, passageA, passageB, isSinglePassageMode),
          scores: extractScores(result, isSinglePassageMode),
          strengths: extractStrengths(result, isSinglePassageMode),
          weaknesses: extractWeaknesses(result, isSinglePassageMode),
          improvements: generateImprovementSuggestions(result, passageA, isSinglePassageMode),
          literatureContext: generateLiteratureContext(result, isSinglePassageMode)
        };
        
        resolve(reportData);
      }, 1500); // Simulate processing time
    });
  } catch (error) {
    console.error("Error generating comprehensive report:", error);
    throw error;
  }
}

/**
 * Generate a summary of the analysis result
 */
function generateSummary(
  result: AnalysisResult,
  passageA: PassageData,
  passageB?: PassageData,
  isSinglePassageMode: boolean = false
): string {
  let summary = "";
  
  if (isSinglePassageMode) {
    // Single passage mode summary
    const title = passageA.title || "The document";
    const originalityLabel = result.novelty?.passageA?.label || "Unknown";
    const aiGenerated = result.aiDetection?.passageA?.isAIGenerated;
    
    summary = `${title} demonstrates ${originalityLabel.toLowerCase()} levels of originality (${originalityScore}/10) within its intellectual framework. `;
    
    if (result.conceptualLineage?.passageA?.primaryInfluences?.length) {
      const influences = result.conceptualLineage.passageA.primaryInfluences.slice(0, 3).join(", ");
      summary += `The work shows clear influences from ${influences}. `;
    }
    
    if (aiGenerated !== undefined) {
      summary += `Analysis indicates the text is ${aiGenerated ? "likely AI-generated" : "likely human-written"}. `;
    }
    
    if (result.parasiteIndex?.passageA?.level) {
      summary += `The document shows a ${result.parasiteIndex.passageA.level.toLowerCase()} level of conceptual parasitism. `;
    }
    
    summary += `\n\nThis comprehensive report provides a detailed analysis of the document's originality, strengths, weaknesses, and suggested improvements to enhance both the quality and originality of the work.`;
  } else {
    // Comparison mode summary
    const titleA = passageA.title || "Document A";
    const titleB = passageB?.title || "Document B";
    const overlapLabel = result.conceptualOverlap?.label || "Unknown";
    
    summary = `The comparison between "${titleA}" and "${titleB}" reveals ${overlapLabel.toLowerCase()} conceptual distinctiveness (${overlapScore}/10). `;
    
      
      if (noveltyA > noveltyB) {
        summary += `"${titleA}" demonstrates higher originality (${noveltyA}/10) compared to "${titleB}" (${noveltyB}/10). `;
      } else if (noveltyB > noveltyA) {
        summary += `"${titleB}" demonstrates higher originality (${noveltyB}/10) compared to "${titleA}" (${noveltyA}/10). `;
      } else {
        summary += `Both documents show similar levels of originality (${noveltyA}/10). `;
      }
    }
    
    if (result.aiDetection?.passageA && result.aiDetection?.passageB) {
      const aiA = result.aiDetection.passageA.isAIGenerated;
      const aiB = result.aiDetection.passageB.isAIGenerated;
      
      if (aiA && aiB) {
        summary += `Both documents appear to be AI-generated. `;
      } else if (aiA && !aiB) {
        summary += `"${titleA}" appears AI-generated, while "${titleB}" appears human-written. `;
      } else if (!aiA && aiB) {
        summary += `"${titleA}" appears human-written, while "${titleB}" appears AI-generated. `;
      } else {
        summary += `Both documents appear to be human-written. `;
      }
    }
    
    summary += `\n\nThis comparative analysis explores the conceptual relationship between these works, highlighting their similarities, differences, and respective strengths and weaknesses.`;
  }
  
  return summary;
}

/**
 * Extract scores and justifications from the analysis result
 */
function extractScores(
  result: AnalysisResult,
  isSinglePassageMode: boolean = false
): Record<string, any> {
  const scores: Record<string, any> = {};
  
  if (isSinglePassageMode) {
    // Single passage mode scores
    
    // Originality
    if (result.novelty?.passageA) {
      scores.originality = {
        label: "Originality",
        justification: result.novelty.passageA.description || "No justification provided.",
        quotes: extractSupportingQuotes(result, "novelty", isSinglePassageMode)
      };
    }
    
    // Conceptual Framework
    if (result.conceptualLineage?.passageA) {
      let justification = "The document shows influences from ";
      
      if (result.conceptualLineage.passageA.primaryInfluences?.length) {
        justification += "primary sources: " + result.conceptualLineage.passageA.primaryInfluences.join(", ");
      }
      
      if (result.conceptualLineage.passageA.secondaryInfluences?.length) {
        justification += result.conceptualLineage.passageA.primaryInfluences?.length 
          ? "; and secondary sources: " 
          : "secondary sources: ";
        justification += result.conceptualLineage.passageA.secondaryInfluences.join(", ");
      }
      
      justification += ".";
      
      scores.framework = {
        label: "Intellectual Framework",
        justification: justification,
        quotes: []
      };
    }
    
    // Coherence (if available)
    if (result.coherence?.passageA) {
      scores.coherence = {
        label: "Coherence",
        justification: result.coherence.passageA.description || "No justification provided.",
        quotes: []
      };
    }
    
    // Parasite Index
    if (result.parasiteIndex?.passageA) {
      scores.parasitism = {
        label: "Conceptual Parasitism",
        justification: result.parasiteIndex.passageA.description || "No justification provided.",
        quotes: extractSupportingQuotes(result, "parasiteIndex", isSinglePassageMode)
      };
    }
    
    // AI Detection
    if (result.aiDetection?.passageA) {
      scores.aiDetection = {
        label: "AI Detection",
        justification: result.aiDetection.passageA.details || 
          `The text appears to be ${result.aiDetection.passageA.isAIGenerated ? "AI-generated" : "human-written"} with ${result.aiDetection.passageA.confidence} confidence.`,
        quotes: []
      };
    }
  } else {
    // Comparison mode scores
    
    // Conceptual Overlap
    if (result.conceptualOverlap) {
      scores.overlap = {
        label: "Conceptual Distinctiveness",
        justification: result.conceptualOverlap.description || "No justification provided.",
        quotes: []
      };
    }
    
    // Originality Comparison
    if (result.novelty?.passageA && result.novelty?.passageB) {
      const passageATitle = result.novelty.passageA.title || "Document A";
      const passageBTitle = result.novelty.passageB.title || "Document B";
      
      scores.originalityA = {
        label: `Originality: ${passageATitle}`,
        justification: result.novelty.passageA.description || "No justification provided.",
        quotes: extractSupportingQuotes(result, "noveltyA", isSinglePassageMode)
      };
      
      scores.originalityB = {
        label: `Originality: ${passageBTitle}`,
        justification: result.novelty.passageB.description || "No justification provided.",
        quotes: extractSupportingQuotes(result, "noveltyB", isSinglePassageMode)
      };
    }
    
    // AI Detection Comparison
    if (result.aiDetection?.passageA && result.aiDetection?.passageB) {
      const passageATitle = result.aiDetection.passageA.title || "Document A";
      const passageBTitle = result.aiDetection.passageB.title || "Document B";
      
      scores.aiDetectionA = {
        label: `AI Detection: ${passageATitle}`,
        justification: result.aiDetection.passageA.details || 
          `The text appears to be ${result.aiDetection.passageA.isAIGenerated ? "AI-generated" : "human-written"} with ${result.aiDetection.passageA.confidence} confidence.`,
        quotes: []
      };
      
      scores.aiDetectionB = {
        label: `AI Detection: ${passageBTitle}`,
        justification: result.aiDetection.passageB.details || 
          `The text appears to be ${result.aiDetection.passageB.isAIGenerated ? "AI-generated" : "human-written"} with ${result.aiDetection.passageB.confidence} confidence.`,
        quotes: []
      };
    }
  }
  
  return scores;
}

/**
 * Extract strength points from the analysis result
 */
function extractStrengths(
  result: AnalysisResult,
  isSinglePassageMode: boolean = false
): string[] {
  const strengths: string[] = [];
  
  if (isSinglePassageMode) {
    // Add strengths based on high scores
      strengths.push("Demonstrates high originality and innovative thinking.");
    }
    
      strengths.push("Shows excellent logical structure and coherent argumentation.");
    }
    
    // Add strengths based on conceptual framework
    if (result.conceptualLineage?.passageA?.primaryInfluences?.length) {
      strengths.push(`Effectively engages with established ideas from ${result.conceptualLineage.passageA.primaryInfluences.slice(0, 3).join(", ")}.`);
    }
    
    // Add strength if human-written
    if (result.aiDetection?.passageA && !result.aiDetection.passageA.isAIGenerated) {
      strengths.push("Displays authentic human perspective and nuanced thinking.");
    }
    
    // Add strength if low parasite index
    if (result.parasiteIndex?.passageA?.level === "Low") {
      strengths.push("Shows independent thinking with minimal conceptual parasitism.");
    }
    
    // Add novelty heatmap strengths if available
    if (result.noveltyHeatmap?.passageA?.length) {
      const highNoveltyParagraphs = result.noveltyHeatmap.passageA.filter(p => p.heat >= 0.7);
      if (highNoveltyParagraphs.length > 0) {
        strengths.push(`Contains ${highNoveltyParagraphs.length} highly original passages that contribute novel ideas to the field.`);
      }
    }
    
    // Add generic strengths if needed
    if (strengths.length < 3) {
      strengths.push("Presents a perspective on the topic that contributes to the field.");
      strengths.push("Demonstrates knowledge of relevant conceptual frameworks.");
    }
  } else {
    // Comparison mode strengths
      strengths.push("The documents demonstrate significant conceptual distinctiveness from each other.");
    }
    
    // Add document-specific strengths
      const title = result.novelty.passageA.title || "Document A";
      strengths.push(`"${title}" demonstrates high originality and innovative thinking.`);
    }
    
      const title = result.novelty.passageB.title || "Document B";
      strengths.push(`"${title}" demonstrates high originality and innovative thinking.`);
    }
    
    // Add AI detection strengths
    if (result.aiDetection?.passageA && !result.aiDetection.passageA.isAIGenerated) {
      const title = result.aiDetection.passageA.title || "Document A";
      strengths.push(`"${title}" displays authentic human perspective and nuanced thinking.`);
    }
    
    if (result.aiDetection?.passageB && !result.aiDetection.passageB.isAIGenerated) {
      const title = result.aiDetection.passageB.title || "Document B";
      strengths.push(`"${title}" displays authentic human perspective and nuanced thinking.`);
    }
    
    // Add generic strengths if needed
    if (strengths.length < 3) {
      strengths.push("Both documents contribute unique perspectives to the discussion.");
      strengths.push("The documents complement each other in addressing different aspects of the topic.");
    }
  }
  
  return strengths;
}

/**
 * Extract weakness points from the analysis result
 */
function extractWeaknesses(
  result: AnalysisResult,
  isSinglePassageMode: boolean = false
): string[] {
  const weaknesses: string[] = [];
  
  if (isSinglePassageMode) {
    // Add weaknesses based on low scores
      weaknesses.push("Lacks originality; relies heavily on established ideas without significant innovation.");
    }
    
      weaknesses.push("Shows structural weaknesses in logical flow and argumentation.");
    }
    
    // Add weakness if AI-generated
    if (result.aiDetection?.passageA && result.aiDetection.passageA.isAIGenerated) {
      weaknesses.push("Demonstrates characteristics of AI-generated content, potentially lacking authentic human perspective.");
    }
    
    // Add weakness if high parasite index
    if (result.parasiteIndex?.passageA?.level === "High") {
      weaknesses.push("Exhibits high conceptual parasitism, with heavy reliance on existing ideas without substantial transformation.");
    } else if (result.parasiteIndex?.passageA?.level === "Moderate") {
      weaknesses.push("Shows moderate conceptual parasitism, with some original ideas but still dependent on existing frameworks.");
    }
    
    // Add novelty heatmap weaknesses if available
    if (result.noveltyHeatmap?.passageA?.length) {
      const lowNoveltyParagraphs = result.noveltyHeatmap.passageA.filter(p => p.heat <= 0.3);
      if (lowNoveltyParagraphs.length > 0) {
        weaknesses.push(`Contains ${lowNoveltyParagraphs.length} passages with low originality that rely heavily on common knowledge or established concepts.`);
      }
    }
    
    // Add generic weaknesses if needed
    if (weaknesses.length < 2) {
        weaknesses.push("Could benefit from more innovative approaches to the subject matter.");
      }
      if (!result.parasiteIndex?.passageA || result.parasiteIndex.passageA.level !== "Low") {
        weaknesses.push("Shows some dependency on existing conceptual frameworks without sufficient transformation.");
      }
    }
  } else {
    // Comparison mode weaknesses
      weaknesses.push("The documents show significant conceptual overlap, lacking distinctiveness from each other.");
    }
    
    // Add document-specific weaknesses
      const title = result.novelty.passageA.title || "Document A";
      weaknesses.push(`"${title}" lacks originality and relies heavily on established ideas.`);
    }
    
      const title = result.novelty.passageB.title || "Document B";
      weaknesses.push(`"${title}" lacks originality and relies heavily on established ideas.`);
    }
    
    // Add AI detection weaknesses
    if (result.aiDetection?.passageA && result.aiDetection.passageA.isAIGenerated) {
      const title = result.aiDetection.passageA.title || "Document A";
      weaknesses.push(`"${title}" shows characteristics of AI-generated content, potentially lacking authentic perspective.`);
    }
    
    if (result.aiDetection?.passageB && result.aiDetection.passageB.isAIGenerated) {
      const title = result.aiDetection.passageB.title || "Document B";
      weaknesses.push(`"${title}" shows characteristics of AI-generated content, potentially lacking authentic perspective.`);
    }
    
    // Add generic weaknesses if needed
    if (weaknesses.length < 2) {
      weaknesses.push("The comparative value could be enhanced with more distinct conceptual frameworks.");
      weaknesses.push("Both documents could benefit from more innovative approaches to the subject matter.");
    }
  }
  
  return weaknesses;
}

/**
 * Generate improvement suggestions based on the analysis
 */
function generateImprovementSuggestions(
  result: AnalysisResult,
  passageA: PassageData,
  isSinglePassageMode: boolean = false
): string[] {
  const suggestions: string[] = [];
  
  if (isSinglePassageMode) {
    // Originality suggestions
        suggestions.push("Significantly expand on novel perspectives by challenging conventional interpretations and introducing original insights.");
        suggestions.push("Enhance originality by developing your unique perspective more thoroughly and reducing reliance on established viewpoints.");
      } else {
        suggestions.push("Further refine your already strong original ideas by connecting them more explicitly to broader implications in the field.");
      }
    }
    
    // Coherence suggestions
        suggestions.push("Restructure your argument to improve logical flow and coherence between sections.");
        suggestions.push("Strengthen transitions between concepts to improve overall coherence and readability.");
      }
    }
    
    // Conceptual parasitism suggestions
    if (result.parasiteIndex?.passageA?.level) {
      if (result.parasiteIndex.passageA.level === "High") {
        suggestions.push("Reduce conceptual parasitism by critically engaging with borrowed ideas rather than simply restating them.");
      } else if (result.parasiteIndex.passageA.level === "Moderate") {
        suggestions.push("Transform borrowed concepts more thoroughly by applying them to new contexts or combining them in innovative ways.");
      }
    }
    
    // AI detection suggestions
    if (result.aiDetection?.passageA?.isAIGenerated) {
      suggestions.push("Incorporate more personal insights, specific examples, and nuanced perspectives to reduce characteristics of AI-generated content.");
    }
    
    // Heatmap-based suggestions
    if (result.noveltyHeatmap?.passageA?.length) {
      const lowNoveltyParagraphs = result.noveltyHeatmap.passageA.filter(p => p.heat <= 0.3);
      if (lowNoveltyParagraphs.length > 0) {
        suggestions.push("Revise the sections with low originality by introducing novel perspectives or critical analysis of established concepts.");
      }
    }
    
    // Add generic suggestions if needed
    if (suggestions.length < 3) {
      suggestions.push("Explore potential contradictions or limitations in the established literature to develop more original insights.");
      suggestions.push("Consider incorporating interdisciplinary perspectives to enrich your conceptual framework.");
      suggestions.push("Explicitly acknowledge influences while clarifying how your work extends beyond them.");
    }
  } else {
    // Comparison mode suggestions
      suggestions.push("Develop more distinctive approaches in each document to reduce conceptual overlap and increase their complementary value.");
    }
    
    // Specific document suggestions based on titles
    const titleA = result.novelty?.passageA?.title || "Document A";
    const titleB = result.novelty?.passageB?.title || "Document B";
    
    // Specific suggestions for Document A
      suggestions.push(`Enhance the originality of "${titleA}" by incorporating more innovative perspectives and reducing reliance on established concepts.`);
    }
    
    // Specific suggestions for Document B
      suggestions.push(`Improve the originality of "${titleB}" by developing more novel insights and critically engaging with the existing literature.`);
    }
    
    // Add generic suggestions if needed
    if (suggestions.length < 3) {
      suggestions.push("Consider how the documents could be revised to serve complementary purposes rather than overlapping ones.");
      suggestions.push("Explore how insights from each document could be synthesized into a more comprehensive and original framework.");
      suggestions.push("Identify and develop the most original elements from each document to create a stronger combined contribution.");
    }
  }
  
  return suggestions;
}

/**
 * Generate literature context based on the analysis
 */
function generateLiteratureContext(
  result: AnalysisResult,
  isSinglePassageMode: boolean = false
): string {
  let context = "";
  
  if (isSinglePassageMode && result.conceptualLineage?.passageA) {
    const lineage = result.conceptualLineage.passageA;
    
    context = "The work positions itself within an intellectual framework ";
    
    if (lineage.primaryInfluences?.length) {
      context += `primarily influenced by ${lineage.primaryInfluences.join(", ")}. `;
      
      if (lineage.secondaryInfluences?.length) {
        context += `Secondary influences include ${lineage.secondaryInfluences.join(", ")}. `;
      }
    } else if (lineage.secondaryInfluences?.length) {
      context += `showing influences from ${lineage.secondaryInfluences.join(", ")}. `;
    } else {
      context += "that appears to be relatively independent of established traditions. ";
    }
    
    // Add information about originality in the context of literature
        context += "The work represents a significant contribution to the field, offering perspectives that substantially extend beyond existing literature. ";
        context += "The work offers meaningful contributions to the literature, balancing established concepts with novel insights. ";
        context += "The work largely operates within established frameworks in the literature, with some attempts at extension or reinterpretation. ";
      } else {
        context += "The work primarily reiterates existing ideas in the literature without substantial novel contributions. ";
      }
    }
    
    // Add parasite index context
    if (result.parasiteIndex?.passageA?.level) {
      if (result.parasiteIndex.passageA.level === "Low") {
        context += "It demonstrates a healthy independence from its influences, transforming borrowed concepts into truly original contributions.";
      } else if (result.parasiteIndex.passageA.level === "Moderate") {
        context += "While building on existing literature, it sometimes falls short of fully transforming these influences into entirely original contributions.";
      } else {
        context += "It shows significant dependence on existing literature, often reiterating established concepts without sufficient transformation.";
      }
    }
  } else if (!isSinglePassageMode && result.conceptualOverlap) {
    // For comparison mode, focus on how the two documents relate to each other in the literature
    
    const titleA = result.novelty?.passageA?.title || "Document A";
    const titleB = result.novelty?.passageB?.title || "Document B";
    
    context = `The relationship between "${titleA}" and "${titleB}" in the context of the broader literature `;
    
        context += "reveals two works operating in distinctly different intellectual territories. ";
        context += "shows works that address similar themes but approach them from noticeably different perspectives. ";
        context += "indicates works with significant conceptual overlap, though each maintains some distinctive elements. ";
      } else {
        context += "demonstrates works that cover largely the same intellectual territory with minimal distinctive contributions. ";
      }
    }
    
    // Add specific context about each document's position in literature
      
      if (scoreA > scoreB + 2) {
        context += `"${titleA}" makes a more significant original contribution to the literature compared to "${titleB}." `;
      } else if (scoreB > scoreA + 2) {
        context += `"${titleB}" makes a more significant original contribution to the literature compared to "${titleA}." `;
      } else {
        context += "Both works make comparable contributions to the literature in terms of originality. ";
      }
    }
    
    // Add conclusion about combined contribution
    context += "Together, they " + 
        ? "offer complementary perspectives that enrich understanding of the broader subject area." 
        : "largely reinforce the same perspectives with limited complementary value.");
  }
  
  return context;
}

/**
 * Extract supporting quotes from the analysis result
 */
function extractSupportingQuotes(
  result: AnalysisResult,
  category: string,
  isSinglePassageMode: boolean = false
): string[] {
  const quotes: string[] = [];
  
  // For novelty heatmap, extract quotes from high novelty paragraphs
  if (category === "novelty" && result.noveltyHeatmap?.passageA) {
    const paragraphs = result.noveltyHeatmap.passageA
      .filter(p => p.heat >= 0.7)
      .slice(0, 3);
      
    paragraphs.forEach(p => {
      if (p.content && p.content.length > 0) {
        // Trim long paragraphs
        quotes.push(p.content.length > 150 ? p.content.substring(0, 150) + "..." : p.content);
      }
    });
  } else if (category === "noveltyB" && result.noveltyHeatmap?.passageB) {
    const paragraphs = result.noveltyHeatmap.passageB
      .filter(p => p.heat >= 0.7)
      .slice(0, 3);
      
    paragraphs.forEach(p => {
      if (p.content && p.content.length > 0) {
        quotes.push(p.content.length > 150 ? p.content.substring(0, 150) + "..." : p.content);
      }
    });
  }
  
  // For parasite index, add example parasitic passages
  if (category === "parasiteIndex" && result.parasiteIndex?.passageA?.examples) {
    result.parasiteIndex.passageA.examples.slice(0, 3).forEach(example => {
      if (example.length > 0) {
        quotes.push(example.length > 150 ? example.substring(0, 150) + "..." : example);
      }
    });
  }
  
  return quotes;
}

/**
 * Calculate a framework score based on the conceptual lineage
 */
function calculateFrameworkScore(lineage: any): number {
  
  // Increase score based on number of influences (shows engagement with literature)
  const primaryCount = lineage.primaryInfluences?.length || 0;
  const secondaryCount = lineage.secondaryInfluences?.length || 0;
  
  // Ideal range is 2-4 primary influences and 3-6 secondary
  if (primaryCount >= 2 && primaryCount <= 4) {
    score += 1;
  } else if (primaryCount > 4) {
    score -= 1; // Too many influences may suggest lack of focus
  }
  
  if (secondaryCount >= 3 && secondaryCount <= 6) {
    score += 1;
  } else if (secondaryCount > 6) {
    score -= 1;
  }
  
  // Adjust based on balance between primary and secondary
  if (primaryCount > 0 && secondaryCount > 0) {
    score += 1; // Good to have both
  }
  
  // Cap the score between 1-10
  return Math.max(1, Math.min(10, score));
}

/**
 * Convert parasite level to a numeric score
 */
function convertParasiteLevelToScore(level: string): number {
  switch (level) {
    case "Low":
      return 8;
    case "Moderate":
      return 5;
    case "High":
      return 2;
    default:
      return 5;
  }
}