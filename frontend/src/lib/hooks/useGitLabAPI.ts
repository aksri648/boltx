/**
 * GitLab API hook for authenticated API calls.
 * Provides methods to interact with the GitLab API using the stored token.
 */

import { useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { gitlabConnection } from '~/lib/stores/gitlabConnection';

interface GitLabUser {
  id: number;
  username: string;
  name: string;
  avatar_url: string;
  web_url: string;
  email?: string;
}

interface GitLabProject {
  id: number;
  name: string;
  path_with_namespace: string;
  description: string;
  web_url: string;
  visibility: string;
  last_activity_at: string;
  star_count: number;
  forks_count: number;
}

export const useGitLabAPI = (config?: { token: string; baseUrl: string }) => {
  const connection = useStore(gitlabConnection);
  const effectiveToken = config?.token || connection?.token || '';
  const effectiveBaseUrl = config?.baseUrl || connection?.gitlabUrl || 'https://gitlab.com';

  const getAuthHeaders = useCallback((): Record<string, string> => {
    return {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': effectiveToken,
    };
  }, [effectiveToken]);

  const fetchUser = useCallback(async (): Promise<GitLabUser | null> => {
    if (!effectiveToken) return null;

    try {
      const response = await fetch(`${effectiveBaseUrl}/api/v4/user`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  }, [effectiveToken, effectiveBaseUrl, getAuthHeaders]);

  const fetchProjects = useCallback(async (): Promise<GitLabProject[]> => {
    if (!effectiveToken) return [];

    try {
      const response = await fetch(
        `${effectiveBaseUrl}/api/v4/projects?per_page=100&sort=updated_desc&membership=true`,
        { headers: getAuthHeaders() },
      );

      if (!response.ok) return [];
      return response.json();
    } catch {
      return [];
    }
  }, [effectiveToken, effectiveBaseUrl, getAuthHeaders]);

  return {
    connection,
    isAuthenticated: !!effectiveToken && !!connection?.user,
    effectiveBaseUrl,
    fetchUser,
    fetchProjects,
    getAuthHeaders,
  };
};
