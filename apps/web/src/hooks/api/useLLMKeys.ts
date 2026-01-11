/**
 * LLM Key Hooks
 * React Query hooks for LLM API key management.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { llmApi } from '@/api/llm';
import { queryKeys } from '@/lib/query-keys';
import { mapLLMKey } from '@/lib/mappers';

export function useLLMKeys(orgId: number) {
  return useQuery({
    queryKey: queryKeys.llmKeys.list(orgId),
    queryFn: async () => {
      const data = await llmApi.listKeys(orgId);
      return data.map(mapLLMKey);
    },
    enabled: orgId > 0,
  });
}

export function useActiveLLMKey(orgId: number) {
  const { data: keys, ...rest } = useLLMKeys(orgId);
  const activeKey = keys?.find((key) => key.isActive);
  return { data: activeKey, keys, ...rest };
}

export function useCreateLLMKey(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      key_name: string;
      api_key: string;
      provider?: string;
    }) => llmApi.createKey(orgId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.llmKeys.list(orgId),
      });
    },
  });
}

export function useUpdateLLMKey(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      keyId,
      data,
    }: {
      keyId: number;
      data: { key_name?: string; api_key?: string };
    }) => llmApi.updateKey(orgId, keyId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.llmKeys.list(orgId),
      });
    },
  });
}

export function useDeleteLLMKey(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (keyId: number) => llmApi.deleteKey(orgId, keyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.llmKeys.list(orgId),
      });
    },
  });
}

export function useActivateLLMKey(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (keyId: number) => llmApi.activateKey(orgId, keyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.llmKeys.list(orgId),
      });
    },
  });
}

export function useTestLLMKey(orgId: number) {
  return useMutation({
    mutationFn: (data: { api_key: string; provider?: string }) =>
      llmApi.testKey(orgId, data),
  });
}
