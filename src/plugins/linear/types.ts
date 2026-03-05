export interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

export interface LinearUser {
  id: string;
  name: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
}

export interface LinearLabel {
  id: string;
  name: string;
  color: string;
}

export interface LinearState {
  id: string;
  name: string;
  color: string;
  type: "backlog" | "unstarted" | "started" | "completed" | "cancelled";
}

export type LinearIssuePriority = 0 | 1 | 2 | 3 | 4;

export const PRIORITY_LABELS: Record<LinearIssuePriority, string> = {
  0: "No priority",
  1: "Urgent",
  2: "High",
  3: "Medium",
  4: "Low",
};

export const PRIORITY_COLORS: Record<LinearIssuePriority, string> = {
  0: "#6b7280",
  1: "#ef4444",
  2: "#f97316",
  3: "#eab308",
  4: "#6b7280",
};

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  priority: LinearIssuePriority;
  state: LinearState;
  assignee?: LinearUser;
  labels: LinearLabel[];
  createdAt: string;
  updatedAt: string;
  url: string;
}

export interface LinearComment {
  id: string;
  body: string;
  user: LinearUser;
  createdAt: string;
}

export interface CreateIssueInput {
  title: string;
  description?: string;
  teamId: string;
  priority?: LinearIssuePriority;
  assigneeId?: string;
  labelIds?: string[];
  stateId?: string;
}

export interface LinearConfig {
  apiKey: string;
}
