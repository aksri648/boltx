import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GitLabApiService');

export class GitLabApiService {
  private token: string | undefined;

  constructor(token?: string) {
    this.token = token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['PRIVATE-TOKEN'] = this.token;
    }
    return headers;
  }

  async getUser() {
    const res = await fetch('https://gitlab.com/api/v4/user', { headers: this.getHeaders() });
    if (!res.ok) throw new Error(`GitLab API error: ${res.status}`);
    return res.json();
  }

  async createProject(name: string, description?: string, visibility: 'private' | 'public' = 'private') {
    const res = await fetch('https://gitlab.com/api/v4/projects', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, description, visibility }),
    });
    if (!res.ok) throw new Error(`GitLab API error: ${res.status}`);
    return res.json();
  }
}

export function getGitLabApiService(token?: string): GitLabApiService {
  // Always create a new instance per-request to avoid token race conditions
  return new GitLabApiService(token);
}
