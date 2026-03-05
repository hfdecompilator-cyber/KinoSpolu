import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLinear } from "../hooks/useLinear";
import { IssueList } from "./IssueList";
import { IssueDetail } from "./IssueDetail";
import { CreateIssueDialog } from "./CreateIssueDialog";
import { LinearSettings } from "./LinearSettings";
import type { LinearIssue } from "../types";
import {
  Plus,
  RefreshCw,
  Loader2,
  Settings,
  ListTodo,
  CheckCircle2,
  CircleDot,
} from "lucide-react";
import * as api from "../api";

export function LinearPanel() {
  const { store, dispatch } = useLinear();
  const [selectedIssue, setSelectedIssue] = useState<LinearIssue | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const connected = !!store.viewer && !!store.config;

  async function handleRefresh() {
    if (!store.config?.apiKey || !store.activeTeamId) return;
    setRefreshing(true);
    try {
      const issues = await api.fetchIssues(
        store.config.apiKey,
        store.activeTeamId
      );
      dispatch({ type: "SET_ISSUES", payload: issues });
    } catch {
      // error surfaced via store.error
    }
    setRefreshing(false);
  }

  function handleTeamChange(teamId: string) {
    dispatch({ type: "SET_ACTIVE_TEAM", payload: teamId });
    setSelectedIssue(null);
  }

  if (!connected) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Linear</h2>
        </div>
        <div className="flex-1 p-4">
          <LinearSettings />
        </div>
      </div>
    );
  }

  if (selectedIssue) {
    const freshIssue =
      store.issues.find((i) => i.id === selectedIssue.id) ?? selectedIssue;
    return (
      <IssueDetail
        issue={freshIssue}
        onBack={() => setSelectedIssue(null)}
      />
    );
  }

  const activeIssues = store.issues.filter(
    (i) => i.state.type === "started"
  );
  const backlogIssues = store.issues.filter(
    (i) => i.state.type === "backlog" || i.state.type === "unstarted"
  );
  const doneIssues = store.issues.filter(
    (i) => i.state.type === "completed" || i.state.type === "cancelled"
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Linear</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {store.teams.length > 1 && (
          <Select
            value={store.activeTeamId ?? ""}
            onValueChange={handleTeamChange}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              {store.teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.key} — {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {store.loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="active" className="flex-1 flex flex-col">
          <TabsList className="mx-3 mt-2 grid grid-cols-3 h-8">
            <TabsTrigger value="active" className="text-xs gap-1">
              <CircleDot className="h-3 w-3" />
              Active
              {activeIssues.length > 0 && (
                <span className="text-[10px] bg-primary/20 text-primary rounded-full px-1.5">
                  {activeIssues.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="backlog" className="text-xs gap-1">
              <ListTodo className="h-3 w-3" />
              Backlog
            </TabsTrigger>
            <TabsTrigger value="done" className="text-xs gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Done
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="flex-1 mt-0">
            <IssueList
              issues={activeIssues}
              onSelect={setSelectedIssue}
              selectedId={selectedIssue?.id}
            />
          </TabsContent>
          <TabsContent value="backlog" className="flex-1 mt-0">
            <IssueList
              issues={backlogIssues}
              onSelect={setSelectedIssue}
              selectedId={selectedIssue?.id}
            />
          </TabsContent>
          <TabsContent value="done" className="flex-1 mt-0">
            <IssueList
              issues={doneIssues}
              onSelect={setSelectedIssue}
              selectedId={selectedIssue?.id}
            />
          </TabsContent>
        </Tabs>
      )}

      <CreateIssueDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
