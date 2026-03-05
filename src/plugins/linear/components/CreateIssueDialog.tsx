import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLinear } from "../hooks/useLinear";
import * as api from "../api";
import { PRIORITY_LABELS, type LinearIssuePriority } from "../types";
import { Loader2, Plus } from "lucide-react";

interface CreateIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateIssueDialog({
  open,
  onOpenChange,
}: CreateIssueDialogProps) {
  const { store, dispatch } = useLinear();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("0");
  const [stateId, setStateId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setTitle("");
    setDescription("");
    setPriority("0");
    setStateId("");
    setAssigneeId("");
  }

  async function handleCreate() {
    if (!title.trim() || !store.config?.apiKey || !store.activeTeamId) return;

    setSubmitting(true);
    try {
      const issue = await api.createIssue(store.config.apiKey, {
        title: title.trim(),
        description: description.trim() || undefined,
        teamId: store.activeTeamId,
        priority: Number(priority) as LinearIssuePriority,
        stateId: stateId || undefined,
        assigneeId: assigneeId || undefined,
      });
      dispatch({ type: "ADD_ISSUE", payload: issue });
      resetForm();
      onOpenChange(false);
    } catch {
      // handled by LinearProvider error state
    }
    setSubmitting(false);
  }

  const unstartedStates = store.states.filter(
    (s) => s.type === "backlog" || s.type === "unstarted"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Issue
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium text-foreground">
              Title
            </label>
            <Input
              placeholder="Issue title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Description
            </label>
            <Textarea
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 min-h-[80px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground">
                Priority
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {([0, 1, 2, 3, 4] as const).map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Status
              </label>
              <Select value={stateId} onValueChange={setStateId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {unstartedStates.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: s.color }}
                        />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Assignee
            </label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {store.members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
