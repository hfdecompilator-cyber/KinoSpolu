import { useState, useCallback } from "react";
import { LinearClient } from "@linear/sdk";
import type {
  LinearIssue,
  LinearTeam,
  LinearWorkflowState,
  LinearUser,
  CreateIssueInput,
} from "./types";

const STORAGE_KEY = "linear_api_key";

export function getStoredApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setStoredApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key);
}

export function clearStoredApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function makeClient(apiKey: string): LinearClient {
  return new LinearClient({ apiKey });
}

export function useLinearAuth() {
  const [apiKey, setApiKeyState] = useState<string | null>(getStoredApiKey);
  const [user, setUser] = useState<LinearUser | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyAndSave = useCallback(async (key: string): Promise<boolean> => {
    setVerifying(true);
    setError(null);
    try {
      const client = makeClient(key);
      const viewer = await client.viewer;
      setUser({ id: viewer.id, name: viewer.name, email: viewer.email, avatarUrl: viewer.avatarUrl ?? undefined });
      setStoredApiKey(key);
      setApiKeyState(key);
      return true;
    } catch {
      setError("Invalid API key or network error. Please check and try again.");
      return false;
    } finally {
      setVerifying(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    clearStoredApiKey();
    setApiKeyState(null);
    setUser(null);
    setError(null);
  }, []);

  return { apiKey, user, verifying, error, verifyAndSave, disconnect };
}

export function useLinearIssues(apiKey: string | null) {
  const [issues, setIssues] = useState<LinearIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyIssues = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    setError(null);
    try {
      const client = makeClient(apiKey);
      const me = await client.viewer;
      const assignedIssues = await me.assignedIssues({ first: 25, orderBy: "updatedAt" });

      const mapped: LinearIssue[] = await Promise.all(
        assignedIssues.nodes.map(async (issue) => {
          const [state, team, assignee] = await Promise.all([
            issue.state,
            issue.team,
            issue.assignee,
          ]);
          return {
            id: issue.id,
            identifier: issue.identifier,
            title: issue.title,
            description: issue.description ?? undefined,
            state: state
              ? { id: state.id, name: state.name, color: state.color, type: state.type }
              : { id: "", name: "Unknown", color: "#6b7280", type: "started" },
            priority: issue.priority,
            priorityLabel: issue.priorityLabel,
            team: team
              ? { id: team.id, name: team.name, key: team.key }
              : { id: "", name: "Unknown", key: "?" },
            assignee: assignee
              ? { id: assignee.id, name: assignee.name, email: assignee.email, avatarUrl: assignee.avatarUrl ?? undefined }
              : undefined,
            url: issue.url,
            createdAt: issue.createdAt.toISOString(),
            updatedAt: issue.updatedAt.toISOString(),
          };
        })
      );

      setIssues(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch issues");
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  return { issues, loading, error, fetchMyIssues };
}

export function useLinearTeams(apiKey: string | null) {
  const [teams, setTeams] = useState<LinearTeam[]>([]);
  const [states, setStates] = useState<LinearWorkflowState[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTeams = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    try {
      const client = makeClient(apiKey);
      const teamsResult = await client.teams();
      const teamNodes = teamsResult.nodes;

      const mapped: LinearTeam[] = teamNodes.map((t) => ({
        id: t.id,
        name: t.name,
        key: t.key,
      }));
      setTeams(mapped);

      const allStates: LinearWorkflowState[] = [];
      for (const team of teamNodes) {
        const statesResult = await team.states();
        for (const s of statesResult.nodes) {
          allStates.push({
            id: s.id,
            name: s.name,
            color: s.color,
            type: s.type,
            team: { id: team.id, name: team.name },
          });
        }
      }
      setStates(allStates);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  return { teams, states, loading, fetchTeams };
}

export async function createLinearIssue(
  apiKey: string,
  input: CreateIssueInput
): Promise<{ id: string; identifier: string; url: string } | null> {
  const client = makeClient(apiKey);
  const result = await client.createIssue({
    title: input.title,
    description: input.description,
    teamId: input.teamId,
    priority: input.priority ?? 0,
    stateId: input.stateId,
  });
  const issue = await result.issue;
  if (!issue) return null;
  return { id: issue.id, identifier: issue.identifier, url: issue.url };
}
