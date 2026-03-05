import type { ComponentType } from "react";

export interface PluginContext {
  partyName?: string;
  partyId?: string;
  videoTitle?: string;
}

export interface PluginConfig {
  [key: string]: string | boolean | number;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: string;
  version: string;
  component: ComponentType<PluginPanelProps>;
  settingsComponent: ComponentType<PluginSettingsProps>;
  isConfigured: () => boolean;
}

export interface PluginPanelProps {
  context?: PluginContext;
  onClose?: () => void;
}

export interface PluginSettingsProps {
  onSave: (config: PluginConfig) => void;
  onCancel: () => void;
}
