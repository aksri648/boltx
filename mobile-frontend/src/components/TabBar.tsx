import {
  MessageSquare,
  FolderOpen,
  Terminal,
  Rocket,
  Settings,
} from 'lucide-react';
import { cn } from '~/lib/utils';

interface TabBarProps {
  active: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'chat', label: 'Chat', Icon: MessageSquare },
  { id: 'files', label: 'Files', Icon: FolderOpen },
  { id: 'terminal', label: 'Terminal', Icon: Terminal },
  { id: 'deploy', label: 'Deploy', Icon: Rocket },
  { id: 'settings', label: 'Settings', Icon: Settings },
];

export function TabBar({ active, onTabChange }: TabBarProps) {
  return (
    <div className="safe-bottom flex items-center justify-around bg-surface border-t border-border px-1 py-1 shrink-0 backdrop-blur-xl bg-opacity-95">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 relative',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground active:text-foreground'
            )}
          >
            {isActive && (
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
            )}
            <tab.Icon
              className={cn(
                'w-5 h-5 transition-all duration-200',
                isActive && 'drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]'
              )}
              strokeWidth={isActive ? 2.2 : 1.5}
            />
            <span className={cn(
              'text-[10px] font-medium transition-all duration-200',
              isActive && 'font-semibold'
            )}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
