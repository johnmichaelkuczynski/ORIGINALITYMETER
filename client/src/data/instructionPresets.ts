export interface InstructionPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  isHighPriority?: boolean;
}

export const instructionPresets: InstructionPreset[] = [
  // TOP 8 MOST IMPORTANT FOR HUMANIZATION
  {
    id: "mixed-cadence-clause-sprawl",
    name: "Mixed cadence + clause sprawl",
    description: "Alternate short and long sentences; allow some long sentences to wander with extra clauses.",
    category: "Most Important for Humanization",
    isHighPriority: true
  },
  {
    id: "asymmetric-emphasis",
    name: "Asymmetric emphasis", 
    description: "Over-elaborate one point; compress or skate past another.",
    category: "Most Important for Humanization",
    isHighPriority: true
  },
  {
    id: "one-aside",
    name: "One aside",
    description: "Add a quick parenthetical or em-dash remark — factual, not jokey.",
    category: "Most Important for Humanization", 
    isHighPriority: true
  },
  {
    id: "hedge-twice",
    name: "Hedge twice",
    description: "Use two mild uncertainty markers (\"probably,\" \"seems,\" \"roughly,\" \"I think\").",
    category: "Most Important for Humanization",
    isHighPriority: true
  },
  {
    id: "local-disfluency", 
    name: "Local disfluency",
    description: "Keep one redundant or slightly awkward phrase that still makes sense.",
    category: "Most Important for Humanization",
    isHighPriority: true
  },
  {
    id: "analogy-injection",
    name: "Analogy injection",
    description: "Insert a short, concrete comparison to something unrelated but illustrative.",
    category: "Most Important for Humanization",
    isHighPriority: true
  },
  {
    id: "topic-snap",
    name: "Topic snap", 
    description: "Abruptly shift focus once, then return.",
    category: "Most Important for Humanization",
    isHighPriority: true
  },
  {
    id: "friction-detail",
    name: "Friction detail",
    description: "Drop in a small, seemingly unnecessary but real-world-plausible detail.",
    category: "Most Important for Humanization",
    isHighPriority: true
  },

  // STRUCTURE & CADENCE
  {
    id: "compression-light",
    name: "Compression — light (−15%)",
    description: "Cut filler; merge short clauses; keep meaning.",
    category: "Structure & Cadence"
  },
  {
    id: "compression-medium",
    name: "Compression — medium (−30%)", 
    description: "Trim hard; delete throat-clearing; tighten syntax.",
    category: "Structure & Cadence"
  },
  {
    id: "compression-heavy",
    name: "Compression — heavy (−45%)",
    description: "Sever redundancies; collapse repeats; keep core claims.",
    category: "Structure & Cadence"
  },
  {
    id: "decrease-50",
    name: "DECREASE BY 50%",
    description: "REDUCE THE LENGTH BY HALF WHILE PRESERVING MEANING",
    category: "Structure & Cadence"
  },
  {
    id: "increase-150",
    name: "INCREASE BY 150%",
    description: "EXPAND THE TEXT TO 150% LONGER WITH ADDITIONAL DETAIL AND ELABORATION",
    category: "Structure & Cadence"
  },
  {
    id: "mixed-cadence",
    name: "Mixed cadence",
    description: "Alternate 5–35-word sentences; no uniform rhythm.",
    category: "Structure & Cadence"
  },
  {
    id: "clause-surgery",
    name: "Clause surgery",
    description: "Reorder main/subordinate clauses in 30% of sentences.",
    category: "Structure & Cadence"
  },
  {
    id: "front-load-claim",
    name: "Front-load claim",
    description: "Put the main conclusion in sentence 1; support follows.",
    category: "Structure & Cadence"
  },
  {
    id: "back-load-claim",
    name: "Back-load claim", 
    description: "Delay the conclusion to the final 2–3 sentences.",
    category: "Structure & Cadence"
  },
  {
    id: "seam-pivot",
    name: "Seam/pivot",
    description: "Drop smooth connectors once; abrupt turn is fine.",
    category: "Structure & Cadence"
  },

  // FRAMING & INFERENCE
  {
    id: "imply-one-step",
    name: "Imply one step",
    description: "Omit an obvious inferential step; leave it implicit.",
    category: "Framing & Inference"
  },
  {
    id: "conditional-framing",
    name: "Conditional framing",
    description: "Recast one key sentence as \"If/Unless …, then …\".",
    category: "Framing & Inference"
  },
  {
    id: "local-contrast",
    name: "Local contrast",
    description: "Use \"but/except/aside\" once to mark a boundary—no new facts.",
    category: "Framing & Inference"
  },
  {
    id: "scope-check",
    name: "Scope check",
    description: "Replace one absolute with a bounded form (\"in cases like these\").",
    category: "Framing & Inference"
  },

  // DICTION & TONE
  {
    id: "deflate-jargon",
    name: "Deflate jargon",
    description: "Swap nominalizations for verbs where safe (e.g., \"utilization\" → \"use\").",
    category: "Diction & Tone"
  },
  {
    id: "kill-stock-transitions",
    name: "Kill stock transitions",
    description: "Delete \"Moreover/Furthermore/In conclusion\" everywhere.",
    category: "Diction & Tone"
  },
  {
    id: "hedge-once",
    name: "Hedge once",
    description: "Use exactly one: \"probably/roughly/more or less.\"",
    category: "Diction & Tone"
  },
  {
    id: "drop-intensifiers",
    name: "Drop intensifiers",
    description: "Remove \"very/clearly/obviously/significantly.\"",
    category: "Diction & Tone"
  },
  {
    id: "low-heat-voice",
    name: "Low-heat voice",
    description: "Prefer plain verbs; avoid showy synonyms.",
    category: "Diction & Tone"
  },

  // CONCRETENESS & BENCHMARKS
  {
    id: "concrete-benchmark",
    name: "Concrete benchmark",
    description: "Replace one vague scale with a testable one (e.g., \"enough to X\").",
    category: "Concreteness & Benchmarks"
  },
  {
    id: "swap-generic-example",
    name: "Swap generic example", 
    description: "If the source has an example, make it slightly more specific; else skip.",
    category: "Concreteness & Benchmarks"
  },
  {
    id: "metric-nudge",
    name: "Metric nudge",
    description: "Replace \"more/better\" with a minimal, source-safe comparator (\"more than last case\").",
    category: "Concreteness & Benchmarks"
  },

  // ASYMMETRY & FOCUS
  {
    id: "cull-repeats",
    name: "Cull repeats",
    description: "Delete duplicated sentences/ideas; keep the strongest instance.",
    category: "Asymmetry & Focus"
  },

  // FORMATTING & OUTPUT HYGIENE  
  {
    id: "no-lists",
    name: "No lists",
    description: "Force continuous prose; remove bullets/numbering.",
    category: "Formatting & Output Hygiene"
  },
  {
    id: "no-meta",
    name: "No meta",
    description: "No prefaces, apologies, or \"as requested\" scaffolding.",
    category: "Formatting & Output Hygiene"
  },
  {
    id: "exact-nouns", 
    name: "Exact nouns",
    description: "Replace vague pronouns where antecedent is ambiguous.",
    category: "Formatting & Output Hygiene"
  },
  {
    id: "quote-once",
    name: "Quote once",
    description: "If the source contains a strong phrase, quote it once; else skip.",
    category: "Formatting & Output Hygiene"
  },

  // SAFETY / GUARDRAILS
  {
    id: "claim-lock",
    name: "Claim lock",
    description: "Do not add examples, scenarios, or data not present in the source.",
    category: "Safety / Guardrails"
  },
  {
    id: "entity-lock", 
    name: "Entity lock",
    description: "Keep names, counts, and attributions exactly as given.",
    category: "Safety / Guardrails"
  },

  // COMBO PRESETS
  {
    id: "lean-sharp",
    name: "Lean & Sharp",
    description: "Compression-medium + mixed cadence + imply one step + kill stock transitions.",
    category: "Combo Presets (one-liners)"
  },
  {
    id: "analytic",
    name: "Analytic",
    description: "Clause surgery + front-load claim + scope check + exact nouns + no lists.",
    category: "Combo Presets (one-liners)"
  }
];

export const presetCategories = [
  "Most Important for Humanization",
  "Structure & Cadence", 
  "Framing & Inference",
  "Diction & Tone",
  "Concreteness & Benchmarks",
  "Asymmetry & Focus",
  "Formatting & Output Hygiene",
  "Safety / Guardrails",
  "Combo Presets (one-liners)"
];

// Helper functions
export const getPresetsByCategory = (category: string): InstructionPreset[] => {
  return instructionPresets.filter(preset => preset.category === category);
};

export const getPresetById = (id: string): InstructionPreset | undefined => {
  return instructionPresets.find(preset => preset.id === id);
};

export const getHighPriorityPresets = (): InstructionPreset[] => {
  return instructionPresets.filter(preset => preset.isHighPriority);
};