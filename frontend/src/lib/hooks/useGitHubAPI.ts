/**
 * GitHub API hook for authenticated API calls.
 * This provides methods to interact with the GitHub API using the stored token.
 * The actual API calls are made through the backend proxy for security.
 */

import { useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { githubConnectionAtom } from '~/lib/stores/githubConnection';

interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  email: string;
  public_repos: number;
  followers: number;
  following: number;
}

interface Repo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  private: boolean;
  fork: boolean;
  stargazers_count: number;
  forks_count: number;
  language: string;
  updated_at: string;
}

export const useGitHubAPI = () => {
  const connection = useStore(githubConnectionAtom);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (!connection.token) return {};
    return {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `${connection.tokenType === 'classic' ? 'token' : 'Bearer'} ${connection.token}`,
      'User-Agent': 'Bolt.diy',
    };
  }, [connection.token, connection.tokenType]);

  const fetchUser = useCallback(async (): Promise<GitHubUser | null> => {
    if (!connection.token) return null;

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  }, [connection.token, getAuthHeaders]);

  const fetchRepos = useCallback(async (): Promise<Repo[]> => {
    if (!connection.token) return [];

    try {
      const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) return [];
      return response.json();
    } catch {
      return [];
    }
  }, [connection.token, getAuthHeaders]);

  return {
    connection,
    isAuthenticated: !!connection.token && !!connection.user,
    fetchUser,
    fetchRepos,
    getAuthHeaders,
  };
};
