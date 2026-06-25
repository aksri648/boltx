import React, { useState, useEffect } from 'react';
import { ChatScreen } from './screens/ChatScreen';
import { FilesScreen } from './screens/FilesScreen';
import { TerminalScreen } from './screens/TerminalScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DeployScreen } from './screens/DeployScreen';
import { TabBar } from './components/TabBar';
import { initCapacitor } from './lib/capacitor';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-background p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center mb-4">
            <span className="text-2xl">💥</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium active:scale-95 transition-all"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}



export default function App() {
  const [activeTab, setActiveTab] = useState<string>('chat');

  useEffect(() => {
    initCapacitor();
  }, []);

  return (
    <ErrorBoundary>
      <div className="dark flex flex-col h-full bg-background text-foreground">
        {/* Screen content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && <ChatScreen />}
          {activeTab === 'files' && <FilesScreen />}
          {activeTab === 'terminal' && <TerminalScreen />}
          {activeTab === 'deploy' && <DeployScreen />}
          {activeTab === 'settings' && <SettingsScreen />}
        </div>

        {/* Bottom tab bar */}
        <TabBar active={activeTab} onTabChange={setActiveTab} />
      </div>
    </ErrorBoundary>
  );
}
