import { useState } from 'react';
import { deployVercel, deployNetlify, getApiBase } from '../lib/api';
import { useFilesStore } from '../lib/stores';
import { cn } from '../lib/utils';
import {
  Rocket,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Triangle,
  Hexagon,
  Info,
  Lock,
} from 'lucide-react';

interface DeployResult {
  url?: string;
  error?: string;
}

export function DeployScreen() {
  const [provider, setProvider] = useState<'vercel' | 'netlify'>('vercel');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<DeployResult | null>(null);
  const { files, sandboxId } = useFilesStore();

  const handleDeploy = async () => {
    if (!token.trim()) return;

    setStatus('deploying');
    setResult(null);

    try {
      // Build files map from the sandbox file tree
      const filesMap: Record<string, string> = {};

      if (sandboxId && files.length > 0) {
        // Include all files from the sandbox
        for (const file of files) {
          if (file.type === 'file') {
            try {
              const res = await fetch(
                `${getApiBase()}/sandbox/${sandboxId}/files/read`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ filePath: file.path }),
                }
              );
              const data = await res.json() as { content?: string };
              if (data.content) {
                filesMap[file.path] = data.content;
              }
            } catch {
              // Skip files that can't be read
            }
          }
        }
      }

      if (Object.keys(filesMap).length === 0) {
        setStatus('error');
        setResult({ error: 'No files to deploy. Open the Files tab and ensure files are loaded.' });
        return;
      }

      const deployFn = provider === 'vercel' ? deployVercel : deployNetlify;
      const data = await deployFn({
        token: token.trim(),
        files: filesMap,
      });

      if (data.error) {
        setStatus('error');
        setResult({ error: data.error });
      } else {
        setStatus('success');
        setResult(data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Deployment failed';
      setStatus('error');
      setResult({ error: message });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="safe-top flex items-center gap-2 px-4 py-3 bg-surface/80 border-b border-border backdrop-blur-xl shrink-0">
        <Rocket className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Deploy</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Provider selector */}
        <div className="flex gap-2">
          <button
            onClick={() => { setProvider('vercel'); setStatus('idle'); setResult(null); }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all min-h-0',
              provider === 'vercel'
                ? 'bg-foreground text-background shadow-lg'
                : 'bg-surface text-muted-foreground border border-border active:bg-accent'
            )}
          >
            <Triangle className="w-4 h-4" />
            Vercel
          </button>
          <button
            onClick={() => { setProvider('netlify'); setStatus('idle'); setResult(null); }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all min-h-0',
              provider === 'netlify'
                ? 'bg-foreground text-background shadow-lg'
                : 'bg-surface text-muted-foreground border border-border active:bg-accent'
            )}
          >
            <Hexagon className="w-4 h-4" />
            Netlify
          </button>
        </div>

        {/* Token input */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            {provider === 'vercel' ? 'Vercel' : 'Netlify'} API Token
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={`Paste your ${provider === 'vercel' ? 'Vercel' : 'Netlify'} token...`}
            className="w-full bg-surface border border-border text-foreground text-sm rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-ring transition-all placeholder:text-muted-foreground"
          />
        </div>

        {/* Deploy button */}
        <button
          onClick={handleDeploy}
          disabled={!token.trim() || status === 'deploying'}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all min-h-0',
            token.trim() && status !== 'deploying'
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 active:scale-[0.98]'
              : 'bg-secondary text-muted-foreground cursor-not-allowed'
          )}
        >
          {status === 'deploying' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Rocket className="w-4 h-4" />
          )}
          {status === 'deploying' ? 'Deploying...' : 'Deploy Now'}
        </button>

        {/* File count info */}
        <div className="bg-surface border border-border rounded-xl p-3 text-xs text-muted-foreground">
          {sandboxId
            ? `${files.filter(f => f.type === 'file').length} file(s) ready from sandbox`
            : 'No sandbox connected — open Files tab first'}
        </div>

        {/* Result */}
        {status === 'success' && result && (
          <div className="bg-success/10 border border-success/20 rounded-xl p-4 space-y-2 animate-fade-in-up">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
              <p className="text-success font-medium text-sm">Deployed successfully!</p>
            </div>
            {result.url && (
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary text-sm break-all hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                {result.url}
              </a>
            )}
          </div>
        )}

        {status === 'error' && result && (
          <div className="bg-error/10 border border-error/20 rounded-xl p-4 space-y-1 animate-fade-in-up">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-error shrink-0" />
              <p className="text-error font-medium text-sm">Deployment failed</p>
            </div>
            <p className="text-error/70 text-xs">{result.error}</p>
          </div>
        )}

        {/* Info */}
        <section className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <p className="font-medium text-sm text-foreground">How it works</p>
          </div>
          <div className="space-y-2">
            {[
              'Get your API token from the provider\'s dashboard',
              'Paste it above and tap Deploy',
              'Your project will be deployed and you\'ll get a live URL',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
