interface TabBarProps {
  active: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'files', label: 'Files', icon: '📁' },
  { id: 'terminal', label: 'Terminal', icon: '⌨️' },
  { id: 'deploy', label: 'Deploy', icon: '🚀' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export function TabBar({ active, onTabChange }: TabBarProps) {
  return (
    <div className="safe-bottom flex items-center justify-around bg-[var(--bolt-bg-2)] border-t border-[var(--bolt-border)] px-1 py-1 shrink-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
            active === tab.id
              ? 'text-[var(--bolt-accent)] bg-[var(--bolt-bg-3)]'
              : 'text-[var(--bolt-text-muted)]'
          }`}
        >
          <span className="text-xl">{tab.icon}</span>
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
