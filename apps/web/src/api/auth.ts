/**
 * Auth API Module
 * Handles authentication-related API calls.
 */
import { api } from '@/lib/api-client';
import type {
  ApiTokenResponse,
  ApiUser,
  ApiLoginRequest,
  ApiSignupRequest,
} from '@/types/api';

export const authApi = {
  login(data: ApiLoginRequest) {
    return api.post<ApiTokenResponse>('/auth/login', data);
  },

  signup(data: ApiSignupRequest) {
    return api.post<ApiTokenResponse>('/auth/signup', data);
  },

  me() {
    return api.get<ApiUser>('/auth/me');
  },
};
