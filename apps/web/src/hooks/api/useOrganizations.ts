/**
 * Organization Hooks
 * React Query hooks for organizations, members, and invitations.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '@/api/organizations';
import { queryKeys } from '@/lib/query-keys';
import {
  mapOrganization,
  mapOrganizationStats,
  mapMember,
  mapInvitation,
} from '@/lib/mappers';
import type { UserRole } from '@/types';

// Organizations
export function useOrganizations(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: queryKeys.organizations.list({ page }),
    queryFn: async () => {
      const data = await organizationsApi.list(page, pageSize);
      return data.map(mapOrganization);
    },
  });
}

export function useOrganization(orgId: number) {
  return useQuery({
    queryKey: queryKeys.organizations.detail(orgId),
    queryFn: async () => {
      const data = await organizationsApi.get(orgId);
      return mapOrganization(data);
    },
    enabled: orgId > 0,
  });
}

export function useOrganizationStats(orgId: number) {
  return useQuery({
    queryKey: queryKeys.organizations.stats(orgId),
    queryFn: async () => {
      const data = await organizationsApi.getStats(orgId);
      return mapOrganizationStats(data);
    },
    enabled: orgId > 0,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => organizationsApi.create({ name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.lists(),
      });
    },
  });
}

export function useUpdateOrganization(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string; slug?: string }) =>
      organizationsApi.update(orgId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.detail(orgId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.lists(),
      });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orgId: number) => organizationsApi.delete(orgId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.lists(),
      });
    },
  });
}

// Members
export function useMembers(orgId: number, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: queryKeys.members.list(orgId, { page }),
    queryFn: async () => {
      const data = await organizationsApi.listMembers(orgId, page, pageSize);
      return data.map(mapMember);
    },
    enabled: orgId > 0,
  });
}

export function useUpdateMemberRole(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      role,
    }: {
      memberId: number;
      role: UserRole;
    }) => organizationsApi.updateMemberRole(orgId, memberId, { role }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.members.all(orgId),
      });
    },
  });
}

export function useRemoveMember(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: number) =>
      organizationsApi.removeMember(orgId, memberId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.members.all(orgId),
      });
    },
  });
}

// Invitations
export function useInvitations(orgId: number, page = 1, status?: string) {
  return useQuery({
    queryKey: queryKeys.invitations.list(orgId, { page, status }),
    queryFn: async () => {
      const data = await organizationsApi.listInvitations(
        orgId,
        page,
        20,
        status
      );
      return data.map(mapInvitation);
    },
    enabled: orgId > 0,
  });
}

export function useCreateInvitation(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; role?: UserRole }) =>
      organizationsApi.createInvitation(orgId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.invitations.all(orgId),
      });
    },
  });
}

export function useRevokeInvitation(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: number) =>
      organizationsApi.revokeInvitation(orgId, invitationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.invitations.all(orgId),
      });
    },
  });
}

export function useResendInvitation(orgId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: number) =>
      organizationsApi.resendInvitation(orgId, invitationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.invitations.all(orgId),
      });
    },
  });
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: ({
      token,
      data,
    }: {
      token: string;
      data?: { password?: string; name?: string };
    }) => organizationsApi.acceptInvitation(token, data),
  });
}
