import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Plugin } from "./types";
import { registry } from "./registry";

interface PluginContextValue {
  plugins: Plugin[];
  enabledPlugins: Set<string>;
  enablePlugin: (id: string) => void;
  disablePlugin: (id: string) => void;
  isEnabled: (id: string) => boolean;
}

const PluginContext = createContext<PluginContextValue | null>(null);

function getStoredEnabled(): Set<string> {
  try {
    const stored = localStorage.getItem("watchparty_enabled_plugins");
    if (stored) return new Set(JSON.parse(stored));
  } catch {
    // ignore corrupt localStorage
  }
  return new Set(registry.plugins.map((p) => p.meta.id));
}

function persistEnabled(ids: Set<string>) {
  localStorage.setItem(
    "watchparty_enabled_plugins",
    JSON.stringify([...ids])
  );
}

export function PluginProvider({ children }: { children: ReactNode }) {
  const [enabledPlugins, setEnabledPlugins] = useState<Set<string>>(
    getStoredEnabled
  );

  const enablePlugin = useCallback((id: string) => {
    setEnabledPlugins((prev) => {
      const next = new Set(prev);
      next.add(id);
      persistEnabled(next);
      return next;
    });
  }, []);

  const disablePlugin = useCallback((id: string) => {
    setEnabledPlugins((prev) => {
      const next = new Set(prev);
      next.delete(id);
      persistEnabled(next);
      return next;
    });
  }, []);

  const isEnabled = useCallback(
    (id: string) => enabledPlugins.has(id),
    [enabledPlugins]
  );

  const ctx = useMemo<PluginContextValue>(
    () => ({
      plugins: registry.plugins,
      enabledPlugins,
      enablePlugin,
      disablePlugin,
      isEnabled,
    }),
    [enabledPlugins, enablePlugin, disablePlugin, isEnabled]
  );

  const activePlugins = registry.plugins.filter((p) =>
    enabledPlugins.has(p.meta.id)
  );

  let wrapped = <>{children}</>;
  for (const plugin of activePlugins) {
    if (plugin.provider) {
      const Provider = plugin.provider;
      wrapped = <Provider>{wrapped}</Provider>;
    }
  }

  return (
    <PluginContext.Provider value={ctx}>{wrapped}</PluginContext.Provider>
  );
}

export function usePlugins() {
  const ctx = useContext(PluginContext);
  if (!ctx) throw new Error("usePlugins must be used within PluginProvider");
  return ctx;
}
