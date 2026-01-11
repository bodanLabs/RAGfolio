/**
 * LLM API Module
 * Handles all LLM API key management calls.
 */
import { api } from '@/lib/api-client';
import type {
  ApiLLMKey,
  ApiLLMKeyCreate,
  ApiLLMKeyUpdate,
  ApiLLMKeyTest,
  ApiLLMKeyTestResponse,
} from '@/types/api';

export const llmApi = {
  listKeys(orgId: number) {
    return api.get<ApiLLMKey[]>(`/api/organizations/${orgId}/llm-keys`);
  },

  createKey(orgId: number, data: ApiLLMKeyCreate) {
    return api.post<ApiLLMKey>(`/api/organizations/${orgId}/llm-keys`, data);
  },

  updateKey(orgId: number, keyId: number, data: ApiLLMKeyUpdate) {
    return api.patch<ApiLLMKey>(
      `/api/organizations/${orgId}/llm-keys/${keyId}`,
      data
    );
  },

  deleteKey(orgId: number, keyId: number) {
    return api.delete(`/api/organizations/${orgId}/llm-keys/${keyId}`);
  },

  activateKey(orgId: number, keyId: number) {
    return api.post<ApiLLMKey>(
      `/api/organizations/${orgId}/llm-keys/${keyId}/activate`
    );
  },

  testKey(orgId: number, data: ApiLLMKeyTest) {
    return api.post<ApiLLMKeyTestResponse>(
      `/api/organizations/${orgId}/llm-keys/test`,
      data
    );
  },
};
