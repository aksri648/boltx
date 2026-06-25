import { useState, useEffect } from 'react';
import { HashRouter } from "react-router-dom";
import { ChatScreen } from './screens/ChatScreen';
import { FilesScreen } from './screens/FilesScreen';
import { TerminalScreen } from './screens/TerminalScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DeployScreen } from './screens/DeployScreen';
import { TabBar } from './components/TabBar';
import { initCapacitor } from './lib/capacitor';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('chat');

  useEffect(() => {
    initCapacitor();
  }, []);

  return (
    <HashRouter>
      <div className="flex flex-col h-full bg-[var(--bolt-bg)]">
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
    </HashRouter>
  );
}
