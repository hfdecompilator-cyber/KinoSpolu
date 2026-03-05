import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLinear } from "../hooks/useLinear";
import { KeyRound, LogOut, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function LinearSettings() {
  const { store, dispatch } = useLinear();
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  const connected = !!store.viewer;

  async function handleConnect() {
    if (!apiKey.trim()) return;
    setSaving(true);
    dispatch({ type: "SET_CONFIG", payload: { apiKey: apiKey.trim() } });
    localStorage.setItem("linear_api_key", apiKey.trim());
    setSaving(false);
    setApiKey("");
  }

  function handleDisconnect() {
    dispatch({ type: "RESET" });
    localStorage.removeItem("linear_api_key");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Linear Integration
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your Linear workspace to manage issues directly from
          WatchParty.
        </p>
      </div>

      {store.error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {store.error}
        </div>
      )}

      {connected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-green-500/10 border border-green-500/20 p-4">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Connected as {store.viewer!.displayName}
              </p>
              <p className="text-xs text-muted-foreground">
                {store.viewer!.email}
              </p>
            </div>
          </div>

          {store.teams.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Available teams
              </p>
              <div className="flex flex-wrap gap-2">
                {store.teams.map((team) => (
                  <span
                    key={team.id}
                    className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {team.key} — {team.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={handleDisconnect}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">
              API Key
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Create a personal API key at{" "}
              <a
                href="https://linear.app/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                linear.app/settings/api
              </a>
            </p>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="lin_api_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              />
              <Button onClick={handleConnect} disabled={!apiKey.trim() || saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4 mr-2" />
                )}
                Connect
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
