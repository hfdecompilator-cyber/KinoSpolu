import {
  createContext,
  useContext,
  useCallback,
  useReducer,
  type Dispatch,
} from "react";
import type {
  LinearIssue,
  LinearTeam,
  LinearUser,
  LinearLabel,
  LinearState,
  LinearConfig,
} from "../types";

export interface LinearStore {
  config: LinearConfig | null;
  viewer: LinearUser | null;
  teams: LinearTeam[];
  activeTeamId: string | null;
  issues: LinearIssue[];
  states: LinearState[];
  labels: LinearLabel[];
  members: LinearUser[];
  loading: boolean;
  error: string | null;
}

export const initialLinearStore: LinearStore = {
  config: null,
  viewer: null,
  teams: [],
  activeTeamId: null,
  issues: [],
  states: [],
  labels: [],
  members: [],
  loading: false,
  error: null,
};

export type LinearAction =
  | { type: "SET_CONFIG"; payload: LinearConfig | null }
  | { type: "SET_VIEWER"; payload: LinearUser }
  | { type: "SET_TEAMS"; payload: LinearTeam[] }
  | { type: "SET_ACTIVE_TEAM"; payload: string }
  | { type: "SET_ISSUES"; payload: LinearIssue[] }
  | { type: "ADD_ISSUE"; payload: LinearIssue }
  | {
      type: "UPDATE_ISSUE";
      payload: { id: string; changes: Partial<LinearIssue> };
    }
  | { type: "SET_STATES"; payload: LinearState[] }
  | { type: "SET_LABELS"; payload: LinearLabel[] }
  | { type: "SET_MEMBERS"; payload: LinearUser[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET" };

export function linearReducer(
  state: LinearStore,
  action: LinearAction
): LinearStore {
  switch (action.type) {
    case "SET_CONFIG":
      return { ...state, config: action.payload };
    case "SET_VIEWER":
      return { ...state, viewer: action.payload };
    case "SET_TEAMS":
      return { ...state, teams: action.payload };
    case "SET_ACTIVE_TEAM":
      return { ...state, activeTeamId: action.payload };
    case "SET_ISSUES":
      return { ...state, issues: action.payload };
    case "ADD_ISSUE":
      return { ...state, issues: [action.payload, ...state.issues] };
    case "UPDATE_ISSUE":
      return {
        ...state,
        issues: state.issues.map((i) =>
          i.id === action.payload.id
            ? { ...i, ...action.payload.changes }
            : i
        ),
      };
    case "SET_STATES":
      return { ...state, states: action.payload };
    case "SET_LABELS":
      return { ...state, labels: action.payload };
    case "SET_MEMBERS":
      return { ...state, members: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "RESET":
      return initialLinearStore;
    default:
      return state;
  }
}

export interface LinearContextValue {
  store: LinearStore;
  dispatch: Dispatch<LinearAction>;
}

export const LinearContext = createContext<LinearContextValue | null>(null);

export function useLinear(): LinearContextValue {
  const ctx = useContext(LinearContext);
  if (!ctx)
    throw new Error("useLinear must be used within LinearProvider");
  return ctx;
}

export function useLinearIssues() {
  const { store } = useLinear();
  return store.issues;
}

export function useLinearTeams() {
  const { store } = useLinear();
  return store.teams;
}

export function useLinearConfig() {
  const { store, dispatch } = useLinear();

  const setConfig = useCallback(
    (config: LinearConfig | null) => {
      dispatch({ type: "SET_CONFIG", payload: config });
      if (config) {
        localStorage.setItem("linear_api_key", config.apiKey);
      } else {
        localStorage.removeItem("linear_api_key");
      }
    },
    [dispatch]
  );

  return { config: store.config, setConfig };
}
