import type { Plugin } from "../types";
import { LinearPlugin } from "./LinearPlugin";
import { LinearSettingsModal } from "./LinearSettingsModal";
import { getStoredApiKey } from "./useLinear";

export const linearPlugin: Plugin = {
  id: "linear",
  name: "Linear",
  description: "View and create Linear issues directly from your watch party.",
  icon: "linear",
  version: "1.0.0",
  component: LinearPlugin,
  settingsComponent: LinearSettingsModal,
  isConfigured: () => Boolean(getStoredApiKey()),
};
