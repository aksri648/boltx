import { useCallback, useRef, useState } from 'react';
import { sandboxApi } from '~/lib/api/sandbox';
import { WORK_DIR } from '~/utils/constants';
import git, { type GitAuth, type PromiseFsClient } from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

const lookupSavedPassword = (url: string) => {
  const domain = url.split('/')[2];
  const gitCreds = Cookies.get(`git:${domain}`);

  if (!gitCreds) {
    return null;
  }

  try {
    const { username, password } = JSON.parse(gitCreds || '{}');
    return { username, password };
  } catch (error) {
    console.log(`Failed to parse Git Cookie ${error}`);
    return null;
  }
};

const saveGitAuth = (url: string, auth: GitAuth) => {
  const domain = url.split('/')[2];
  Cookies.set(`git:${domain}`, JSON.stringify(auth));
};

export function useGit() {
  const [ready, setReady] = useState(true);
  const fileData = useRef<Record<string, { data: any; encoding?: string }>>({});
  const fs = getFs(fileData);

  const gitClone = useCallback(
    async (url: string, retryCount = 0) => {
      fileData.current = {};

      let branch: string | undefined;
      let baseUrl = url;

      if (url.includes('#')) {
        [baseUrl, branch] = url.split('#');
      }

      const headers: {
        [x: string]: string;
      } = {
        'User-Agent': 'bolt.diy',
      };

      const auth = lookupSavedPassword(url);

      if (auth) {
        headers.Authorization = `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`;
      }

      try {
        if (retryCount > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
          console.log(`Retrying git clone (attempt ${retryCount + 1})...`);
        }

        await git.clone({
          fs,
          http,
          dir: WORK_DIR,
          url: baseUrl,
          depth: 1,
          singleBranch: true,
          ref: branch,
          corsProxy: '/api/git-proxy',
          headers,
          onProgress: (event) => {
            console.log('Git clone progress:', event);
          },
          onAuth: (baseUrl) => {
            let auth = lookupSavedPassword(baseUrl);

            if (auth) {
              console.log('Using saved authentication for', baseUrl);
              return auth;
            }

            console.log('Repository requires authentication:', baseUrl);

            if (confirm('This repository requires authentication. Would you like to enter your GitHub credentials?')) {
              auth = {
                username: prompt('Enter username') || '',
                password: prompt('Enter password or personal access token') || '',
              };
              return auth;
            } else {
              return { cancel: true };
            }
          },
          onAuthFailure: (baseUrl, _auth) => {
            console.error(`Authentication failed for ${baseUrl}`);
            toast.error(
              `Authentication failed for ${baseUrl.split('/')[2]}. Please check your credentials and try again.`,
            );
            throw new Error(
              `Authentication failed for ${baseUrl.split('/')[2]}. Please check your credentials and try again.`,
            );
          },
          onAuthSuccess: (baseUrl, auth) => {
            console.log(`Authentication successful for ${baseUrl}`);
            saveGitAuth(baseUrl, auth);
          },
        });

        const data: Record<string, { data: any; encoding?: string }> = {};

        for (const [key, value] of Object.entries(fileData.current)) {
          data[key] = value;
        }

        // Write cloned files to the sandbox
        for (const [path, { data: content, encoding }] of Object.entries(fileData.current)) {
          const fullPath = path === '.' ? WORK_DIR : `${WORK_DIR}/${path}`;
          const textContent = content instanceof Uint8Array ? new TextDecoder(encoding || 'utf-8').decode(content) : content;
          await sandboxApi.writeFile(fullPath, textContent);
        }

        return { workdir: WORK_DIR, data };
      } catch (error) {
        console.error('Git clone error:', error);

        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes('Authentication failed')) {
          toast.error(`Authentication failed. Please check your GitHub credentials and try again.`);
          throw error;
        } else if (
          errorMessage.includes('ENOTFOUND') ||
          errorMessage.includes('ETIMEDOUT') ||
          errorMessage.includes('ECONNREFUSED')
        ) {
          toast.error(`Network error while connecting to repository. Please check your internet connection.`);

          if (retryCount < 3) {
            return gitClone(url, retryCount + 1);
          }

          throw new Error(
            `Failed to connect to repository after multiple attempts. Please check your internet connection.`,
          );
        } else if (errorMessage.includes('404')) {
          toast.error(`Repository not found. Please check the URL and make sure the repository exists.`);
          throw new Error(`Repository not found. Please check the URL and make sure the repository exists.`);
        } else if (errorMessage.includes('401')) {
          toast.error(`Unauthorized access to repository. Please connect your GitHub account with proper permissions.`);
          throw new Error(
            `Unauthorized access to repository. Please connect your GitHub account with proper permissions.`,
          );
        } else {
          toast.error(`Failed to clone repository: ${errorMessage}`);
          throw error;
        }
      }
    },
    [fs],
  );

  return { ready, gitClone };
}

const getFs = (
  record: React.MutableRefObject<Record<string, { data: any; encoding?: string }>>,
): PromiseFsClient => ({
  promises: {
    readFile: async (path: string) => {
      const relativePath = pathUtils.relative(WORK_DIR, path);
      const entry = record.current[relativePath];

      if (!entry) {
        const err = new Error(`ENOENT: no such file or directory, open '${path}'`) as NodeJS.ErrnoException;
        err.code = 'ENOENT';
        err.errno = -2;
        err.syscall = 'open';
        err.path = path;
        throw err;
      }

      return entry.data;
    },
    writeFile: async (path: string, data: any) => {
      const relativePath = pathUtils.relative(WORK_DIR, path);
      record.current[relativePath] = { data };
    },
    mkdir: async () => {},
    readdir: async (path: string, options?: any) => {
      const relativePath = pathUtils.relative(WORK_DIR, path);
      const prefix = relativePath === '.' ? '' : relativePath + '/';
      const entryNames = new Set<string>();

      for (const key of Object.keys(record.current)) {
        if (key.startsWith(prefix) && key !== prefix) {
          const rest = key.slice(prefix.length);
          const name = rest.split('/')[0];
          entryNames.add(name);
        }
      }

      const entries = Array.from(entryNames);

      if (options?.withFileTypes) {
        return entries.map((name) => ({
          name,
          isFile: () => {
            const fullKey = prefix + name;
            return !!record.current[fullKey] || name === 'index';
          },
          isDirectory: () => {
            const fullKey = prefix + name;
            return !record.current[fullKey] && entryNames.size > 0;
          },
          isSymbolicLink: () => false,
        }));
      }

      return entries;
    },
    rmdir: async (path: string) => {
      const relativePath = pathUtils.relative(WORK_DIR, path);
      const prefix = relativePath === '.' ? '' : relativePath + '/';
      for (const key of Object.keys(record.current)) {
        if (key.startsWith(prefix)) {
          delete record.current[key];
        }
      }
    },
    unlink: async (path: string) => {
      const relativePath = pathUtils.relative(WORK_DIR, path);
      delete record.current[relativePath];
    },
    stat: async (path: string) => {
      const relativePath = pathUtils.relative(WORK_DIR, path);
      const entry = record.current[relativePath];

      if (!entry && relativePath !== '.') {
        const err = new Error(`ENOENT: no such file or directory, stat '${path}'`) as NodeJS.ErrnoException;
        err.code = 'ENOENT';
        err.errno = -2;
        err.syscall = 'stat';
        err.path = path;
        throw err;
      }

      const isDir = relativePath === '.';

      return {
        isFile: () => !isDir,
        isDirectory: () => isDir,
        isSymbolicLink: () => false,
        size: isDir ? 4096 : (entry?.data?.length || 0),
        mode: isDir ? 0o040755 : 0o100644,
        mtimeMs: Date.now(),
        ctimeMs: Date.now(),
        birthtimeMs: Date.now(),
        atimeMs: Date.now(),
        uid: 1000,
        gid: 1000,
        dev: 1,
        ino: 1,
        nlink: 1,
        rdev: 0,
        blksize: 4096,
        blocks: 8,
        mtime: new Date(),
        ctime: new Date(),
        birthtime: new Date(),
        atime: new Date(),
      };
    },
    lstat: async (path: string) => {
      return getFs(record).promises.stat(path);
    },
    readlink: async (path: string) => {
      throw new Error(`EINVAL: invalid argument, readlink '${path}'`);
    },
    symlink: async () => {
      throw new Error(`EPERM: operation not permitted, symlink`);
    },
    chmod: async () => {},
  },
});

const pathUtils = {
  dirname: (path: string) => {
    // Handle empty or just filename cases
    if (!path || !path.includes('/')) {
      return '.';
    }

    // Remove trailing slashes
    path = path.replace(/\/+$/, '');

    // Get directory part
    return path.split('/').slice(0, -1).join('/') || '/';
  },

  basename: (path: string, ext?: string) => {
    // Remove trailing slashes
    path = path.replace(/\/+$/, '');

    // Get the last part of the path
    const base = path.split('/').pop() || '';

    // If extension is provided, remove it from the result
    if (ext && base.endsWith(ext)) {
      return base.slice(0, -ext.length);
    }

    return base;
  },
  relative: (from: string, to: string): string => {
    // Handle empty inputs
    if (!from || !to) {
      return '.';
    }

    // Normalize paths by removing trailing slashes and splitting
    const normalizePathParts = (p: string) => p.replace(/\/+$/, '').split('/').filter(Boolean);

    const fromParts = normalizePathParts(from);
    const toParts = normalizePathParts(to);

    // Find common parts at the start of both paths
    let commonLength = 0;
    const minLength = Math.min(fromParts.length, toParts.length);

    for (let i = 0; i < minLength; i++) {
      if (fromParts[i] !== toParts[i]) {
        break;
      }

      commonLength++;
    }

    // Calculate the number of "../" needed
    const upCount = fromParts.length - commonLength;

    // Get the remaining path parts we need to append
    const remainingPath = toParts.slice(commonLength);

    // Construct the relative path
    const relativeParts = [...Array(upCount).fill('..'), ...remainingPath];

    // Handle empty result case
    return relativeParts.length === 0 ? '.' : relativeParts.join('/');
  },
};
