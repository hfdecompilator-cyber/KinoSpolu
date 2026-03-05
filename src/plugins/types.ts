import { ComponentType, ReactNode } from "react";

export interface PluginMeta {
  id: string;
  name: string;
  description: string;
  version: string;
  icon?: ComponentType<{ className?: string }>;
}

export interface PluginNavItem {
  label: string;
  icon: ComponentType<{ className?: string }>;
  panel: ComponentType;
}

export interface PluginSettingsPanel {
  component: ComponentType;
}

export interface Plugin {
  meta: PluginMeta;
  navItems?: PluginNavItem[];
  settings?: PluginSettingsPanel;
  provider?: ComponentType<{ children: ReactNode }>;
}

export interface PluginRegistry {
  plugins: Plugin[];
  getPlugin(id: string): Plugin | undefined;
}
