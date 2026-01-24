/**
 * Users API Module
 * Handles user profile related API calls.
 */
import { api } from '@/lib/api-client';
import type { ApiUser } from '@/types/api';

export interface UpdateProfileRequest {
  name?: string;
  password?: string;
}

export const usersApi = {
  updateProfile(data: UpdateProfileRequest) {
    return api.patch<ApiUser>('/users/me', data);
  },
};
