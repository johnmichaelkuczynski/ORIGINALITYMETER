import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';

/*
<important_code_snippet_instructions>
The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user.
The newest Anthropic model is "claude-sonnet-4-5-20250929", not "claude-sonnet-4-5-20250929", "claude-sonnet-4-5-20250929" nor "claude-3-sonnet-20240229". 
</important_code_snippet_instructions>
*/

// <important_do_not_delete>
const DEFAULT_OPENAI_MODEL = "gpt-4o";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929";
// </important_do_not_delete>

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "default_key",
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "default_key",
});

const PRESET_TEXT: Record<string,string> = {
  // Advanced Techniques
  "Mixed cadence + clause sprawl": "Alternate short and long sentences; allow some long sentences to wander with extra clauses.",
  "Asymmetric emphasis": "Over-elaborate one point; compress or skate past another.",
  "One aside": "Add a quick parenthetical or em-dash remark — factual, not jokey.",
  "Hedge twice": "Use two mild uncertainty markers (\"probably,\" \"seems,\" \"roughly,\" \"I think\").",
  "Local disfluency": "Keep one redundant or slightly awkward phrase that still makes sense.",
  "Analogy injection": "Insert a short, concrete comparison to something unrelated but illustrative.",
  "Topic snap": "Abruptly shift focus once, then return.",
  "Friction detail": "Drop in a small, seemingly unnecessary but real-world-plausible detail.",
  
  "Compression — light (−15%)": "Cut filler; merge short clauses; keep meaning. Target ≈15% shorter.",
  "Compression — medium (−30%)": "Trim hard; delete throat-clearing; tighten syntax. Target ≈30% shorter.",
  "Compression — heavy (−45%)": "Sever redundancies; collapse repeats; keep core claims. Target ≈45% shorter.",
  "Mixed cadence": "Alternate short (5–12 words) and long (20–35 words) sentences; avoid uniform rhythm.",
  "Clause surgery": "Reorder main/subordinate clauses in ~30% of sentences without changing meaning.",
  "Front-load claim": "Put the main conclusion in sentence 1; evidence follows.",
  "Back-load claim": "Delay the main conclusion to the final 2–3 sentences.",
  "Seam/pivot": "Drop smooth connectors once; allow one abrupt thematic pivot.",
  "Imply one step": "Omit one obvious inferential step; keep it implicit (context makes it recoverable).",
  "Conditional framing": "Recast one key sentence as: If/Unless …, then …. Keep content identical.",
  "Local contrast": "Use exactly one contrast marker (but/except/aside) to mark a boundary; add no new facts.",
  "Scope check": "Replace one absolute with a bounded form (e.g., 'in cases like these').",
  "Deflate jargon": "Swap nominalizations for plain verbs where safe (e.g., utilization→use).",
  "Kill stock transitions": "Delete 'Moreover/Furthermore/In conclusion' everywhere.",
  "Hedge once": "Use exactly one hedge: probably/roughly/more or less.",
  "Drop intensifiers": "Remove 'very/clearly/obviously/significantly'.",
  "Low-heat voice": "Prefer plain verbs; avoid showy synonyms.",
  "One aside": "Allow one short parenthetical or em-dash aside; strictly factual.",
  "Concrete benchmark": "Replace one vague scale with a testable one (e.g., 'enough to X').",
  "Swap generic example": "If the source has an example, make it slightly more specific; else skip.",
  "Metric nudge": "Replace 'more/better' with a minimal, source-safe comparator (e.g., 'more than last case').",
  "Asymmetric emphasis": "Linger on the main claim; compress secondary points sharply.",
  "Cull repeats": "Delete duplicated sentences/ideas; keep the strongest instance.",
  "Topic snap": "Allow one abrupt focus change; no recap.",
  "No lists": "Output as continuous prose; remove bullets/numbering.",
  "No meta": "No prefaces/apologies/phrases like 'as requested'.",
  "Exact nouns": "Replace ambiguous pronouns with exact nouns.",
  "Quote once": "If the source has a strong phrase, quote it once; otherwise skip.",
  "Claim lock": "Do not add examples, scenarios, or data not present in the source.",
  "Entity lock": "Keep names, counts, and attributions exactly as given.",
  // Combo presets expand to atomic ones:
  "Lean & Sharp": "Compression — medium (−30%); Mixed cadence; Imply one step; Kill stock transitions",
  "Analytic": "Clause surgery; Front-load claim; Scope check; Exact nouns; No lists",
};

function expandPresets(selected: string[] = []): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (name: string) => {
    const txt = PRESET_TEXT[name];
    if (!txt) return;
    if (txt.includes(";") && !txt.includes("…")) {
      // combo: split by ';' and add atomic names
      txt.split(";").map(s => s.trim()).forEach(alias => { if (PRESET_TEXT[alias] && !seen.has(alias)) { seen.add(alias); out.push(alias); }});
    } else {
      if (!seen.has(name)) { seen.add(name); out.push(name); }
    }
  };
  selected.forEach(add);
  return out;
}

function buildPresetBlock(selectedPresets?: string[], customInstructions?: string): string {
  const expanded = expandPresets(selectedPresets || []);
  const lines: string[] = [];
  expanded.forEach(name => { lines.push(`- ${PRESET_TEXT[name]}`); });
  const custom = (customInstructions || "").trim();
  if (custom) lines.push(`- ${custom}`);
  if (lines.length === 0) return "";
  return `Apply ONLY these additional rewrite instructions (no other goals):\n${lines.join("\n")}\n\n`;
}

function buildRewritePrompt(params: {
  inputText: string;
  styleText?: string;
  contentMixText?: string;
  selectedPresets?: string[];
  customInstructions?: string;
}): string {
  const hasStyle = !!(params.styleText && params.styleText.trim() !== "");
  const hasContent = !!(params.contentMixText && params.contentMixText.trim() !== "");
  const hasCustomInstructions = !!(params.customInstructions && params.customInstructions.trim() !== "");
  
  // PROVISION 1: Use style sample - user's if provided, otherwise default philosophical style
  const styleSample = hasStyle ? params.styleText! : `One cannot have the concept of a red object without having the concept of an extended object. But the word "red" doesn't contain the word "extended." In general, our concepts are interconnected in ways in which the corresponding words are not interconnected. This is not an accidental fact about the English language or about any other language: it is inherent in what a language is that the cognitive abilities corresponding to a person's abilities to use words cannot possibly be reflected in semantic relations holding among those words. This fact in its turn is a consequence of the fact that expressions are, whereas concepts are not, digital structures, for which reason the ways in which cognitive abilities interact cannot possibly bear any significant resemblance to the ways in which expressions interact. Consequently, there is no truth to the contention that our thought-processes are identical with, or bear any resemblance to, the digital computations that mediate computer-activity.`;

  // PROVISION 2: Check length for auto-expansion (under 800 words = under 2 pages)
  const wordCount = params.inputText.trim().split(/\s+/).length;
  const isShort = wordCount < 800;
  
  // Calculate target length: 3X or 750 minimum, whichever is higher
  const tripleLength = wordCount * 3;
  const targetLength = Math.max(tripleLength, 750);
  
  // PROVISION 1: Style matching instructions (NOT "make it better")
  let prompt = `REWRITE TASK: Transform the text below to match the EXACT style of the provided sample. This is NOT about "making it better" or "smarter" - it's about STYLE MATCHING.

STYLE SAMPLE (match this style exactly, not a caricature):
"${styleSample}"

CRITICAL RULES FOR STYLE MATCHING:
• Copy the sentence structure, rhythm, and flow patterns from the style sample
• Use the same level of directness and vocabulary (NO inflation: "said" stays "said", not "posited")
• Preserve the exact sharpness, edge, and concision of the style sample
• Match the logical rigor and argumentative patterns
• DO NOT add academic bloat, formal transitions, or unnecessary elaboration
• DO NOT paraphrase just to paraphrase - keep sharp phrasing intact

`;

  // PROVISIONS 2, 3, 4: Default rules (expansion, completion, preservation)
  if (!hasCustomInstructions) {
    prompt += `DEFAULT REWRITE RULES (applying all provisions):

`;
    // PROVISION 2: Auto expansion with 750-word minimum
    if (isShort) {
      prompt += `PROVISION 2 - LENGTH: Expand to AT LEAST ${targetLength} words by:
• Adding logical argumentation and empirical support
• Adding clarity and examples where they strengthen the argument
• DO NOT expand by inflating existing sentences or adding filler
• MINIMUM LENGTH REQUIREMENT: 750 words (unless user specifies otherwise)

`;
    }
    
    // PROVISIONS 3 & 4: Auto-complete essays and stories
    prompt += `PROVISION 3 & 4 - COMPLETION:
• If input is non-fiction fragment → Turn it into a COMPLETE ESSAY with proper introduction, developed body, and conclusion
• If input is fiction fragment → Turn it into a COMPLETE STORY with full narrative arc (beginning, middle, end)
• Add whatever content is needed to create a complete, coherent work
• Maintain the original's exact style in all additions

PROVISION 2 - PRESERVATION:
• PRESERVE EDGE: Keep any edgy, sharp, or provocative qualities exactly as they are
• PRESERVE CONCISION: Keep sharpness - do not dilute with bloat
• ADD SUBSTANCE: Add logical/empirical support in the same voice and style
• KEEP ORIGINAL LANGUAGE: Preserve the original's exact phrasing wherever possible

`;
  } else {
    // User provided custom instructions
    prompt += `CUSTOM INSTRUCTIONS (take priority):
${params.customInstructions}

PROVISION-BASED DEFAULTS (apply unless contradicted above):

`;
    
    // PROVISION 2: Auto expansion unless user mentioned length
    if (isShort && !params.customInstructions.toLowerCase().includes('length') && 
        !params.customInstructions.toLowerCase().includes('expand') && 
        !params.customInstructions.toLowerCase().includes('compress') &&
        !params.customInstructions.toLowerCase().includes('shorten')) {
      prompt += `PROVISION 2 - LENGTH: Expand to AT LEAST ${targetLength} words by adding substance, not inflation.
• MINIMUM LENGTH REQUIREMENT: 750 words (unless you specified otherwise above)

`;
    }
    
    // PROVISIONS 3 & 4: Auto-complete unless user said not to
    const noComplete = params.customInstructions.toLowerCase().includes('do not') && 
                      (params.customInstructions.toLowerCase().includes('essay') || 
                       params.customInstructions.toLowerCase().includes('story') ||
                       params.customInstructions.toLowerCase().includes('complete'));
    
    if (!noComplete) {
      prompt += `PROVISION 3 & 4 - COMPLETION:
• Non-fiction fragment → Complete essay (intro/body/conclusion)
• Fiction fragment → Complete story (full narrative)
• Maintain original style in all additions

`;
    }
    
    // PROVISION 2: Always preserve edge and concision
    prompt += `PROVISION 2 - PRESERVATION:
• PRESERVE EDGE: Maintain edgy, sharp, provocative qualities
• PRESERVE CONCISION: Keep sharpness, avoid bloat
• ADD SUBSTANCE: Enhance with logical/empirical support in same voice

`;
  }

  if (hasContent) {
    prompt += `CONTENT TO INTEGRATE:
"${params.contentMixText}"

`;
  }

  // Add presets if provided
  const presetBlock = buildPresetBlock(params.selectedPresets, undefined);
  if (presetBlock) {
    prompt += presetBlock;
  }

  prompt += `TEXT TO REWRITE:
"${params.inputText}"

OUTPUT REQUIREMENTS:
• Follow ALL provisions and instructions above
• Match the style sample exactly
• Complete the work if it's a fragment
• Preserve edge, sharpness, and original phrasing
• No preamble, no meta-commentary - just the rewritten text`;
  
  return prompt;
}

export interface RewriteParams {
  inputText: string;
  styleText?: string;
  contentMixText?: string;
  customInstructions?: string;
  selectedPresets?: string[];
  mixingMode?: 'style' | 'content' | 'both';
}

export class AIProviderService {
  async rewriteWithOpenAI(params: RewriteParams): Promise<string> {
    console.log("🔥 CALLING OPENAI API - Input length:", params.inputText?.length || 0);
    console.log("🔥 STYLE TEXT:", params.styleText ? `"${params.styleText.substring(0, 100)}..."` : "NONE");
    console.log("🔥 CONTENT MIX:", params.contentMixText ? `"${params.contentMixText.substring(0, 100)}..."` : "NONE");
    console.log("🔥 PRESETS:", params.selectedPresets || "NONE");
    console.log("🔥 CUSTOM INSTRUCTIONS:", params.customInstructions || "NONE");
    
    const prompt = buildRewritePrompt({
      inputText: params.inputText,
      styleText: params.styleText,
      contentMixText: params.contentMixText,
      selectedPresets: params.selectedPresets,
      customInstructions: params.customInstructions,
    });
    console.log("🔥 User prompt length:", prompt.length);
    console.log("🔥 FULL PROMPT:\n", prompt.substring(0, 500));
    
    try {
      console.log("🔥 About to make OpenAI API call...");
      const response = await openai.chat.completions.create({
        model: DEFAULT_OPENAI_MODEL,
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      console.log("🔥 OpenAI response received, length:", response.choices[0].message.content?.length || 0);
      return this.cleanMarkup(response.choices[0].message.content || "");
    } catch (error: any) {
      console.error("🔥 OpenAI API ERROR:", error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async rewriteWithAnthropic(params: RewriteParams): Promise<string> {
    console.log("🔥 CALLING ANTHROPIC API - Input length:", params.inputText?.length || 0);
    const prompt = buildRewritePrompt({
      inputText: params.inputText,
      styleText: params.styleText,
      contentMixText: params.contentMixText,
      selectedPresets: params.selectedPresets,
      customInstructions: params.customInstructions,
    });
    console.log("🔥 User prompt length:", prompt.length);
    
    try {
      console.log("🔥 About to make Anthropic API call...");
      const response = await anthropic.messages.create({
        model: DEFAULT_ANTHROPIC_MODEL,
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      });

      console.log("🔥 Anthropic response received, length:", response.content[0].text?.length || 0);
      return this.cleanMarkup(response.content[0].text || "");
    } catch (error: any) {
      console.error("🔥 ANTHROPIC API ERROR:", error);
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }

  async rewriteWithPerplexity(params: RewriteParams): Promise<string> {
    const prompt = buildRewritePrompt({
      inputText: params.inputText,
      styleText: params.styleText,
      contentMixText: params.contentMixText,
      selectedPresets: params.selectedPresets,
      customInstructions: params.customInstructions,
    });
    
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY || "default_key"}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.cleanMarkup(data.choices[0].message.content || "");
    } catch (error: any) {
      throw new Error(`Perplexity API error: ${error.message}`);
    }
  }

  async rewriteWithDeepSeek(params: RewriteParams): Promise<string> {
    const prompt = buildRewritePrompt({
      inputText: params.inputText,
      styleText: params.styleText,
      contentMixText: params.contentMixText,
      selectedPresets: params.selectedPresets,
      customInstructions: params.customInstructions,
    });
    
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || "default_key"}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.cleanMarkup(data.choices[0].message.content || "");
    } catch (error: any) {
      throw new Error(`DeepSeek API error: ${error.message}`);
    }
  }

  private cleanMarkup(text: string): string {
    return text
      // Remove markdown bold/italic markers
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      // Remove markdown headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove inline code backticks
      .replace(/`([^`]+)`/g, '$1')
      // Remove code block markers
      .replace(/```[\s\S]*?```/g, (match) => {
        return match.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '');
      })
      // Remove other common markdown symbols
      .replace(/~~([^~]+)~~/g, '$1') // strikethrough
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/>\s+/gm, '') // blockquotes
      // Remove excessive whitespace and clean up
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  async rewrite(provider: string, params: RewriteParams): Promise<string> {
    switch (provider) {
      case 'openai':
        return this.rewriteWithOpenAI(params);
      case 'anthropic':
        return this.rewriteWithAnthropic(params);
      case 'perplexity':
        return this.rewriteWithPerplexity(params);
      case 'deepseek':
        return this.rewriteWithDeepSeek(params);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }
}

export const aiProviderService = new AIProviderService();