import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
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
      score: z.number(),
      components: z.array(z.object({
        name: z.string(),
        score: z.number(),
      })).optional(),
    }),
    passageB: z.object({
      score: z.number(),
      components: z.array(z.object({
        name: z.string(),
        score: z.number(),
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
      score: z.number(),
      assessment: z.string(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
    }),
    passageB: z.object({
      score: z.number(),
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
      score: z.number(),
      assessment: z.string(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
    }),
    passageB: z.object({
      score: z.number(),
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
      score: z.number(),
      assessment: z.string(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
    }),
    passageB: z.object({
      score: z.number(),
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
      score: z.number(),
      assessment: z.string(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
    }),
    passageB: z.object({
      score: z.number(),
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
