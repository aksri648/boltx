import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { sandboxApi } from '~/lib/api/sandbox';
import { path } from '~/utils/path';
import { useState } from 'react';
import type { ActionCallbackData } from '~/lib/runtime/message-parser';
import { chatId } from '~/lib/persistence/useChatHistory';
import { getLocalStorage } from '~/lib/persistence/localStorage';
import { formatBuildFailureOutput } from './deployUtils';

export function useGitHubDeploy() {
  const [isDeploying, setIsDeploying] = useState(false);
  const currentChatId = useStore(chatId);

  const handleGitHubDeploy = async () => {
    const connection = getLocalStorage('github_connection');

    if (!connection?.token || !connection?.user) {
      toast.error('Please connect your GitHub account in Settings > Connections first');
      return false;
    }

    if (!currentChatId) {
      toast.error('No active chat found');
      return false;
    }

    try {
      setIsDeploying(true);

      const artifact = workbenchStore.firstArtifact;

      if (!artifact) {
        throw new Error('No active project found');
      }

      // Create a deployment artifact for visual feedback
      const deploymentId = `deploy-github-project`;
      workbenchStore.addArtifact({
        id: deploymentId,
        messageId: deploymentId,
        title: 'GitHub Deployment',
        type: 'standalone',
      });

      const deployArtifact = workbenchStore.artifacts.get()[deploymentId];

      // Notify that build is starting
      deployArtifact.runner.handleDeployAction('building', 'running', { source: 'github' });

      const actionId = 'build-' + Date.now();
      const actionData: ActionCallbackData = {
        messageId: 'github build',
        artifactId: artifact.id,
        actionId,
        action: {
          type: 'build' as const,
          content: 'npm run build',
        },
      };

      // Add the action first
      artifact.runner.addAction(actionData);

      // Then run it
      await artifact.runner.runAction(actionData);

      const buildOutput = artifact.runner.buildOutput;

      if (!buildOutput || buildOutput.exitCode !== 0) {
        // Notify that build failed
        deployArtifact.runner.handleDeployAction('building', 'failed', {
          error: formatBuildFailureOutput(buildOutput?.output),
          source: 'github',
        });
        throw new Error('Build failed');
      }

      // Notify that build succeeded and deployment preparation is starting
      deployArtifact.runner.handleDeployAction('deploying', 'running', {
        source: 'github',
      });

      // Get all project files instead of just the build directory since we're deploying to a repository
      async function getAllFiles(dirPath: string, basePath: string = ''): Promise<Record<string, string>> {
        const files: Record<string, string> = {};
        const names = await sandboxApi.readDir(dirPath);

        for (const name of names) {
          const fullPath = path.join(dirPath, name);
          const relativePath = basePath ? `${basePath}/${name}` : name;

          const { exitCode: isDir } = await sandboxApi.exec(`test -d ${fullPath}`);

          // Skip node_modules, .git directories and other common excludes
          if (
            isDir === 0 &&
            (name === 'node_modules' || name === '.git' || name === 'dist' || name === 'build' || name === '.cache' || name === '.next')
          ) {
            continue;
          }

          if (isDir === 0) {
            const subFiles = await getAllFiles(fullPath, relativePath);
            Object.assign(files, subFiles);
          } else {
            // Skip binary files, large files and other common excludes
            if (name.endsWith('.DS_Store') || name.endsWith('.log') || name.startsWith('.env')) {
              continue;
            }

            try {
              const content = await sandboxApi.readFile(fullPath);
              files[relativePath] = content;
            } catch (error) {
              console.warn(`Could not read file ${fullPath}:`, error);
              continue;
            }
          }
        }

        return files;
      }

      const fileContents = await getAllFiles('/');

      /*
       * Show GitHub deployment dialog here - it will handle the actual deployment
       * and will receive these files to deploy
       */

      /*
       * For now, we'll just complete the deployment with a success message
       * Notify that deployment preparation is complete
       */
      deployArtifact.runner.handleDeployAction('deploying', 'complete', {
        source: 'github',
      });

      // Show success toast notification
      toast.success(`🚀 GitHub deployment preparation completed successfully!`);

      return {
        success: true,
        files: fileContents,
        projectName: artifact.title || 'bolt-project',
      };
    } catch (err) {
      console.error('GitHub deploy error:', err);
      toast.error(err instanceof Error ? err.message : 'GitHub deployment preparation failed');

      return false;
    } finally {
      setIsDeploying(false);
    }
  };

  return {
    isDeploying,
    handleGitHubDeploy,
    isConnected: !!getLocalStorage('github_connection')?.user,
  };
}
