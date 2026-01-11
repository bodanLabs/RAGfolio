/**
 * Frontend Domain Types
 * These types are used throughout the UI components.
 * Uses camelCase for JavaScript conventions.
 * IDs are strings for React keys and URL params.
 */

// User & Auth
export type UserRole = 'ADMIN' | 'USER';

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

// Organization
export type Organization = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type OrganizationStats = {
  fileCount: number;
  totalChunks: number;
  totalSize: number;
  currentDocuments: number;
  currentStorageBytes: number;
  currentChunks: number;
  currentChatSessions: number;
  maxDocuments: number;
  maxStorageBytes: number;
  maxChatSessions: number;
};

// Member
export type OrganizationMember = {
  id: string;
  userId: string;
  user: User;
  role: UserRole;
  joinedAt: string;
};

// Invitation
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED';

export type Invitation = {
  id: string;
  email: string;
  role: UserRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
};

// Document
export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';

export type Document = {
  id: string;
  organizationId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: DocumentStatus;
  errorMessage?: string;
  chunkCount: number;
  uploadedAt: string;
  processedAt?: string;
};

export type DocumentStats = {
  totalDocuments: number;
  readyDocuments: number;
  processingDocuments: number;
  failedDocuments: number;
  totalChunks: number;
  totalSize: number;
};

// Chat
export type ChatSession = {
  id: string;
  organizationId: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DocumentSource = {
  documentId: string;
  fileName: string;
  chunkId: string;
  relevanceScore: number;
  textPreview: string;
};

export type ChatMessage = {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  sources?: DocumentSource[];
};

// LLM Settings
export type LLMKey = {
  id: string;
  organizationId: string;
  provider: string;
  keyName: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
};

// App State
export type AppState = {
  user: User | null;
  currentOrganization: Organization | null;
  currentOrganizationId: number | null;
  userRole: UserRole | null;
  isAuthenticated: boolean;
  organizations: Organization[];
};
