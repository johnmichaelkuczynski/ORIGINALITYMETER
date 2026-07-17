import { pgTable, text, serial, integer, boolean, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  passageA: text("passage_a").notNull(),
  passageB: text("passage_b").notNull(),
  passageATitle: text("passage_a_title"),
  passageBTitle: text("passage_b_title"),
  result: jsonb("result").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertAnalysisSchema = createInsertSchema(analyses).pick({
  passageA: true,
  passageB: true,
  passageATitle: true,
  passageBTitle: true,
  result: true,
  createdAt: true,
});

// ============================================================================
// CROSS-CHUNK COHERENCE (CC) — long-document reconstruction state.
// These tables hold the intermediate state for the three-pass coherent
// long-document generator (skeleton -> constrained chunks -> stitch). They
// live in the external Neon Postgres DB so long jobs survive restarts and
// can be polled for progress.
// ============================================================================

export const reconstructionJobs = pgTable("reconstruction_jobs", {
  id: serial("id").primaryKey(),
  // Lifecycle: pending -> skeleton_extraction -> chunk_processing -> stitching -> complete | failed
  status: text("status").notNull().default("pending"),
  title: text("title"),
  originalText: text("original_text").notNull(),
  customInstructions: text("custom_instructions"),
  // Optional generation settings carried through to each chunk.
  styleSource: text("style_source"),
  contentSource: text("content_source"),
  isFiction: boolean("is_fiction").notNull().default(false),
  preserveMath: boolean("preserve_math").notNull().default(true),
  // Length parameters (computed at init from the input + custom instructions).
  totalInputWords: integer("total_input_words").notNull().default(0),
  targetMinWords: integer("target_min_words").notNull().default(0),
  targetMaxWords: integer("target_max_words").notNull().default(0),
  targetMidWords: integer("target_mid_words").notNull().default(0),
  lengthRatio: real("length_ratio").notNull().default(1),
  lengthMode: text("length_mode").notNull().default("maintain"),
  // Chunk parameters.
  numChunks: integer("num_chunks").notNull().default(0),
  chunkTargetWords: integer("chunk_target_words").notNull().default(0),
  currentChunk: integer("current_chunk").notNull().default(0),
  // Pass 1 output.
  globalSkeleton: jsonb("global_skeleton"),
  // Pass 3 output.
  stitchReport: jsonb("stitch_report"),
  finalOutput: text("final_output"),
  finalWordCount: integer("final_word_count"),
  errorMessage: text("error_message"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const reconstructionChunks = pgTable("reconstruction_chunks", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  // Input.
  chunkInputText: text("chunk_input_text").notNull(),
  chunkInputWords: integer("chunk_input_words").notNull().default(0),
  // Per-chunk length targets.
  targetWords: integer("target_words").notNull().default(0),
  minWords: integer("min_words").notNull().default(0),
  maxWords: integer("max_words").notNull().default(0),
  // Output.
  chunkOutputText: text("chunk_output_text"),
  actualWords: integer("actual_words"),
  chunkDelta: jsonb("chunk_delta"),
  // Processing state: pending -> processing -> complete | failed
  retryCount: integer("retry_count").notNull().default(0),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertReconstructionJobSchema = createInsertSchema(reconstructionJobs).omit({
  id: true,
});

export const insertReconstructionChunkSchema = createInsertSchema(reconstructionChunks).omit({
  id: true,
});

export type ReconstructionJob = typeof reconstructionJobs.$inferSelect;
export type InsertReconstructionJob = z.infer<typeof insertReconstructionJobSchema>;
export type ReconstructionChunk = typeof reconstructionChunks.$inferSelect;
export type InsertReconstructionChunk = z.infer<typeof insertReconstructionChunkSchema>;

// Request body for starting a coherent long-document reconstruction.
export const reconstructionStartSchema = z.object({
  sourceText: z.string().min(1, "Source text is required"),
  customInstructions: z.string().optional(),
  styleSource: z.string().optional(),
  contentSource: z.string().optional(),
  isFiction: z.boolean().optional(),
  preserveMath: z.boolean().optional(),
  title: z.string().optional(),
});
export type ReconstructionStartRequest = z.infer<typeof reconstructionStartSchema>;

// GPT Bypass Schemas
export const textChunkSchema = z.object({
  id: z.string(),
  content: z.string(),
  startIndex: z.number(),
  endIndex: z.number(),
  wordCount: z.number(),
});

export const rewriteRequestSchema = z.object({
  inputText: z.string().min(1, "Input text is required"),
  styleText: z.string().optional(),
  contentMixText: z.string().optional(),
  customInstructions: z.string().optional(),
  selectedPresets: z.array(z.string()).optional(),
  provider: z.enum(["anthropic", "openai", "perplexity", "deepseek"]).default("anthropic"),
  selectedChunkIds: z.array(z.string()).optional(),
  mixingMode: z.enum(["style", "content", "both"]).default("style"),
});

export const rewriteResponseSchema = z.object({
  jobId: z.string(),
  rewrittenText: z.string(),
  inputAiScore: z.number(),
  outputAiScore: z.number(),
  provider: z.string(),
  processingTime: z.number(),
  wordCount: z.object({
    input: z.number(),
    output: z.number(),
  }),
});

export const chatMessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  role: z.enum(["user", "assistant"]),
  timestamp: z.string(),
});

export const processedFileSchema = z.object({
  filename: z.string(),
  content: z.string(),
  wordCount: z.number(),
});

export const gptZeroResultSchema = z.object({
  aiScore: z.number(),
  isAI: z.boolean(),
  confidence: z.number(),
});

export const rewriteJobSchema = z.object({
  id: z.string(),
  inputText: z.string(),
  styleText: z.string().optional(),
  contentMixText: z.string().optional(),
  customInstructions: z.string().optional(),
  selectedPresets: z.array(z.string()).optional(),
  provider: z.string(),
  selectedChunkIds: z.array(z.string()).optional(),
  mixingMode: z.enum(["style", "content", "both"]),
  rewrittenText: z.string().optional(),
  inputAiScore: z.number().optional(),
  outputAiScore: z.number().optional(),
  processingTime: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Type exports for GPT Bypass
export type TextChunk = z.infer<typeof textChunkSchema>;
export type RewriteRequest = z.infer<typeof rewriteRequestSchema>;
export type RewriteResponse = z.infer<typeof rewriteResponseSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ProcessedFile = z.infer<typeof processedFileSchema>;
export type GPTZeroResult = z.infer<typeof gptZeroResultSchema>;
export type RewriteJob = z.infer<typeof rewriteJobSchema>;

export const analysisResultSchema = z.object({
  userContext: z.string().optional(),
  conceptualLineage: z.object({
    passageA: z.object({
      primaryInfluences: z.string(),
      intellectualTrajectory: z.string(),
    }),
    passageB: z.object({
      primaryInfluences: z.string(),
      intellectualTrajectory: z.string(),
    }),
    feedback: z.object({
      comment: z.string(),
      aiResponse: z.string(),
      isRevised: z.boolean(),
    }).optional(),
  }),
  semanticDistance: z.object({
    passageA: z.object({
      distance: z.number(),
      label: z.string(),
    }),
    passageB: z.object({
      distance: z.number(),
      label: z.string(),
    }),
    keyFindings: z.array(z.string()),
    semanticInnovation: z.string(),
    feedback: z.object({
      comment: z.string(),
      aiResponse: z.string(),
      isRevised: z.boolean(),
    }).optional(),
  }),
  noveltyHeatmap: z.object({
    passageA: z.array(z.object({
      content: z.string(),
      heat: z.number(),
      quote: z.string().optional(),
      explanation: z.string().optional(),
    })),
    passageB: z.array(z.object({
      content: z.string(),
      heat: z.number(),
      quote: z.string().optional(),
      explanation: z.string().optional(),
    })),
    feedback: z.object({
      comment: z.string(),
      aiResponse: z.string(),
      isRevised: z.boolean(),
    }).optional(),
  }),
  derivativeIndex: z.object({
    passageA: z.object({
      components: z.array(z.object({
        name: z.string(),
      })).optional(),
    }),
    passageB: z.object({
      components: z.array(z.object({
        name: z.string(),
      })).optional(),
    }),
    feedback: z.object({
      comment: z.string(),
      aiResponse: z.string(),
      isRevised: z.boolean(),
    }).optional(),
  }),
  conceptualParasite: z.object({
    passageA: z.object({
      level: z.enum(["Low", "Moderate", "High"]),
      elements: z.array(z.string()),
      assessment: z.string(),
    }),
    passageB: z.object({
      level: z.enum(["Low", "Moderate", "High"]),
      elements: z.array(z.string()),
      assessment: z.string(),
    }),
    feedback: z.object({
      comment: z.string(),
      aiResponse: z.string(),
      isRevised: z.boolean(),
    }).optional(),
  }),
  coherence: z.object({
    passageA: z.object({
      assessment: z.string(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
    }),
    passageB: z.object({
      assessment: z.string(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
    }),
    feedback: z.object({
      comment: z.string(),
      aiResponse: z.string(),
      isRevised: z.boolean(),
    }).optional(),
  }).optional(),
  accuracy: z.object({
    passageA: z.object({
      assessment: z.string(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
    }),
    passageB: z.object({
      assessment: z.string(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
    }),
    feedback: z.object({
      comment: z.string(),
      aiResponse: z.string(),
      isRevised: z.boolean(),
    }).optional(),
  }).optional(),
  depth: z.object({
    passageA: z.object({
      assessment: z.string(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
    }),
    passageB: z.object({
      assessment: z.string(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
    }),
    feedback: z.object({
      comment: z.string(),
      aiResponse: z.string(),
      isRevised: z.boolean(),
    }).optional(),
  }).optional(),
  clarity: z.object({
    passageA: z.object({
      assessment: z.string(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
    }),
    passageB: z.object({
      assessment: z.string(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
    }),
    feedback: z.object({
      comment: z.string(),
      aiResponse: z.string(),
      isRevised: z.boolean(),
    }).optional(),
  }).optional(),
  verdict: z.string(),
  supportingDocuments: z.array(z.object({
    title: z.string(),
    content: z.string(),
  })).optional(),
  reportContent: z.string().optional(),
  metadata: z.object({
    provider: z.enum(["openai", "anthropic", "perplexity", "deepseek"]),
    timestamp: z.string().optional(),
  }).optional(),
  
  // Raw framework analysis data - these contain the 80 metrics
  rawOriginalityAnalysis: z.any().optional(),
  rawIntelligenceAnalysis: z.any().optional(),
  rawCogencyAnalysis: z.any().optional(),
  rawQualityAnalysis: z.any().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
