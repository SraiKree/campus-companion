'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Workspace = 'education' | 'admin';

interface WorkspaceContextValue {
  workspace: Workspace;
  setWorkspace: (ws: Workspace) => void;
  toggleWorkspace: () => void;
  dragOffset: number;
  setDragOffset: (offset: number) => void;
  /** True once localStorage has been read and initial state is settled */
  ready: boolean;
  /** Last visited path per workspace */
  lastPaths: Record<Workspace, string>;
  setLastPath: (ws: Workspace, path: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspace: 'education',
  setWorkspace: () => {},
  toggleWorkspace: () => {},
  dragOffset: 0,
  setDragOffset: () => {},
  ready: false,
  lastPaths: { education: '', admin: '' },
  setLastPath: () => {},
});

const STORAGE_KEY = 'campus-workspace';
const PATH_KEY_PREFIX = 'campus-ws-lastpath-';

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspaceState] = useState<Workspace>('education');
  const [dragOffset, setDragOffset] = useState(0);
  const [ready, setReady] = useState(false);
  const [lastPaths, setLastPathsState] = useState<Record<Workspace, string>>({
    education: '',
    admin: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'education' || stored === 'admin') {
      setWorkspaceState(stored);
    }
    setLastPathsState({
      education: localStorage.getItem(PATH_KEY_PREFIX + 'education') || '',
      admin: localStorage.getItem(PATH_KEY_PREFIX + 'admin') || '',
    });
    setReady(true);
  }, []);

  const setWorkspace = useCallback((ws: Workspace) => {
    setWorkspaceState(ws);
    localStorage.setItem(STORAGE_KEY, ws);
  }, []);

  const toggleWorkspace = useCallback(() => {
    setWorkspaceState(prev => {
      const next = prev === 'education' ? 'admin' : 'education';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const setLastPath = useCallback((ws: Workspace, path: string) => {
    setLastPathsState(prev => ({ ...prev, [ws]: path }));
    localStorage.setItem(PATH_KEY_PREFIX + ws, path);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        workspace, setWorkspace, toggleWorkspace,
        dragOffset, setDragOffset,
        ready, lastPaths, setLastPath,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => useContext(WorkspaceContext);
