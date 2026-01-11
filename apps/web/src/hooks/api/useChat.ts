/**
 * Chat Hooks
 * React Query hooks for chat sessions and messages.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/api/chat';
import { queryKeys } from '@/lib/query-keys';
import { mapChatSession, mapChatMessage } from '@/lib/mappers';
import type { ChatMessage } from '@/types';

export function useChatSessions(orgId: number, page = 1) {
  return useQuery({
    queryKey: queryKeys.chat.sessionList(orgId, { page }),
    queryFn: async () => {
      const data = await chatApi.listSessions(orgId, page);
      return data.map(mapChatSession);
    },
    enabled: orgId > 0,
  });
}

export function useChatSession(orgId: number, sessionId: number) {
  return useQuery({
    queryKey: queryKeys.chat.session(orgId, sessionId),
    queryFn: async () => {
      const data = await chatApi.getSession(sessionId, orgId);
      return mapChatSession(data);
    },
    enabled: orgId > 0 && sessionId > 0,
  });
}

export function useChatMessages(orgId: number, sessionId: number) {
  return useQuery({
    queryKey: queryKeys.chat.messages(orgId, sessionId),
    queryFn: async () => {
      const data = await chatApi.getMessages(sessionId, orgId);
      return data.map(mapChatMessage);
    },
    enabled: orgId > 0 && sessionId > 0,
  });
}

export function useCreateChatSession(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title?: string) =>
      chatApi.createSession(orgId, title ? { title } : undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chat.sessions(orgId),
      });
    },
  });
}

export function useUpdateChatSession(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, title }: { sessionId: number; title: string }) =>
      chatApi.updateSession(sessionId, orgId, { title }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chat.session(orgId, variables.sessionId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chat.sessions(orgId),
      });
    },
  });
}

export function useDeleteChatSession(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: number) => chatApi.deleteSession(sessionId, orgId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chat.sessions(orgId),
      });
    },
  });
}

export function useSendMessage(orgId: number, sessionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      chatApi.sendMessage(sessionId, orgId, { content }),
    // Optimistic update: add user message immediately
    onMutate: async (content) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.chat.messages(orgId, sessionId),
      });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<ChatMessage[]>(
        queryKeys.chat.messages(orgId, sessionId)
      );

      // Optimistically add the user message
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        sessionId: String(sessionId),
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ChatMessage[]>(
        queryKeys.chat.messages(orgId, sessionId),
        (old = []) => [...old, optimisticMessage]
      );

      return { previousMessages };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.chat.messages(orgId, sessionId),
          context.previousMessages
        );
      }
    },
    onSettled: () => {
      // Refetch to get the real data (including assistant response)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(orgId, sessionId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chat.session(orgId, sessionId),
      });
    },
  });
}
