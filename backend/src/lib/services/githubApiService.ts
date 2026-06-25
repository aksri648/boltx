import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GitHubApiService');

export class GitHubApiService {
  private token: string | undefined;

  constructor(token?: string) {
    this.token = token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  async getUser() {
    const res = await fetch('https://api.github.com/user', { headers: this.getHeaders() });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    return res.json();
  }

  async getRepos() {
    const res = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', { headers: this.getHeaders() });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    return res.json();
  }

  async createRepo(name: string, description?: string, private_: boolean = false) {
    const res = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: { ...this.getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, private: private_ }),
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    return res.json();
  }

  async pushFiles(owner: string, repo: string, files: { path: string; content: string }[], message: string = 'Initial commit') {
    const results = [];
    for (const file of files) {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`, {
        method: 'PUT',
        headers: { ...this.getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          content: Buffer.from(file.content).toString('base64'),
        }),
      });
      if (!res.ok) throw new Error(`GitHub API error pushing ${file.path}: ${res.status}`);
      results.push(await res.json());
    }
    return results;
  }
}

export function getGitHubApiService(token?: string): GitHubApiService {
  // Always create a new instance per-request to avoid token race conditions
  return new GitHubApiService(token);
}
