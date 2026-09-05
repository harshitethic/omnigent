// ⌘⌥[ / ⌘⌥] (Ctrl+Alt+[ / Ctrl+Alt+] on Win/Linux) toggle the left
// (Conversations) and right (Workspace) sidebars. ⌘B / Ctrl+B is also a
// mnemonic alias for the right Workspace sidebar. Siblings to the session-switch
// (⌘[ / ⌘]) and approve (⌘↵) hotkeys; like them they fire even inside a focused
// text field, so a panel can be collapsed mid-compose. Platform-aware: only the
// ⌘ chord fires on macOS and only the Ctrl chord on Win/Linux.

import { useEffect, useRef } from "react";

import { hasCommandModifier, isMacPlatform } from "@/lib/hotkeys";

export interface SidebarToggleHandlers {
  /** Flip the left (Conversations) sidebar. Bound to ⌘/Ctrl + ⌥/Alt + [. */
  onToggleLeft: () => void;
  /** Flip the right (Workspace) sidebar. Bound to ⌘/Ctrl+B and ⌘/Ctrl+⌥/Alt+]. */
  onToggleRight: () => void;
}

export function useSidebarToggleHotkeys(
  handlers: SidebarToggleHandlers,
  isMac = isMacPlatform(),
): void {
  const latest = useRef(handlers);
  latest.current = handlers;

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent): void => {
      if (!hasCommandModifier(e, isMac) || e.shiftKey) return;
      if (typeof e.getModifierState === "function" && e.getModifierState("AltGraph")) return;
      if (e.repeat) return;

      // Mnemonic Workspace alias. Keep Alt variants free so existing/editor
      // chords such as Cmd/Ctrl+Alt+B remain available.
      if (!e.altKey && e.code === "KeyB") {
        e.preventDefault();
        e.stopPropagation();
        latest.current.onToggleRight();
        return;
      }

      // Existing physical-bracket shortcuts require Alt. Matching e.code rather
      // than e.key keeps them stable across keyboard layouts.
      if (!e.altKey) return;
      if (e.code === "BracketLeft") {
        e.preventDefault();
        e.stopPropagation();
        latest.current.onToggleLeft();
      } else if (e.code === "BracketRight") {
        e.preventDefault();
        e.stopPropagation();
        latest.current.onToggleRight();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isMac]);
}
