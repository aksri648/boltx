import ignore from 'ignore';

export const IGNORE_PATTERNS = [
  'node_modules/**', '.git/**', 'dist/**', 'build/**', '.next/**',
  'coverage/**', '.cache/**', '.vscode/**', '.idea/**',
  '**/*.log', '**/.DS_Store', '**/npm-debug.log*',
  '**/yarn-debug.log*', '**/yarn-error.log*',
];

export const MAX_FILES = 1000;
export const ig = ignore().add(IGNORE_PATTERNS);

export const generateId = () => Math.random().toString(36).substring(2, 15);

export const shouldIncludeFile = (path: string): boolean => {
  return !ig.ignores(path);
};

export const filesToArtifacts = (files: { [path: string]: { content: string } }, id: string): string => {
  return `
<boltArtifact id="${id}" title="User Updated Files">
${Object.keys(files)
    .map(
      (filePath) => `
<boltAction type="file" filePath="${filePath}">
${files[filePath].content}
</boltAction>
`,
    )
    .join('\n')}
</boltArtifact>
  `;
};
