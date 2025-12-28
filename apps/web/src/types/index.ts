// User & Auth Types
export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface OrganizationMember {
  id: string;
  user: User;
  role: UserRole;
  joinedDate: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  invitedDate: string;
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  createdDate: string;
  stats: OrganizationStats;
}

export interface OrganizationStats {
  fileCount: number;
  totalChunks: number;
  totalSize?: number;
  lastUpdated?: string;
}

// Document Types
export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';

export interface Document {
  id: string;
  fileName: string;
  fileType: 'txt' | 'pdf' | 'docx';
  fileSize: number;
  status: DocumentStatus;
  uploadedDate: string;
  uploadedBy?: string;
  chunks?: number;
  errorMessage?: string;
}

// Chat Types
export interface ChatSession {
  id: string;
  title: string;
  createdDate: string;
  lastUpdatedDate: string;
  messageCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: DocumentSource[];
}

export interface DocumentSource {
  documentId: string;
  fileName: string;
  chunk: string;
  relevanceScore: number;
}

// LLM Settings Types
export interface LLMSettings {
  provider: 'OpenAI';
  apiKey: string;
  keyStatus: 'SET' | 'NOT_SET';
}

// App Context Types
export interface AppState {
  user: User | null;
  currentOrganization: Organization | null;
  userRole: UserRole | null;
  isAuthenticated: boolean;
  organizations: Organization[];
}
