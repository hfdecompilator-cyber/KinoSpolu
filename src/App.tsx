import { useState } from "react";
import { PluginProvider, usePlugins } from "./plugins/PluginProvider";
import "./plugins/setup";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Settings, Tv, X } from "lucide-react";
import type { PluginNavItem } from "./plugins/types";

function AppContent() {
  const { plugins, isEnabled } = usePlugins();
  const [activePanel, setActivePanel] = useState<{
    pluginId: string;
    item: PluginNavItem;
  } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPluginId, setSettingsPluginId] = useState<string | null>(null);

  const enabledPlugins = plugins.filter((p) => isEnabled(p.meta.id));

  function openSettings(pluginId: string) {
    setSettingsPluginId(pluginId);
    setSettingsOpen(true);
  }

  const SettingsComponent =
    settingsPluginId != null
      ? enabledPlugins.find((p) => p.meta.id === settingsPluginId)?.settings
          ?.component
      : null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-screen flex bg-background text-foreground">
        {/* Sidebar nav rail */}
        <div className="w-12 shrink-0 border-r border-border flex flex-col items-center py-3 gap-1 bg-secondary/30">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="h-8 w-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-colors mb-2">
                <Tv className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">WatchParty</TooltipContent>
          </Tooltip>

          <Separator className="w-6 mb-1" />

          {enabledPlugins.flatMap((plugin) =>
            (plugin.navItems ?? []).map((item, idx) => {
              const Icon = item.icon;
              const isActive =
                activePanel?.pluginId === plugin.meta.id &&
                activePanel?.item === item;
              return (
                <Tooltip key={`${plugin.meta.id}-${idx}`}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() =>
                        setActivePanel(
                          isActive
                            ? null
                            : { pluginId: plugin.meta.id, item }
                        )
                      }
                      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                        isActive
                          ? "bg-primary/20 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })
          )}

          <div className="mt-auto">
            {enabledPlugins
              .filter((p) => p.settings)
              .map((plugin) => {
                const Icon = plugin.meta.icon ?? Settings;
                return (
                  <Tooltip key={`settings-${plugin.meta.id}`}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => openSettings(plugin.meta.id)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {plugin.meta.name} Settings
                    </TooltipContent>
                  </Tooltip>
                );
              })}
          </div>
        </div>

        {/* Plugin side panel */}
        {activePanel && (
          <div className="w-80 shrink-0 border-r border-border bg-card overflow-hidden">
            <activePanel.item.panel />
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border flex items-center px-6 bg-secondary/20">
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              WatchParty
            </h1>
            <span className="ml-3 text-xs text-muted-foreground">
              Watch Together, Stay Connected
            </span>
          </header>

          <main className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Tv className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Welcome to WatchParty
              </h2>
              <p className="text-muted-foreground mb-6">
                Create or join a watch party to stream content together with
                friends. Use the sidebar to access plugins like Linear for
                project management.
              </p>
              <div className="flex gap-3 justify-center">
                <Button size="lg">Create Party</Button>
                <Button size="lg" variant="outline">
                  Join Party
                </Button>
              </div>
            </div>
          </main>
        </div>

        {/* Settings sheet */}
        <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
          <SheetContent className="bg-background border-border sm:max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Plugin Settings</h2>
            </div>
            {SettingsComponent && <SettingsComponent />}
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}

export default function App() {
  return (
    <PluginProvider>
      <AppContent />
    </PluginProvider>
  );
}
