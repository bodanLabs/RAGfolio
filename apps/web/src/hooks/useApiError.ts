/**
 * API Error Hook
 * Provides centralized error handling for API calls with toast notifications.
 */
import { useCallback } from 'react';
import { isApiError } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export function useApiError() {
  const { toast } = useToast();

  const handleError = useCallback(
    (error: unknown, context?: string) => {
      let title = 'Error';
      let message = 'An unexpected error occurred';

      if (isApiError(error)) {
        message = error.message;

        // Handle specific status codes
        if (error.status === 401) {
          title = 'Authentication Required';
          message = 'Please log in again.';
        } else if (error.status === 403) {
          title = 'Permission Denied';
          message = 'You do not have permission for this action.';
        } else if (error.status === 404) {
          title = 'Not Found';
        } else if (error.status === 409) {
          title = 'Conflict';
        } else if (error.status === 422) {
          title = 'Validation Error';
        } else if (error.status === 429) {
          title = 'Too Many Requests';
          message = 'Please wait a moment and try again.';
        } else if (error.status !== undefined && error.status >= 500) {
          title = 'Server Error';
          message = 'Something went wrong. Please try again later.';
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      toast({
        variant: 'destructive',
        title: context ? `${context}: ${title}` : title,
        description: message,
      });
    },
    [toast]
  );

  return { handleError };
}
