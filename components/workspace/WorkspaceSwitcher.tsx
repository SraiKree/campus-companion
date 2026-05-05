'use client';

import { useWorkspace, type Workspace } from '@/contexts/WorkspaceContext';
import { BookOpen, Settings } from 'lucide-react';

const WORKSPACE_META: Record<Workspace, { label: string; shortLabel: string; icon: typeof BookOpen }> = {
  education: { label: 'Learning Mode', shortLabel: 'Learning', icon: BookOpen },
  admin: { label: 'Admin Mode', shortLabel: 'Admin', icon: Settings },
};

export default function WorkspaceSwitcher() {
  const { workspace, toggleWorkspace } = useWorkspace();
  const isEducation = workspace === 'education';

  return (
    <button
      onClick={toggleWorkspace}
      className="group relative w-full flex items-center gap-2 rounded-xl p-1 transition-colors duration-300"
      style={{
        backgroundColor: 'var(--ch-accent-soft)',
        border: '1px solid var(--ch-accent-soft)',
      }}
      title="Switch workspace (Ctrl+Shift+Arrow)"
    >
      {/* Sliding pill indicator — uses the active primary color */}
      <div
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 ease-in-out"
        style={{
          left: isEducation ? '4px' : 'calc(50%)',
          backgroundColor: 'var(--ch-accent)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      />

      {/* Education side */}
      <div
        className="relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all duration-300"
      >
        <BookOpen
          className="w-3.5 h-3.5 transition-colors duration-300"
          style={{
            color: isEducation ? 'var(--ch-on-accent)' : 'var(--ch-muted)',
          }}
        />
        <span
          className="text-[11px] font-bold transition-colors duration-300"
          style={{
            color: isEducation ? 'var(--ch-on-accent)' : 'var(--ch-muted)',
          }}
        >
          Learning
        </span>
      </div>

      {/* Admin side */}
      <div
        className="relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all duration-300"
      >
        <Settings
          className="w-3.5 h-3.5 transition-colors duration-300"
          style={{
            color: !isEducation ? 'var(--ch-on-accent)' : 'var(--ch-muted)',
          }}
        />
        <span
          className="text-[11px] font-bold transition-colors duration-300"
          style={{
            color: !isEducation ? 'var(--ch-on-accent)' : 'var(--ch-muted)',
          }}
        >
          Admin
        </span>
      </div>
    </button>
  );
}
