import fs from "fs";
import path from "path";
import type { Chunk, FileInfo } from "./types";

export interface RAGPersistenceData {
  chunks: Chunk[];
  embeddings: number[][];
  files: FileInfo[];
  lastUpdated: string;
}

export class RAGPersistenceService {
  private static instance: RAGPersistenceService;
  private dataPath: string;
  private data: RAGPersistenceData;

  private constructor() {
    // Store data in a temporary directory that persists across API calls
    this.dataPath = path.join(process.cwd(), ".rag-data.json");
    this.data = {
      chunks: [],
      embeddings: [],
      files: [],
      lastUpdated: new Date().toISOString(),
    };
    this.loadData();
  }

  public static getInstance(): RAGPersistenceService {
    if (!RAGPersistenceService.instance) {
      RAGPersistenceService.instance = new RAGPersistenceService();
    }
    return RAGPersistenceService.instance;
  }

  private loadData(): void {
    try {
      if (fs.existsSync(this.dataPath)) {
        const fileContent = fs.readFileSync(this.dataPath, "utf-8");
        this.data = JSON.parse(fileContent);
        console.log(`📁 Loaded RAG persistence data: ${this.data.chunks.length} chunks, ${this.data.embeddings.length} embeddings, ${this.data.files.length} files`);
      } else {
        console.log("📁 No existing RAG persistence data found, starting fresh");
      }
    } catch (error) {
      console.error("❌ Error loading RAG persistence data:", error);
      // Start with empty data if loading fails
      this.data = {
        chunks: [],
        embeddings: [],
        files: [],
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  private saveData(): void {
    try {
      this.data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
      console.log(`💾 Saved RAG persistence data: ${this.data.chunks.length} chunks, ${this.data.embeddings.length} embeddings, ${this.data.files.length} files`);
    } catch (error) {
      console.error("❌ Error saving RAG persistence data:", error);
    }
  }

  public getChunks(): Chunk[] {
    return this.data.chunks;
  }

  public getEmbeddings(): number[][] {
    return this.data.embeddings;
  }

  public getFiles(): FileInfo[] {
    return this.data.files;
  }

  public setChunks(chunks: Chunk[]): void {
    this.data.chunks = chunks;
    this.saveData();
  }

  public setEmbeddings(embeddings: number[][]): void {
    this.data.embeddings = embeddings;
    this.saveData();
  }

  public setFiles(files: FileInfo[]): void {
    this.data.files = files;
    this.saveData();
  }

  public addFiles(files: FileInfo[]): void {
    this.data.files.push(...files);
    this.saveData();
  }

  public removeFile(fileId: string): void {
    this.data.files = this.data.files.filter((f) => f.id !== fileId);
    this.data.chunks = this.data.chunks.filter((c) => c.fileId !== fileId);
    // Remove corresponding embeddings
    const fileChunks = this.data.chunks.filter((c) => c.fileId === fileId);
    const chunkIds = new Set(fileChunks.map((c) => c.id));
    this.data.embeddings = this.data.embeddings.filter((_, index) => {
      const chunk = this.data.chunks[index];
      return chunk && !chunkIds.has(chunk.id);
    });
    this.saveData();
  }

  public clear(): void {
    this.data = {
      chunks: [],
      embeddings: [],
      files: [],
      lastUpdated: new Date().toISOString(),
    };
    this.saveData();
    console.log("🗑️ RAG persistence data cleared");
  }

  public getStats(): { totalFiles: number; indexedFiles: number; totalChunks: number; totalCharacters: number } {
    return {
      totalFiles: this.data.files.length,
      indexedFiles: this.data.files.filter((f) => f.indexed).length,
      totalChunks: this.data.chunks.length,
      totalCharacters: this.data.files.reduce((sum, f) => sum + f.characterCount, 0),
    };
  }

  public isAvailable(): boolean {
    return this.data.chunks.length > 0 && this.data.embeddings.length > 0;
  }
}
