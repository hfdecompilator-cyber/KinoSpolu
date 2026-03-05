import type { Plugin } from "../types";
import { LinearProvider } from "./LinearProvider";
import { LinearPanel } from "./components/LinearPanel";
import { LinearSettings } from "./components/LinearSettings";
import { Layers } from "lucide-react";

export const linearPlugin: Plugin = {
  meta: {
    id: "linear",
    name: "Linear",
    description:
      "Manage Linear issues, track progress, and collaborate on tasks without leaving WatchParty.",
    version: "1.0.0",
    icon: Layers,
  },
  navItems: [
    {
      label: "Issues",
      icon: Layers,
      panel: LinearPanel,
    },
  ],
  settings: {
    component: LinearSettings,
  },
  provider: LinearProvider,
};
