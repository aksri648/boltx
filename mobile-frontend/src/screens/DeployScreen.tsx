import { useState } from 'react';
import { deployVercel, deployNetlify } from '../lib/api';

export function DeployScreen() {
  const [provider, setProvider] = useState<'vercel' | 'netlify'>('vercel');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);

  const handleDeploy = async () => {
    if (!token.trim()) return;

    setStatus('deploying');
    setResult(null);

    try {
      const deployFn = provider === 'vercel' ? deployVercel : deployNetlify;
      const data = await deployFn({
        token: token.trim(),
        files: {},
      });

      if (data?.url) {
        setStatus('success');
        setResult(data);
      } else if (data?.error) {
        setStatus('error');
        setResult({ error: data.error });
      } else {
        setStatus('success');
        setResult(data);
      }
    } catch (err: any) {
      setStatus('error');
      setResult({ error: err.message || 'Deployment failed' });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="safe-top flex items-center justify-between px-4 py-3 bg-[var(--bolt-bg-2)] border-b border-[var(--bolt-border)] shrink-0">
        <h2 className="text-lg font-semibold">Deploy</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Provider selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setProvider('vercel')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
              provider === 'vercel'
                ? 'bg-[var(--bolt-accent)] text-white'
                : 'bg-[var(--bolt-bg-2)] text-[var(--bolt-text-muted)] border border-[var(--bolt-border)]'
            }`}
          >
            ▲ Vercel
          </button>
          <button
            onClick={() => setProvider('netlify')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
              provider === 'netlify'
                ? 'bg-[var(--bolt-accent)] text-white'
                : 'bg-[var(--bolt-bg-2)] text-[var(--bolt-text-muted)] border border-[var(--bolt-border)]'
            }`}
          >
            ◆ Netlify
          </button>
        </div>

        {/* Token input */}
        <div>
          <label className="text-xs text-[var(--bolt-text-muted)] mb-2 block">
            {provider === 'vercel' ? 'Vercel' : 'Netlify'} API Token
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={`Paste your ${provider === 'vercel' ? 'Vercel' : 'Netlify'} token...`}
            className="w-full bg-[var(--bolt-bg-2)] text-[var(--bolt-text)] text-sm rounded-xl px-4 py-3 border border-[var(--bolt-border)] focus:border-[var(--bolt-accent)] outline-none transition-colors"
          />
        </div>

        {/* Deploy button */}
        <button
          onClick={handleDeploy}
          disabled={!token.trim() || status === 'deploying'}
          className="w-full py-3 bg-[var(--bolt-accent)] text-white rounded-xl font-medium disabled:opacity-40 transition-opacity"
        >
          {status === 'deploying' ? '⏳ Deploying...' : '🚀 Deploy Now'}
        </button>

        {/* Result */}
        {status === 'success' && result && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 space-y-2">
            <p className="text-green-400 font-medium text-sm">✅ Deployed successfully!</p>
            {result.url && (
              <a href={result.url} target="_blank" rel="noopener" className="text-[var(--bolt-accent)] text-sm break-all">
                {result.url}
              </a>
            )}
          </div>
        )}

        {status === 'error' && result && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-400 font-medium text-sm">❌ Deployment failed</p>
            <p className="text-red-400/70 text-xs mt-1">{result.error}</p>
          </div>
        )}

        {/* Info */}
        <div className="bg-[var(--bolt-bg-2)] rounded-xl p-4 text-xs text-[var(--bolt-text-muted)] space-y-2">
          <p className="font-medium text-[var(--bolt-text)]">How it works</p>
          <p>1. Get your API token from the provider's dashboard</p>
          <p>2. Paste it above and tap Deploy</p>
          <p>3. Your project will be deployed and you'll get a live URL</p>
        </div>
      </div>
    </div>
  );
}
