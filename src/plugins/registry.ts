import type { Plugin, PluginRegistry } from "./types";

const plugins: Plugin[] = [];

export const registry: PluginRegistry = {
  get plugins() {
    return [...plugins];
  },
  getPlugin(id: string) {
    return plugins.find((p) => p.meta.id === id);
  },
};

export function registerPlugin(plugin: Plugin) {
  if (plugins.some((p) => p.meta.id === plugin.meta.id)) {
    console.warn(`Plugin "${plugin.meta.id}" is already registered.`);
    return;
  }
  plugins.push(plugin);
}
