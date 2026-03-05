import { useReducer, useEffect, useRef, type ReactNode } from "react";
import {
  LinearContext,
  linearReducer,
  initialLinearStore,
} from "./hooks/useLinear";
import * as api from "./api";

export function LinearProvider({ children }: { children: ReactNode }) {
  const [store, dispatch] = useReducer(linearReducer, initialLinearStore);
  const activeTeamRef = useRef(store.activeTeamId);
  activeTeamRef.current = store.activeTeamId;

  useEffect(() => {
    const storedKey = localStorage.getItem("linear_api_key");
    if (storedKey) {
      dispatch({ type: "SET_CONFIG", payload: { apiKey: storedKey } });
    }
  }, []);

  useEffect(() => {
    if (!store.config?.apiKey) return;

    let cancelled = false;
    const key = store.config.apiKey;

    (async () => {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });
      try {
        const [viewer, teams] = await Promise.all([
          api.fetchViewer(key),
          api.fetchTeams(key),
        ]);
        if (cancelled) return;
        dispatch({ type: "SET_VIEWER", payload: viewer });
        dispatch({ type: "SET_TEAMS", payload: teams });
        if (teams.length > 0 && !activeTeamRef.current) {
          dispatch({ type: "SET_ACTIVE_TEAM", payload: teams[0].id });
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to connect to Linear";
          dispatch({ type: "SET_ERROR", payload: message });
        }
      } finally {
        if (!cancelled) dispatch({ type: "SET_LOADING", payload: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [store.config?.apiKey]);

  useEffect(() => {
    if (!store.config?.apiKey || !store.activeTeamId) return;

    let cancelled = false;
    const key = store.config.apiKey;
    const teamId = store.activeTeamId;

    (async () => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const [issues, states, labels, members] = await Promise.all([
          api.fetchIssues(key, teamId),
          api.fetchTeamStates(key, teamId),
          api.fetchTeamLabels(key, teamId),
          api.fetchTeamMembers(key, teamId),
        ]);
        if (cancelled) return;
        dispatch({ type: "SET_ISSUES", payload: issues });
        dispatch({ type: "SET_STATES", payload: states });
        dispatch({ type: "SET_LABELS", payload: labels });
        dispatch({ type: "SET_MEMBERS", payload: members });
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load team data";
          dispatch({ type: "SET_ERROR", payload: message });
        }
      } finally {
        if (!cancelled) dispatch({ type: "SET_LOADING", payload: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [store.config?.apiKey, store.activeTeamId]);

  return (
    <LinearContext.Provider value={{ store, dispatch }}>
      {children}
    </LinearContext.Provider>
  );
}
