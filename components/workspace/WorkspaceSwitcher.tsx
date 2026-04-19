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
        backgroundColor: isEducation
          ? 'var(--ch-ws-edu-bg, rgba(5,150,105,0.08))'
          : 'var(--ch-ws-admin-bg, rgba(224,82,82,0.08))',
        border: `1px solid ${isEducation
          ? 'var(--ch-ws-edu-border, rgba(5,150,105,0.2))'
          : 'var(--ch-ws-admin-border, rgba(224,82,82,0.2))'
        }`,
      }}
      title="Switch workspace (Ctrl+Shift+Arrow)"
    >
      {/* Sliding pill indicator */}
      <div
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 ease-in-out"
        style={{
          left: isEducation ? '4px' : 'calc(50%)',
          backgroundColor: isEducation
            ? 'var(--ch-ws-edu-pill, rgba(5,150,105,0.15))'
            : 'var(--ch-ws-admin-pill, rgba(224,82,82,0.15))',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      />

      {/* Education side */}
      <div
        className="relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all duration-300"
      >
        <BookOpen
          className="w-3.5 h-3.5 transition-colors duration-300"
          style={{
            color: isEducation
              ? 'var(--ch-ws-edu-active, #059669)'
              : 'var(--ch-muted)',
          }}
        />
        <span
          className="text-[11px] font-bold transition-colors duration-300"
          style={{
            color: isEducation
              ? 'var(--ch-ws-edu-active, #059669)'
              : 'var(--ch-muted)',
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
            color: !isEducation
              ? 'var(--ch-ws-admin-active, #e05252)'
              : 'var(--ch-muted)',
          }}
        />
        <span
          className="text-[11px] font-bold transition-colors duration-300"
          style={{
            color: !isEducation
              ? 'var(--ch-ws-admin-active, #e05252)'
              : 'var(--ch-muted)',
          }}
        >
          Admin
        </span>
      </div>
    </button>
  );
}
