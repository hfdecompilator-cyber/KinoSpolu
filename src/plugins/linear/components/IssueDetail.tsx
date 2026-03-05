import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  type LinearIssue,
  type LinearComment,
} from "../types";
import { useLinear } from "../hooks/useLinear";
import * as api from "../api";
import {
  ArrowLeft,
  ExternalLink,
  Send,
  Loader2,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface IssueDetailProps {
  issue: LinearIssue;
  onBack: () => void;
}

export function IssueDetail({ issue, onBack }: IssueDetailProps) {
  const { store, dispatch } = useLinear();
  const [comments, setComments] = useState<LinearComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!store.config?.apiKey) return;
    let cancelled = false;
    setLoadingComments(true);

    api
      .fetchIssueComments(store.config.apiKey, issue.id)
      .then((c) => {
        if (!cancelled) setComments(c);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingComments(false);
      });

    return () => {
      cancelled = true;
    };
  }, [store.config?.apiKey, issue.id]);

  async function handleSubmitComment() {
    if (!newComment.trim() || !store.config?.apiKey) return;
    setSubmitting(true);
    try {
      const comment = await api.addComment(
        store.config.apiKey,
        issue.id,
        newComment.trim()
      );
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    } catch {
      // silently fail - user sees the comment field is still there
    }
    setSubmitting(false);
  }

  async function handleStateChange(stateId: string) {
    if (!store.config?.apiKey) return;
    try {
      await api.updateIssueState(store.config.apiKey, issue.id, stateId);
      const newState = store.states.find((s) => s.id === stateId);
      if (newState) {
        dispatch({
          type: "UPDATE_ISSUE",
          payload: { id: issue.id, changes: { state: newState } },
        });
      }
    } catch {
      // optimistic update not applied on failure
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs font-mono text-muted-foreground">
          {issue.identifier}
        </span>
        <a
          href={issue.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <h2 className="text-base font-semibold text-foreground leading-snug">
            {issue.title}
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              style={{
                borderColor: issue.state.color,
                color: issue.state.color,
              }}
            >
              {issue.state.name}
            </Badge>
            <Badge
              variant="outline"
              style={{
                borderColor:
                  PRIORITY_COLORS[issue.priority],
                color: PRIORITY_COLORS[issue.priority],
              }}
            >
              {PRIORITY_LABELS[issue.priority]}
            </Badge>
            {issue.labels.map((label) => (
              <Badge
                key={label.id}
                variant="outline"
                style={{ borderColor: label.color, color: label.color }}
              >
                {label.name}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Status</p>
              <Select
                value={issue.state.id}
                onValueChange={handleStateChange}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {store.states.map((s) => (
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
            <div>
              <p className="text-muted-foreground text-xs mb-1">Assignee</p>
              <div className="flex items-center gap-2">
                {issue.assignee ? (
                  <>
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={issue.assignee.avatarUrl} />
                      <AvatarFallback className="text-[10px]">
                        {issue.assignee.displayName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">
                      {issue.assignee.displayName}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Unassigned
                  </span>
                )}
              </div>
            </div>
          </div>

          {issue.description && (
            <>
              <Separator />
              <div className="prose prose-sm prose-invert max-w-none">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {issue.description}
                </p>
              </div>
            </>
          )}

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">
              Comments
            </h3>
            {loadingComments ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No comments yet
              </p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-lg bg-secondary/30 p-3"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={comment.user.avatarUrl} />
                        <AvatarFallback className="text-[10px]">
                          {comment.user.displayName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">
                        {comment.user.displayName}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                      {comment.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            placeholder="Add a comment..."
            className="min-h-[60px] text-sm resize-none bg-secondary/50"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                handleSubmitComment();
            }}
          />
          <Button
            size="icon"
            className="shrink-0 self-end"
            disabled={!newComment.trim() || submitting}
            onClick={handleSubmitComment}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
