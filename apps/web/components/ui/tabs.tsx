'use client';

import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'rounded-[10px] px-4 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-[#1d4e8a] text-[#f8f9fa]'
                : 'border border-[rgba(26,26,46,0.1)] bg-[#f8f9fa] text-[#1a1a2e] hover:border-[rgba(26,26,46,0.2)]',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
