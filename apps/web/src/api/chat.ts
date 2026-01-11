/**
 * Chat API Module
 * Handles all chat-related API calls including sessions and messages.
 */
import { api } from '@/lib/api-client';
import type {
  ApiChatSession,
  ApiChatSessionCreate,
  ApiChatSessionUpdate,
  ApiChatMessage,
  ApiChatMessageCreate,
} from '@/types/api';

const BASE = '/api/chat';

export const chatApi = {
  // Sessions
  listSessions(orgId: number, page = 1, pageSize = 20) {
    return api.get<ApiChatSession[]>(
      `${BASE}/sessions?org_id=${orgId}&page=${page}&page_size=${pageSize}`
    );
  },

  createSession(orgId: number, data?: ApiChatSessionCreate) {
    return api.post<ApiChatSession>(
      `${BASE}/sessions?org_id=${orgId}`,
      data ?? { title: 'New Chat' }
    );
  },

  getSession(sessionId: number, orgId: number) {
    return api.get<ApiChatSession>(
      `${BASE}/sessions/${sessionId}?org_id=${orgId}`
    );
  },

  updateSession(sessionId: number, orgId: number, data: ApiChatSessionUpdate) {
    return api.patch<ApiChatSession>(
      `${BASE}/sessions/${sessionId}?org_id=${orgId}`,
      data
    );
  },

  deleteSession(sessionId: number, orgId: number) {
    return api.delete(`${BASE}/sessions/${sessionId}?org_id=${orgId}`);
  },

  // Messages
  getMessages(sessionId: number, orgId: number, limit = 50) {
    return api.get<ApiChatMessage[]>(
      `${BASE}/sessions/${sessionId}/messages?org_id=${orgId}&limit=${limit}`
    );
  },

  sendMessage(sessionId: number, orgId: number, data: ApiChatMessageCreate) {
    return api.post<ApiChatMessage>(
      `${BASE}/sessions/${sessionId}/messages?org_id=${orgId}`,
      data
    );
  },
};
