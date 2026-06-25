import { useState, useEffect } from 'react';
import { useSettingsStore } from '../lib/stores';
import { fetchConfiguredProviders, fetchModels } from '../lib/api';
import { setBackendUrl } from '../lib/api';

export function SettingsScreen() {
  const { backendUrl, setBackendUrl: saveUrl, provider, setProvider, model, setModel, apiKeys, setApiKey } = useSettingsStore();
  const [urlInput, setUrlInput] = useState(backendUrl);
  const [providers, setProviders] = useState<any[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    fetchConfiguredProviders()
      .then((data) => { if (data?.providers) setProviders(data.providers); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (provider) {
      fetchModels(provider)
        .then((data) => {
          if (Array.isArray(data)) {
            setModels(data.map((m: any) => m.name || m.id || String(m)));
          } else if (data?.models) {
            setModels(data.models.map((m: any) => m.name || m.id || String(m)));
          }
        })
        .catch(() => setModels([]));
    }
  }, [provider]);

  const handleSaveUrl = () => {
    saveUrl(urlInput.trim());
    setBackendUrl(urlInput.trim());
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Try to fetch config as a connection test
      const res = await fetch(urlInput.trim() + '/api/config');
      setTestResult(res.ok ? 'success' : 'error');
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="safe-top flex items-center px-4 py-3 bg-[var(--bolt-bg-2)] border-b border-[var(--bolt-border)] shrink-0">
        <h2 className="text-lg font-semibold">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Backend URL */}
        <section>
          <h3 className="text-sm font-semibold mb-2">Backend URL</h3>
          <div className="flex gap-2">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="http://localhost:3001"
              className="flex-1 bg-[var(--bolt-bg-2)] text-[var(--bolt-text)] text-sm rounded-xl px-4 py-3 border border-[var(--bolt-border)] focus:border-[var(--bolt-accent)] outline-none"
            />
            <button
              onClick={handleSaveUrl}
              className="bg-[var(--bolt-accent)] text-white text-sm px-4 py-3 rounded-xl shrink-0"
            >
              Save
            </button>
          </div>
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="w-full mt-2 py-2 bg-[var(--bolt-bg-2)] text-[var(--bolt-text-muted)] text-xs rounded-lg border border-[var(--bolt-border)]"
          >
            {testing ? 'Testing...' : testResult === 'success' ? '✅ Connected!' : testResult === 'error' ? '❌ Connection failed' : 'Test Connection'}
          </button>
        </section>

        {/* Provider & Model */}
        <section>
          <h3 className="text-sm font-semibold mb-2">AI Provider</h3>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full bg-[var(--bolt-bg-2)] text-[var(--bolt-text)] text-sm rounded-xl px-4 py-3 border border-[var(--bolt-border)]"
          >
            {providers.length > 0 ? (
              providers.map((p: any) => <option key={p.name} value={p.name}>{p.name}</option>)
            ) : (
              <>
                <option value="Anthropic">Anthropic</option>
                <option value="OpenAI">OpenAI</option>
                <option value="Google">Google</option>
                <option value="Groq">Groq</option>
                <option value="Mistral">Mistral</option>
                <option value="OpenRouter">OpenRouter</option>
              </>
            )}
          </select>
          <label className="text-xs text-[var(--bolt-text-muted)] mt-3 mb-1 block">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-[var(--bolt-bg-2)] text-[var(--bolt-text)] text-sm rounded-xl px-4 py-3 border border-[var(--bolt-border)]"
          >
            {models.length > 0 ? (
              models.map((m) => <option key={m} value={m}>{m}</option>)
            ) : (
              <option value="claude-3-5-sonnet-latest">claude-3-5-sonnet-latest</option>
            )}
          </select>
        </section>

        {/* API Keys */}
        <section>
          <h3 className="text-sm font-semibold mb-2">API Keys</h3>
          <div className="space-y-3">
            {(providers.length > 0 ? providers.map((p: any) => p.name) : ['Anthropic', 'OpenAI', 'Google', 'Groq']).map((name) => (
              <div key={name}>
                <label className="text-xs text-[var(--bolt-text-muted)] mb-1 block">{name}</label>
                <input
                  type="password"
                  value={apiKeys[name] || ''}
                  onChange={(e) => setApiKey(name, e.target.value)}
                  placeholder={`API key for ${name}`}
                  className="w-full bg-[var(--bolt-bg-2)] text-[var(--bolt-text)] text-sm rounded-xl px-4 py-2.5 border border-[var(--bolt-border)] focus:border-[var(--bolt-accent)] outline-none"
                />
              </div>
            ))}
          </div>
        </section>

        {/* About */}
        <section className="bg-[var(--bolt-bg-2)] rounded-xl p-4 text-xs text-[var(--bolt-text-muted)] space-y-1">
          <p className="font-medium text-[var(--bolt-text)]">bolt.diy Mobile</p>
          <p>AI-powered code editor for Android</p>
          <p>Backend: {backendUrl}</p>
        </section>
      </div>
    </div>
  );
}
