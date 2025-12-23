// Shared TypeScript types for RAGfolio

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  sources?: DocumentSource[];
}

export interface DocumentSource {
  id: string;
  title: string;
  content: string;
  similarity?: number;
  metadata?: Record<string, unknown>;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Configuration types
export interface RAGConfig {
  modelName: string;
  temperature: number;
  maxTokens: number;
  topK?: number;
}
