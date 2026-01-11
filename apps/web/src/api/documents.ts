/**
 * Documents API Module
 * Handles all document-related API calls including upload and stats.
 */
import { api } from '@/lib/api-client';
import type {
  ApiDocument,
  ApiDocumentList,
  ApiDocumentUploadResponse,
  ApiDocumentStats,
} from '@/types/api';

const BASE = '/api/documents';

type ListOptions = {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
};

export const documentsApi = {
  list(orgId: number, options: ListOptions = {}) {
    const params = new URLSearchParams({
      org_id: String(orgId),
      page: String(options.page ?? 1),
      page_size: String(options.pageSize ?? 20),
    });
    if (options.status) {
      params.append('status', options.status);
    }
    if (options.search) {
      params.append('search', options.search);
    }
    return api.get<ApiDocumentList>(`${BASE}?${params}`);
  },

  get(docId: number, orgId: number) {
    return api.get<ApiDocument>(`${BASE}/${docId}?org_id=${orgId}`);
  },

  upload(file: File, orgId: number) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('org_id', String(orgId));
    return api.post<ApiDocumentUploadResponse>(`${BASE}/upload`, formData);
  },

  delete(docId: number, orgId: number) {
    return api.delete(`${BASE}/${docId}?org_id=${orgId}`);
  },

  reprocess(docId: number, orgId: number) {
    return api.post<ApiDocument>(`${BASE}/${docId}/reprocess?org_id=${orgId}`);
  },

  getStats(orgId: number) {
    return api.get<ApiDocumentStats>(`${BASE}/organizations/${orgId}/stats`);
  },
};
