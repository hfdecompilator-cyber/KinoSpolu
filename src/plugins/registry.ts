import type { Plugin } from "./types";
import { linearPlugin } from "./linear";

const pluginRegistry: Plugin[] = [linearPlugin];

export function getPlugins(): Plugin[] {
  return pluginRegistry;
}

export function getPlugin(id: string): Plugin | undefined {
  return pluginRegistry.find((p) => p.id === id);
}
