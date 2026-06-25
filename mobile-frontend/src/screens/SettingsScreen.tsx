import { useState, useEffect } from 'react';
import { useSettingsStore } from '../lib/stores';
import { useProviders } from '../hooks/useProviders';
import { cn } from '../lib/utils';
import {
  Settings,
  Server,
  Key,
  Brain,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
  Wifi,
  Eye,
  EyeOff,
} from 'lucide-react';

export function SettingsScreen() {
  const {
    backendUrl,
    setBackendUrl,
    provider,
    setProvider,
    model,
    setModel,
    apiKeys,
    setApiKey,
    openAILikeBaseUrl,
    setOpenAILikeBaseUrl,
  } = useSettingsStore();
  const { providers, models } = useProviders(provider);
  const [urlInput, setUrlInput] = useState(backendUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  const handleSaveUrl = () => {
    setBackendUrl(urlInput.trim());
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(urlInput.trim() + '/api/config', { signal: controller.signal });
      clearTimeout(timeoutId);
      setTestResult(res.ok ? 'success' : 'error');
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const toggleKeyVisibility = (name: string) => {
    setVisibleKeys((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const providerNames = providers.map((p) => p.name);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="safe-top flex items-center gap-2 px-4 py-3 bg-surface/80 border-b border-border backdrop-blur-xl shrink-0">
        <Settings className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Backend URL */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Backend URL</h3>
          </div>
          <div className="flex gap-2">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="http://localhost:3001"
              className="flex-1 bg-surface border border-border text-foreground text-sm rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-ring transition-all placeholder:text-muted-foreground"
            />
            <button
              onClick={handleSaveUrl}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm px-4 py-3 rounded-xl shrink-0 font-medium active:scale-95 transition-all min-h-0 min-w-0"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 text-xs rounded-xl border transition-all',
              testResult === 'success'
                ? 'bg-success/10 text-success border-success/20'
                : testResult === 'error'
                  ? 'bg-error/10 text-error border-error/20'
                  : 'bg-surface text-muted-foreground border-border active:bg-accent'
            )}
          >
            {testing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : testResult === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : testResult === 'error' ? (
              <XCircle className="w-3.5 h-3.5" />
            ) : (
              <Wifi className="w-3.5 h-3.5" />
            )}
            {testing ? 'Testing...' : testResult === 'success' ? 'Connected!' : testResult === 'error' ? 'Connection failed' : 'Test Connection'}
          </button>
        </section>

        {/* Provider & Model */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">AI Provider</h3>
          </div>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full bg-surface border border-border text-foreground text-sm rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer"
          >
            {providerNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <label className="text-xs text-muted-foreground block">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-surface border border-border text-foreground text-sm rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer"
          >
            {models.length > 0 ? (
              models.map((m) => <option key={m} value={m}>{m}</option>)
            ) : (
              <option value="claude-3-5-sonnet-latest">claude-3-5-sonnet-latest</option>
            )}
          </select>
          {provider === 'OpenAILike' && (
            <div className="space-y-2 animate-fade-in-up">
              <label className="text-xs text-muted-foreground block">Base URL</label>
              <input
                type="url"
                value={openAILikeBaseUrl}
                onChange={(e) => setOpenAILikeBaseUrl(e.target.value)}
                placeholder="http://localhost:8080/v1"
                className="w-full bg-surface border border-border text-foreground text-sm rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-ring transition-all placeholder:text-muted-foreground"
              />
              <p className="text-[10px] text-muted-foreground">
                The base URL of your OpenAI-compatible API endpoint
              </p>
            </div>
          )}
        </section>

        {/* API Keys */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">API Keys</h3>
          </div>
          <div className="space-y-3">
            {providerNames.map((name) => (
              <div key={name} className="space-y-1.5">
                <label className="text-xs text-muted-foreground block">{name}</label>
                <div className="relative">
                  <input
                    type={visibleKeys[name] ? 'text' : 'password'}
                    value={apiKeys[name] || ''}
                    onChange={(e) => setApiKey(name, e.target.value)}
                    placeholder={`API key for ${name}`}
                    className="w-full bg-surface border border-border text-foreground text-sm rounded-xl px-4 py-2.5 pr-10 outline-none focus:ring-1 focus:ring-ring transition-all placeholder:text-muted-foreground"
                  />
                  <button
                    onClick={() => toggleKeyVisibility(name)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground active:bg-accent transition-colors min-h-0 min-w-0"
                  >
                    {visibleKeys[name] ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* About */}
        <section className="bg-surface border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">About</h3>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">bolt.diy Mobile</p>
            <p className="text-xs text-muted-foreground">AI-powered code editor for Android</p>
            <p className="text-xs text-muted-foreground">Backend: {backendUrl}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
