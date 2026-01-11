/**
 * Type Mappers
 * Convert API response types (snake_case, numeric IDs) to frontend types (camelCase, string IDs).
 * All ID conversions and field name transformations happen here.
 */
import type {
  ApiUser,
  ApiOrganization,
  ApiOrganizationStats,
  ApiMember,
  ApiInvitation,
  ApiDocument,
  ApiDocumentStats,
  ApiChatSession,
  ApiChatMessage,
  ApiChatMessageSource,
  ApiLLMKey,
} from '@/types/api';

import type {
  User,
  Organization,
  OrganizationStats,
  OrganizationMember,
  Invitation,
  Document,
  DocumentStats,
  ChatSession,
  ChatMessage,
  DocumentSource,
  LLMKey,
} from '@/types';

export function mapUser(api: ApiUser): User {
  const emailFallback = api.email.split('@')[0] || 'User';
  return {
    id: String(api.id),
    name: api.name?.trim() || emailFallback,
    email: api.email,
    avatarUrl: undefined,
  };
}

export function mapOrganization(api: ApiOrganization): Organization {
  return {
    id: String(api.id),
    name: api.name,
    slug: api.slug,
    createdAt: api.created_at,
  };
}

export function mapOrganizationStats(api: ApiOrganizationStats): OrganizationStats {
  return {
    fileCount: api.file_count,
    totalChunks: api.total_chunks,
    totalSize: api.total_size,
    currentDocuments: api.current_documents,
    currentStorageBytes: api.current_storage_bytes,
    currentChunks: api.current_chunks,
    currentChatSessions: api.current_chat_sessions,
    maxDocuments: api.max_documents,
    maxStorageBytes: api.max_storage_bytes,
    maxChatSessions: api.max_chat_sessions,
  };
}

export function mapMember(api: ApiMember): OrganizationMember {
  const emailFallback = api.user.email.split('@')[0] || 'User';
  return {
    id: String(api.id),
    userId: String(api.user_id),
    user: {
      id: String(api.user.id),
      name: api.user.name?.trim() || emailFallback,
      email: api.user.email,
      avatarUrl: api.user.avatar_url ?? undefined,
    },
    role: api.role,
    joinedAt: api.joined_at,
  };
}

export function mapInvitation(api: ApiInvitation): Invitation {
  return {
    id: String(api.id),
    email: api.email,
    role: api.role,
    status: api.status,
    expiresAt: api.expires_at,
    createdAt: api.created_at,
  };
}

export function mapDocument(api: ApiDocument): Document {
  return {
    id: String(api.id),
    organizationId: String(api.organization_id),
    fileName: api.file_name,
    fileType: api.file_type,
    fileSize: api.file_size,
    status: api.status,
    errorMessage: api.error_message ?? undefined,
    chunkCount: api.chunk_count,
    uploadedAt: api.uploaded_at,
    processedAt: api.processed_at ?? undefined,
  };
}

export function mapDocumentStats(api: ApiDocumentStats): DocumentStats {
  return {
    totalDocuments: api.total_documents,
    readyDocuments: api.ready_documents,
    processingDocuments: api.processing_documents,
    failedDocuments: api.failed_documents,
    totalChunks: api.total_chunks,
    totalSize: api.total_size,
  };
}

export function mapChatSession(api: ApiChatSession): ChatSession {
  return {
    id: String(api.id),
    organizationId: String(api.organization_id),
    title: api.title,
    messageCount: api.message_count,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function mapDocumentSource(api: ApiChatMessageSource): DocumentSource {
  return {
    documentId: String(api.document_id),
    fileName: api.file_name,
    chunkId: String(api.chunk_id),
    relevanceScore: api.relevance_score,
    textPreview: api.text_preview,
  };
}

export function mapChatMessage(api: ApiChatMessage): ChatMessage {
  return {
    id: String(api.id),
    sessionId: String(api.session_id),
    role: api.role,
    content: api.content,
    createdAt: api.created_at,
    sources: api.sources?.map(mapDocumentSource),
  };
}

export function mapLLMKey(api: ApiLLMKey): LLMKey {
  return {
    id: String(api.id),
    organizationId: String(api.organization_id),
    provider: api.provider,
    keyName: api.key_name,
    isActive: api.is_active,
    createdAt: api.created_at,
    lastUsedAt: api.last_used_at ?? undefined,
  };
}
