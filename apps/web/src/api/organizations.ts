/**
 * Organizations API Module
 * Handles all organization-related API calls including members and invitations.
 */
import { api } from '@/lib/api-client';
import type {
  ApiOrganization,
  ApiOrganizationCreate,
  ApiOrganizationUpdate,
  ApiOrganizationStats,
  ApiMember,
  ApiMemberUpdate,
  ApiInvitation,
  ApiInvitationCreate,
  ApiInvitationAcceptResponse,
} from '@/types/api';

const BASE = '/api/organizations';

export const organizationsApi = {
  // Organizations
  list(page = 1, pageSize = 20) {
    return api.get<ApiOrganization[]>(
      `${BASE}?page=${page}&page_size=${pageSize}`
    );
  },

  create(data: ApiOrganizationCreate) {
    return api.post<ApiOrganization>(BASE, data);
  },

  get(orgId: number) {
    return api.get<ApiOrganization>(`${BASE}/${orgId}`);
  },

  update(orgId: number, data: ApiOrganizationUpdate) {
    return api.patch<ApiOrganization>(`${BASE}/${orgId}`, data);
  },

  delete(orgId: number) {
    return api.delete(`${BASE}/${orgId}`);
  },

  getStats(orgId: number) {
    return api.get<ApiOrganizationStats>(`${BASE}/${orgId}/stats`);
  },

  // Members
  listMembers(orgId: number, page = 1, pageSize = 20) {
    return api.get<ApiMember[]>(
      `${BASE}/${orgId}/members?page=${page}&page_size=${pageSize}`
    );
  },

  updateMemberRole(orgId: number, memberId: number, data: ApiMemberUpdate) {
    return api.patch<ApiMember>(
      `${BASE}/${orgId}/members/${memberId}/role`,
      data
    );
  },

  removeMember(orgId: number, memberId: number) {
    return api.delete(`${BASE}/${orgId}/members/${memberId}`);
  },

  // Invitations
  listInvitations(orgId: number, page = 1, pageSize = 20, status?: string) {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });
    if (status) {
      params.append('status', status);
    }
    return api.get<ApiInvitation[]>(`${BASE}/${orgId}/invitations?${params}`);
  },

  createInvitation(orgId: number, data: ApiInvitationCreate) {
    return api.post<ApiInvitation>(`${BASE}/${orgId}/invitations`, data);
  },

  revokeInvitation(orgId: number, invitationId: number) {
    return api.delete(`${BASE}/${orgId}/invitations/${invitationId}`);
  },

  resendInvitation(orgId: number, invitationId: number) {
    return api.post<ApiInvitation>(
      `${BASE}/${orgId}/invitations/${invitationId}/resend`
    );
  },

  acceptInvitation(
    token: string,
    data?: { password?: string; name?: string }
  ) {
    return api.post<ApiInvitationAcceptResponse>(
      `${BASE}/invitations/${token}/accept`,
      data
    );
  },
};
