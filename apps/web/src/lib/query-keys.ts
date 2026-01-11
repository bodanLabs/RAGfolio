/**
 * Query Key Factory for React Query
 * Provides consistent, hierarchical keys for cache management.
 * Keys are structured to allow selective invalidation.
 */

type DocumentFilters = {
  page?: number;
  status?: string;
  search?: string;
};

type PaginationFilters = {
  page?: number;
};

type InvitationFilters = {
  page?: number;
  status?: string;
};

export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },

  // Organizations
  organizations: {
    all: ['organizations'] as const,
    lists: () => [...queryKeys.organizations.all, 'list'] as const,
    list: (filters: PaginationFilters = {}) =>
      [...queryKeys.organizations.lists(), filters] as const,
    details: () => [...queryKeys.organizations.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.organizations.details(), id] as const,
    stats: (id: number) =>
      [...queryKeys.organizations.detail(id), 'stats'] as const,
  },

  // Members (scoped to organization)
  members: {
    all: (orgId: number) => ['organizations', orgId, 'members'] as const,
    lists: (orgId: number) => [...queryKeys.members.all(orgId), 'list'] as const,
    list: (orgId: number, filters: PaginationFilters = {}) =>
      [...queryKeys.members.lists(orgId), filters] as const,
  },

  // Invitations (scoped to organization)
  invitations: {
    all: (orgId: number) => ['organizations', orgId, 'invitations'] as const,
    lists: (orgId: number) =>
      [...queryKeys.invitations.all(orgId), 'list'] as const,
    list: (orgId: number, filters: InvitationFilters = {}) =>
      [...queryKeys.invitations.lists(orgId), filters] as const,
  },

  // Documents (scoped to organization)
  documents: {
    all: (orgId: number) => ['organizations', orgId, 'documents'] as const,
    lists: (orgId: number) => [...queryKeys.documents.all(orgId), 'list'] as const,
    list: (orgId: number, filters: DocumentFilters = {}) =>
      [...queryKeys.documents.lists(orgId), filters] as const,
    details: (orgId: number) =>
      [...queryKeys.documents.all(orgId), 'detail'] as const,
    detail: (orgId: number, docId: number) =>
      [...queryKeys.documents.details(orgId), docId] as const,
    stats: (orgId: number) =>
      [...queryKeys.documents.all(orgId), 'stats'] as const,
  },

  // Chat (scoped to organization)
  chat: {
    all: (orgId: number) => ['organizations', orgId, 'chat'] as const,
    sessions: (orgId: number) =>
      [...queryKeys.chat.all(orgId), 'sessions'] as const,
    sessionLists: (orgId: number) =>
      [...queryKeys.chat.sessions(orgId), 'list'] as const,
    sessionList: (orgId: number, filters: PaginationFilters = {}) =>
      [...queryKeys.chat.sessionLists(orgId), filters] as const,
    session: (orgId: number, sessionId: number) =>
      [...queryKeys.chat.sessions(orgId), 'detail', sessionId] as const,
    messages: (orgId: number, sessionId: number) =>
      [...queryKeys.chat.session(orgId, sessionId), 'messages'] as const,
  },

  // LLM Keys (scoped to organization)
  llmKeys: {
    all: (orgId: number) => ['organizations', orgId, 'llm-keys'] as const,
    list: (orgId: number) => [...queryKeys.llmKeys.all(orgId), 'list'] as const,
  },
} as const;
