export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  state: {
    id: string;
    name: string;
    color: string;
    type: string;
  };
  priority: number;
  priorityLabel: string;
  team: {
    id: string;
    name: string;
    key: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

export interface LinearWorkflowState {
  id: string;
  name: string;
  color: string;
  type: string;
  team: {
    id: string;
    name: string;
  };
}

export interface LinearUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface CreateIssueInput {
  title: string;
  description?: string;
  teamId: string;
  priority?: number;
  stateId?: string;
}

export const PRIORITY_LABELS: Record<number, string> = {
  0: "No priority",
  1: "Urgent",
  2: "High",
  3: "Medium",
  4: "Low",
};

export const PRIORITY_COLORS: Record<number, string> = {
  0: "#6b7280",
  1: "#ef4444",
  2: "#f97316",
  3: "#eab308",
  4: "#6b7280",
};
