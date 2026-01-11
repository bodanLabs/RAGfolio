/**
 * API Response Types
 * These types match the exact shape of backend responses.
 * Uses snake_case to match Python/FastAPI conventions.
 * Uses number for IDs since the backend uses integers.
 */

// Pagination
export type ApiPagination = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
};

// Auth
export type ApiTokenResponse = {
  access_token: string;
  token_type: 'bearer';
  ok: boolean;
};

export type ApiUser = {
  id: number;
  email: string;
  name: string | null;
  created_at: string;
};

export type ApiLoginRequest = {
  email: string;
  password: string;
};

export type ApiSignupRequest = {
  email: string;
  password: string;
  name?: string;
};

// Organization
export type ApiOrganization = {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
};

export type ApiOrganizationCreate = {
  name: string;
};

export type ApiOrganizationUpdate = {
  name?: string;
  slug?: string;
};

export type ApiOrganizationStats = {
  file_count: number;
  total_chunks: number;
  total_size: number;
  current_documents: number;
  current_storage_bytes: number;
  current_chunks: number;
  current_chat_sessions: number;
  max_documents: number;
  max_storage_bytes: number;
  max_chat_sessions: number;
};

// Member
export type ApiMemberUser = {
  id: number;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type ApiMember = {
  id: number;
  user_id: number;
  organization_id: number;
  role: 'ADMIN' | 'USER';
  joined_at: string;
  user: ApiMemberUser;
};

export type ApiMemberUpdate = {
  role: 'ADMIN' | 'USER';
};

// Invitation
export type ApiInvitation = {
  id: number;
  organization_id: number;
  email: string;
  role: 'ADMIN' | 'USER';
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  invited_by_id: number | null;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
};

export type ApiInvitationCreate = {
  email: string;
  role?: 'ADMIN' | 'USER';
};

export type ApiInvitationAcceptResponse = {
  message: string;
  organization_id: number;
  member_id: number;
};

// Document
export type ApiDocumentStatus = 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';

export type ApiDocument = {
  id: number;
  organization_id: number;
  uploaded_by_id: number | null;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  storage_type: string;
  status: ApiDocumentStatus;
  error_message: string | null;
  chunk_count: number;
  uploaded_at: string;
  processed_at: string | null;
  updated_at: string;
  deleted_at: string | null;
};

export type ApiDocumentList = {
  items: ApiDocument[];
  pagination: ApiPagination;
};

export type ApiDocumentUploadResponse = {
  id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  status: string;
  message: string;
};

export type ApiDocumentStats = {
  total_documents: number;
  ready_documents: number;
  processing_documents: number;
  failed_documents: number;
  total_chunks: number;
  total_size: number;
};

// Chat
export type ApiChatSession = {
  id: number;
  organization_id: number;
  user_id: number;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ApiChatSessionCreate = {
  title?: string;
};

export type ApiChatSessionUpdate = {
  title: string;
};

export type ApiChatMessageSource = {
  document_id: number;
  file_name: string;
  chunk_id: number;
  relevance_score: number;
  text_preview: string;
};

export type ApiChatMessage = {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  sources: ApiChatMessageSource[] | null;
};

export type ApiChatMessageCreate = {
  content: string;
};

// LLM
export type ApiLLMKey = {
  id: number;
  organization_id: number;
  provider: string;
  key_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
};

export type ApiLLMKeyCreate = {
  key_name: string;
  api_key: string;
  provider?: string;
};

export type ApiLLMKeyUpdate = {
  key_name?: string;
  api_key?: string;
};

export type ApiLLMKeyTest = {
  api_key: string;
  provider?: string;
};

export type ApiLLMKeyTestResponse = {
  valid: boolean;
  message: string;
};
