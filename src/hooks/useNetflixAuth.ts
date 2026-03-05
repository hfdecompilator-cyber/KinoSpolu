import { useState, useRef, useCallback } from 'react';
import {
  openNetflixLoginPopup,
  monitorNetflixPopup,
  checkNetflixReachable,
} from '@/lib/netflix-auth';

export type NetflixAuthStep =
  | 'idle'
  | 'checking'
  | 'popup-open'
  | 'popup-closed'
  | 'confirming'
  | 'success'
  | 'error'
  | 'disconnected';

interface NetflixAuthState {
  step: NetflixAuthStep;
  error: string | null;
  profileName: string;
}

export function useNetflixAuth(onSuccess: (profileName: string) => void) {
  const [state, setState] = useState<NetflixAuthState>({
    step: 'idle',
    error: null,
    profileName: '',
  });
  const popupRef = useRef<Window | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const startAuth = useCallback(async () => {
    setState({ step: 'checking', error: null, profileName: '' });

    const reachable = await checkNetflixReachable();
    if (!reachable) {
      setState(s => ({
        ...s,
        step: 'error',
        error: 'Netflix is not reachable. Please check your network connection.',
      }));
      return;
    }

    const popup = openNetflixLoginPopup();
    if (!popup) {
      setState(s => ({
        ...s,
        step: 'error',
        error: 'Popup was blocked. Please allow popups for this site and try again.',
      }));
      return;
    }

    popupRef.current = popup;
    setState(s => ({ ...s, step: 'popup-open' }));

    const cleanup = monitorNetflixPopup(popup, {
      onOpened: () => {
        setState(s => ({ ...s, step: 'popup-open' }));
      },
      onClosed: () => {
        setState(s => ({ ...s, step: 'popup-closed' }));
      },
      onLoggedIn: () => {
        setState(s => ({ ...s, step: 'confirming' }));
      },
      onError: (error) => {
        setState(s => ({ ...s, step: 'error', error }));
      },
    });

    cleanupRef.current = cleanup;
  }, []);

  const confirmLogin = useCallback((profileName: string) => {
    if (cleanupRef.current) cleanupRef.current();
    setState(s => ({ ...s, step: 'success', profileName }));
    onSuccess(profileName || 'Netflix User');
  }, [onSuccess]);

  const cancelAuth = useCallback(() => {
    if (cleanupRef.current) cleanupRef.current();
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    setState({ step: 'idle', error: null, profileName: '' });
  }, []);

  const resetAuth = useCallback(() => {
    setState({ step: 'idle', error: null, profileName: '' });
  }, []);

  const setProfileName = useCallback((name: string) => {
    setState(s => ({ ...s, profileName: name }));
  }, []);

  // Called when popup-closed state: user closed the popup, ask if they logged in
  const popupWasClosed = useCallback(() => {
    setState(s => ({ ...s, step: 'confirming' }));
  }, []);

  return {
    step: state.step,
    error: state.error,
    profileName: state.profileName,
    startAuth,
    confirmLogin,
    cancelAuth,
    resetAuth,
    setProfileName,
    popupWasClosed,
  };
}
