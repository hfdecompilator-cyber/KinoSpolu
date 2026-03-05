import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  type LinearIssue,
  type LinearIssuePriority,
} from "../types";
import {
  Search,
  Circle,
  CircleDot,
  CheckCircle2,
  XCircle,
  Clock,
  SignalHigh,
  SignalMedium,
  SignalLow,
  AlertTriangle,
  Minus,
} from "lucide-react";

const STATE_ICONS: Record<string, typeof Circle> = {
  backlog: Clock,
  unstarted: Circle,
  started: CircleDot,
  completed: CheckCircle2,
  cancelled: XCircle,
};

function PriorityIcon({ priority }: { priority: LinearIssuePriority }) {
  const color = PRIORITY_COLORS[priority];
  switch (priority) {
    case 1:
      return <AlertTriangle className="h-3.5 w-3.5" style={{ color }} />;
    case 2:
      return <SignalHigh className="h-3.5 w-3.5" style={{ color }} />;
    case 3:
      return <SignalMedium className="h-3.5 w-3.5" style={{ color }} />;
    case 4:
      return <SignalLow className="h-3.5 w-3.5" style={{ color }} />;
    default:
      return <Minus className="h-3.5 w-3.5" style={{ color }} />;
  }
}

interface IssueListProps {
  issues: LinearIssue[];
  onSelect: (issue: LinearIssue) => void;
  selectedId?: string;
}

export function IssueList({ issues, onSelect, selectedId }: IssueListProps) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? issues.filter(
        (i) =>
          i.title.toLowerCase().includes(search.toLowerCase()) ||
          i.identifier.toLowerCase().includes(search.toLowerCase())
      )
    : issues;

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            className="pl-9 h-9 bg-secondary/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {search ? "No issues match your search" : "No issues found"}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((issue) => {
              const StateIcon = STATE_ICONS[issue.state.type] ?? Circle;
              return (
                <button
                  key={issue.id}
                  onClick={() => onSelect(issue)}
                  className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors ${
                    selectedId === issue.id ? "bg-secondary/70" : ""
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <StateIcon
                      className="h-4 w-4 mt-0.5 shrink-0"
                      style={{ color: issue.state.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">
                          {issue.identifier}
                        </span>
                        <PriorityIcon priority={issue.priority} />
                      </div>
                      <p className="text-sm font-medium text-foreground mt-0.5 truncate">
                        {issue.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {issue.labels.slice(0, 3).map((label) => (
                          <Badge
                            key={label.id}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                            style={{
                              borderColor: label.color,
                              color: label.color,
                            }}
                          >
                            {label.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {issue.assignee && (
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage src={issue.assignee.avatarUrl} />
                        <AvatarFallback className="text-[10px]">
                          {issue.assignee.displayName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
