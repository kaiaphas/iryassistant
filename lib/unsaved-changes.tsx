"use client";

import Link, { type LinkProps } from "next/link";
import * as React from "react";

const unsavedMessage = "저장하지 않은 데이터가 있습니다. 이동하면 변경사항이 사라질 수 있습니다.";

type UnsavedChangesContextValue = {
  hasUnsavedChanges: boolean;
  setUnsavedChanges: (key: string, dirty: boolean) => void;
  clearUnsavedChanges: (key?: string) => void;
  confirmNavigation: () => boolean;
};

const UnsavedChangesContext = React.createContext<UnsavedChangesContextValue | null>(null);

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const [dirtyKeys, setDirtyKeys] = React.useState<Set<string>>(() => new Set());
  const hasUnsavedChanges = dirtyKeys.size > 0;

  const setUnsavedChanges = React.useCallback((key: string, dirty: boolean) => {
    setDirtyKeys((current) => {
      const next = new Set(current);
      if (dirty) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const clearUnsavedChanges = React.useCallback((key?: string) => {
    setDirtyKeys((current) => {
      if (!key) return new Set();
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }, []);

  const confirmNavigation = React.useCallback(() => {
    if (!dirtyKeys.size) return true;
    return window.confirm(unsavedMessage);
  }, [dirtyKeys]);

  React.useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  return (
    <UnsavedChangesContext.Provider value={{ hasUnsavedChanges, setUnsavedChanges, clearUnsavedChanges, confirmNavigation }}>
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const context = React.useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error("useUnsavedChanges must be used inside UnsavedChangesProvider");
  }
  return context;
}

export function useUnsavedForm<T>(key: string, open: boolean, initialValue: T, currentValue: T) {
  const { setUnsavedChanges, clearUnsavedChanges, confirmNavigation } = useUnsavedChanges();
  const dirty = open && JSON.stringify(initialValue) !== JSON.stringify(currentValue);

  React.useEffect(() => {
    setUnsavedChanges(key, dirty);
  }, [dirty, key, setUnsavedChanges]);

  React.useEffect(() => () => clearUnsavedChanges(key), [clearUnsavedChanges, key]);

  const confirmClose = React.useCallback(() => {
    if (!dirty) return true;
    if (!confirmNavigation()) return false;
    clearUnsavedChanges(key);
    return true;
  }, [clearUnsavedChanges, confirmNavigation, dirty, key]);

  const clear = React.useCallback(() => clearUnsavedChanges(key), [clearUnsavedChanges, key]);

  return { dirty, confirmClose, clear };
}

type GuardedLinkProps = LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement>;

export function GuardedLink({ onClick, ...props }: GuardedLinkProps) {
  const { confirmNavigation, clearUnsavedChanges } = useUnsavedChanges();

  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (confirmNavigation()) {
          clearUnsavedChanges();
          return;
        }
        event.preventDefault();
      }}
    />
  );
}
