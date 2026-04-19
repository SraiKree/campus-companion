'use client';

import { useState, useEffect, useRef, useCallback, type AnimationEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useWorkspace, type Workspace } from '@/contexts/WorkspaceContext';

interface NavItem {
  href: string;
}

const NAV_ANIM_NAMES = new Set([
  'ws-nav-out-left', 'ws-nav-out-right',
  'ws-nav-in-from-right', 'ws-nav-in-from-left',
]);

/**
 * Manages workspace-switch animations (nav fade-out → swap → fade-in)
 * and remembers the last-visited tab per workspace.
 */
export function useWorkspaceTransition(
  defaultPath: string,
  educationNavItems: NavItem[],
  adminNavItems: NavItem[],
) {
  const { workspace, ready, lastPaths, setLastPath } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();

  const [displayedWorkspace, setDisplayedWorkspace] = useState<Workspace>(workspace);
  const [phase, setPhase] = useState<'idle' | 'out' | 'swap' | 'in'>('idle');
  // 'left' = edu→admin (slide left), 'right' = admin→edu (slide right)
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const prevWorkspaceRef = useRef(workspace);
  const initialized = useRef(false);

  // ── Keep current path recorded for the active workspace ──────────────
  useEffect(() => {
    if (phase === 'idle' && pathname && ready) {
      const currentNav = workspace === 'education' ? educationNavItems : adminNavItems;
      const belongs = currentNav.some(
        n => pathname === n.href || (n.href !== defaultPath && pathname.startsWith(n.href)),
      );
      if (belongs) setLastPath(workspace, pathname);
    }
  }, [pathname, workspace, phase, setLastPath, ready, educationNavItems, adminNavItems, defaultPath]);

  // ── React to workspace changes ───────────────────────────────────────
  useEffect(() => {
    if (!ready) return;

    // First time ready — sync without animation (covers localStorage restore)
    if (!initialized.current) {
      initialized.current = true;
      setDisplayedWorkspace(workspace);
      prevWorkspaceRef.current = workspace;
      return;
    }

    if (workspace !== prevWorkspaceRef.current) {
      const oldWs = prevWorkspaceRef.current;
      prevWorkspaceRef.current = workspace;
      setDirection(oldWs === 'education' ? 'left' : 'right');
      setLastPath(oldWs, pathname || defaultPath);
      setPhase('out');
    }
  }, [ready, workspace, pathname, setLastPath, defaultPath]);

  // ── After swap renders, schedule the enter animation one frame later ──
  useEffect(() => {
    if (phase === 'swap') {
      const id = requestAnimationFrame(() => setPhase('in'));
      return () => cancelAnimationFrame(id);
    }
  }, [phase]);

  // ── Animation-end handler (placed on nav container) ──────────────────
  const handleAnimEnd = useCallback(
    (e: AnimationEvent) => {
      if (!NAV_ANIM_NAMES.has(e.animationName)) return;

      if (phase === 'out') {
        setDisplayedWorkspace(workspace);

        // Navigate to last-visited path in the new workspace
        const storedPath = lastPaths[workspace];
        const navForNewWs = workspace === 'education' ? educationNavItems : adminNavItems;
        const validHrefs = navForNewWs.map(n => n.href);

        let targetPath = defaultPath;
        if (storedPath) {
          const isValid = validHrefs.some(
            h => storedPath === h || (h !== defaultPath && storedPath.startsWith(h)),
          );
          if (isValid) targetPath = storedPath;
        }

        if (targetPath !== pathname) {
          router.push(targetPath);
        }

        setPhase('swap');
      } else if (phase === 'in') {
        setPhase('idle');
      }
    },
    [phase, workspace, lastPaths, defaultPath, educationNavItems, adminNavItems, pathname, router],
  );

  // ── Derived classes ──────────────────────────────────────────────────
  let navAnimClass = '';
  if (phase === 'out') {
    navAnimClass = direction === 'left' ? 'ws-nav-exit-left' : 'ws-nav-exit-right';
  } else if (phase === 'swap') {
    navAnimClass = 'ws-nav-swap';
  } else if (phase === 'in') {
    navAnimClass = direction === 'left' ? 'ws-nav-enter-right' : 'ws-nav-enter-left';
  }

  const contentAnimClass =
    phase === 'out' ? 'ws-content-exit' : (phase === 'swap' || phase === 'in') ? 'ws-content-enter' : '';

  return {
    displayedWorkspace,
    navAnimClass,
    contentAnimClass,
    handleAnimEnd,
  };
}
