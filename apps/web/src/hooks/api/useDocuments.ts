/**
 * Document Hooks
 * React Query hooks for document management.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/api/documents';
import { queryKeys } from '@/lib/query-keys';
import { mapDocument, mapDocumentStats } from '@/lib/mappers';
import type { DocumentStatus } from '@/types';

type DocumentFilters = {
  page?: number;
  pageSize?: number;
  status?: DocumentStatus;
  search?: string;
};

export function useDocuments(orgId: number, filters: DocumentFilters = {}) {
  const { page = 1, pageSize = 20, status, search } = filters;

  return useQuery({
    queryKey: queryKeys.documents.list(orgId, { page, status, search }),
    queryFn: async () => {
      const data = await documentsApi.list(orgId, {
        page,
        pageSize,
        status,
        search,
      });
      return {
        documents: data.items.map(mapDocument),
        pagination: data.pagination,
      };
    },
    enabled: orgId > 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      // If we don't have data, don't poll
      if (!data) return false;

      // Check if any visible documents are in a transient state
      const hasPendingDocs = data.documents.some(
        (doc) => doc.status === 'PROCESSING' || doc.status === 'UPLOADED'
      );

      // Poll every 2 seconds if we have pending documents
      return hasPendingDocs ? 2000 : false;
    },
  });
}

export function useDocument(orgId: number, docId: number) {
  return useQuery({
    queryKey: queryKeys.documents.detail(orgId, docId),
    queryFn: async () => {
      const data = await documentsApi.get(docId, orgId);
      return mapDocument(data);
    },
    enabled: orgId > 0 && docId > 0,
  });
}

export function useDocumentStats(orgId: number) {
  return useQuery({
    queryKey: queryKeys.documents.stats(orgId),
    queryFn: async () => {
      const data = await documentsApi.getStats(orgId);
      return mapDocumentStats(data);
    },
    enabled: orgId > 0,
  });
}

export function useUploadDocument(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => documentsApi.upload(file, orgId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.documents.lists(orgId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.documents.stats(orgId),
      });
    },
  });
}

export function useDeleteDocument(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (docId: number) => documentsApi.delete(docId, orgId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.documents.lists(orgId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.documents.stats(orgId),
      });
    },
  });
}

export function useReprocessDocument(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (docId: number) => documentsApi.reprocess(docId, orgId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.documents.lists(orgId),
      });
    },
  });
}
