import type {
  LinearIssue,
  LinearTeam,
  LinearUser,
  LinearLabel,
  LinearState,
  LinearComment,
  CreateIssueInput,
} from "./types";

const LINEAR_API = "https://api.linear.app/graphql";

async function gql<T>(
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(LINEAR_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Linear API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join(", "));
  }
  return json.data;
}

export async function fetchViewer(apiKey: string): Promise<LinearUser> {
  const data = await gql<{ viewer: LinearUser }>(
    apiKey,
    `query { viewer { id name displayName email avatarUrl } }`
  );
  return data.viewer;
}

export async function fetchTeams(apiKey: string): Promise<LinearTeam[]> {
  const data = await gql<{ teams: { nodes: LinearTeam[] } }>(
    apiKey,
    `query { teams { nodes { id name key } } }`
  );
  return data.teams.nodes;
}

export async function fetchTeamStates(
  apiKey: string,
  teamId: string
): Promise<LinearState[]> {
  const data = await gql<{
    team: { states: { nodes: LinearState[] } };
  }>(
    apiKey,
    `query($teamId: String!) {
      team(id: $teamId) {
        states { nodes { id name color type } }
      }
    }`,
    { teamId }
  );
  return data.team.states.nodes;
}

export async function fetchTeamLabels(
  apiKey: string,
  teamId: string
): Promise<LinearLabel[]> {
  const data = await gql<{
    team: { labels: { nodes: LinearLabel[] } };
  }>(
    apiKey,
    `query($teamId: String!) {
      team(id: $teamId) {
        labels { nodes { id name color } }
      }
    }`,
    { teamId }
  );
  return data.team.labels.nodes;
}

export async function fetchTeamMembers(
  apiKey: string,
  teamId: string
): Promise<LinearUser[]> {
  const data = await gql<{
    team: { members: { nodes: LinearUser[] } };
  }>(
    apiKey,
    `query($teamId: String!) {
      team(id: $teamId) {
        members { nodes { id name displayName email avatarUrl } }
      }
    }`,
    { teamId }
  );
  return data.team.members.nodes;
}

export async function fetchIssues(
  apiKey: string,
  teamId: string,
  opts?: { first?: number; filter?: string }
): Promise<LinearIssue[]> {
  const first = opts?.first ?? 50;
  const filterClause = opts?.filter
    ? `, filter: { title: { containsIgnoreCase: "${opts.filter}" } }`
    : "";

  interface RawIssue extends Omit<LinearIssue, "labels"> {
    labels?: { nodes: LinearLabel[] };
  }

  const data = await gql<{ team: { issues: { nodes: RawIssue[] } } }>(
    apiKey,
    `query($teamId: String!, $first: Int!) {
      team(id: $teamId) {
        issues(first: $first, orderBy: updatedAt${filterClause}) {
          nodes {
            id identifier title description priority url
            createdAt updatedAt
            state { id name color type }
            assignee { id name displayName email avatarUrl }
            labels { nodes { id name color } }
          }
        }
      }
    }`,
    { teamId, first }
  );

  return data.team.issues.nodes.map((issue) => ({
    ...issue,
    labels: issue.labels?.nodes ?? [],
  }));
}

export async function fetchIssueComments(
  apiKey: string,
  issueId: string
): Promise<LinearComment[]> {
  const data = await gql<{ issue: { comments: { nodes: LinearComment[] } } }>(
    apiKey,
    `query($issueId: String!) {
      issue(id: $issueId) {
        comments(orderBy: createdAt) {
          nodes {
            id body createdAt
            user { id name displayName email avatarUrl }
          }
        }
      }
    }`,
    { issueId }
  );
  return data.issue.comments.nodes;
}

export async function createIssue(
  apiKey: string,
  input: CreateIssueInput
): Promise<LinearIssue> {
  interface RawCreatedIssue extends Omit<LinearIssue, "labels"> {
    labels?: { nodes: LinearLabel[] };
  }

  const data = await gql<{ issueCreate: { issue: RawCreatedIssue } }>(
    apiKey,
    `mutation($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id identifier title description priority url
          createdAt updatedAt
          state { id name color type }
          assignee { id name displayName email avatarUrl }
          labels { nodes { id name color } }
        }
      }
    }`,
    { input }
  );

  const issue = data.issueCreate.issue;
  return { ...issue, labels: issue.labels?.nodes ?? [] };
}

export async function updateIssueState(
  apiKey: string,
  issueId: string,
  stateId: string
): Promise<void> {
  await gql(
    apiKey,
    `mutation($issueId: String!, $stateId: String!) {
      issueUpdate(id: $issueId, input: { stateId: $stateId }) {
        success
      }
    }`,
    { issueId, stateId }
  );
}

export async function addComment(
  apiKey: string,
  issueId: string,
  body: string
): Promise<LinearComment> {
  const data = await gql<{ commentCreate: { comment: LinearComment } }>(
    apiKey,
    `mutation($issueId: String!, $body: String!) {
      commentCreate(input: { issueId: $issueId, body: $body }) {
        success
        comment {
          id body createdAt
          user { id name displayName email avatarUrl }
        }
      }
    }`,
    { issueId, body }
  );
  return data.commentCreate.comment;
}
