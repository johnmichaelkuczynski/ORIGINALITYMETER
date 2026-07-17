import {
  analyses,
  users,
  reconstructionJobs,
  reconstructionChunks,
  type User,
  type InsertUser,
  type Analysis,
  type InsertAnalysis,
  type AnalysisResult,
  type ReconstructionJob,
  type InsertReconstructionJob,
  type ReconstructionChunk,
  type InsertReconstructionChunk,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, notInArray } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getRecentAnalyses(limit?: number): Promise<Analysis[]>;

  // Cross-Chunk Coherence (long-document reconstruction).
  createReconstructionJob(job: InsertReconstructionJob): Promise<ReconstructionJob>;
  getReconstructionJob(id: number): Promise<ReconstructionJob | undefined>;
  updateReconstructionJob(id: number, updates: Partial<InsertReconstructionJob>): Promise<ReconstructionJob | undefined>;
  getIncompleteReconstructionJobs(): Promise<ReconstructionJob[]>;
  createReconstructionChunk(chunk: InsertReconstructionChunk): Promise<ReconstructionChunk>;
  getReconstructionChunks(jobId: number): Promise<ReconstructionChunk[]>;
  updateReconstructionChunk(id: number, updates: Partial<InsertReconstructionChunk>): Promise<ReconstructionChunk | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private analyses: Map<number, Analysis>;
  private userCurrentId: number;
  private analysisCurrentId: number;

  constructor() {
    this.users = new Map();
    this.analyses = new Map();
    this.userCurrentId = 1;
    this.analysisCurrentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const id = this.analysisCurrentId++;
    const analysis: Analysis = { ...insertAnalysis, id };
    this.analyses.set(id, analysis);
    return analysis;
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async getRecentAnalyses(limit: number = 10): Promise<Analysis[]> {
    return Array.from(this.analyses.values())
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Sort in descending order (newest first)
      })
      .slice(0, limit);
  }

  // Cross-Chunk Coherence is only supported on the persistent DB backend.
  async createReconstructionJob(): Promise<ReconstructionJob> {
    throw new Error("Reconstruction requires the database storage backend");
  }
  async getReconstructionJob(): Promise<ReconstructionJob | undefined> {
    return undefined;
  }
  async updateReconstructionJob(): Promise<ReconstructionJob | undefined> {
    return undefined;
  }
  async getIncompleteReconstructionJobs(): Promise<ReconstructionJob[]> {
    return [];
  }
  async createReconstructionChunk(): Promise<ReconstructionChunk> {
    throw new Error("Reconstruction requires the database storage backend");
  }
  async getReconstructionChunks(): Promise<ReconstructionChunk[]> {
    return [];
  }
  async updateReconstructionChunk(): Promise<ReconstructionChunk | undefined> {
    return undefined;
  }
}

// Persistent storage backed by the external Neon Postgres database (DATABASE_URL).
export class DbStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const [analysis] = await db.insert(analyses).values(insertAnalysis).returning();
    return analysis;
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    const [analysis] = await db.select().from(analyses).where(eq(analyses.id, id));
    return analysis;
  }

  async getRecentAnalyses(limit: number = 10): Promise<Analysis[]> {
    return await db
      .select()
      .from(analyses)
      .orderBy(desc(analyses.createdAt))
      .limit(limit);
  }

  async createReconstructionJob(job: InsertReconstructionJob): Promise<ReconstructionJob> {
    const [created] = await db.insert(reconstructionJobs).values(job).returning();
    return created;
  }

  async getReconstructionJob(id: number): Promise<ReconstructionJob | undefined> {
    const [job] = await db.select().from(reconstructionJobs).where(eq(reconstructionJobs.id, id));
    return job;
  }

  async updateReconstructionJob(id: number, updates: Partial<InsertReconstructionJob>): Promise<ReconstructionJob | undefined> {
    const [job] = await db
      .update(reconstructionJobs)
      .set(updates)
      .where(eq(reconstructionJobs.id, id))
      .returning();
    return job;
  }

  async getIncompleteReconstructionJobs(): Promise<ReconstructionJob[]> {
    return await db
      .select()
      .from(reconstructionJobs)
      .where(notInArray(reconstructionJobs.status, ["complete", "failed"]));
  }

  async createReconstructionChunk(chunk: InsertReconstructionChunk): Promise<ReconstructionChunk> {
    const [created] = await db.insert(reconstructionChunks).values(chunk).returning();
    return created;
  }

  async getReconstructionChunks(jobId: number): Promise<ReconstructionChunk[]> {
    return await db
      .select()
      .from(reconstructionChunks)
      .where(eq(reconstructionChunks.jobId, jobId))
      .orderBy(asc(reconstructionChunks.chunkIndex));
  }

  async updateReconstructionChunk(id: number, updates: Partial<InsertReconstructionChunk>): Promise<ReconstructionChunk | undefined> {
    const [chunk] = await db
      .update(reconstructionChunks)
      .set(updates)
      .where(eq(reconstructionChunks.id, id))
      .returning();
    return chunk;
  }
}

export const storage = new DbStorage();
