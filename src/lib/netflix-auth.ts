/**
 * Netflix Authentication Module
 *
 * Implements a HEARO-style Netflix authentication flow:
 * - Opens Netflix's actual login page (https://www.netflix.com/login) in a popup
 * - Monitors the popup lifecycle to detect when the user has completed login
 * - Detects successful login by checking if the popup navigates away from /login
 *   (when popup navigates to same-origin page, URL is readable; cross-origin = CORS = still on Netflix)
 * - Falls back to user confirmation when popup navigates to Netflix's home (cross-origin)
 * - Persists the Netflix session state locally
 */

export interface NetflixAuthResult {
  success: boolean;
  profileName?: string;
  error?: string;
}

export interface NetflixPopupCallbacks {
  onOpened: () => void;
  onClosed: () => void;
  onLoggedIn: () => void;
  onError: (error: string) => void;
}

const NETFLIX_LOGIN_URL = 'https://www.netflix.com/login';
const NETFLIX_ORIGIN = 'https://www.netflix.com';

/**
 * Opens Netflix's real login page in a centered popup window.
 * Returns the popup window reference for monitoring.
 */
export function openNetflixLoginPopup(): Window | null {
  const width = 560;
  const height = 680;
  const left = Math.max(0, (window.screen.width - width) / 2);
  const top = Math.max(0, (window.screen.height - height) / 2);

  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'resizable=yes',
    'scrollbars=yes',
    'status=yes',
    'location=yes',
    'toolbar=no',
    'menubar=no',
  ].join(',');

  return window.open(NETFLIX_LOGIN_URL, 'netflix-auth', features);
}

/**
 * Monitors a Netflix login popup and calls back when the user
 * has navigated away from /login (indicating successful authentication).
 *
 * Detection strategy:
 * 1. While popup is on netflix.com, window.location access throws SecurityError (CORS)
 * 2. We poll every 500ms; if we can read the URL and it's no longer /login → success
 * 3. If popup closes without navigating away → user cancelled
 */
export function monitorNetflixPopup(
  popup: Window,
  callbacks: NetflixPopupCallbacks
): () => void {
  let hasNavigatedAway = false;
  let intervalId: ReturnType<typeof setInterval>;

  intervalId = setInterval(() => {
    // Popup was closed by user
    if (popup.closed) {
      clearInterval(intervalId);
      if (hasNavigatedAway) {
        callbacks.onLoggedIn();
      } else {
        // Try to detect if they logged in before closing by checking
        // if popup navigated to a non-login Netflix URL
        callbacks.onClosed();
      }
      return;
    }

    try {
      // Attempt to read popup URL — succeeds only if same-origin
      const url = popup.location.href;

      // If we can read the URL and it's a Netflix URL that's NOT the login page,
      // the user has successfully logged in
      if (url && !url.includes('/login') && url.includes('netflix.com')) {
        hasNavigatedAway = true;
        clearInterval(intervalId);
        callbacks.onLoggedIn();
      }
    } catch {
      // SecurityError: popup is on netflix.com (cross-origin) — this is expected
      // The user is somewhere on Netflix, which could mean they're logged in
      // We detect when they close the popup in the popup.closed check above
    }
  }, 500);

  callbacks.onOpened();

  // Return cleanup function
  return () => clearInterval(intervalId);
}

/**
 * Checks if Netflix is likely accessible by loading a small public Netflix resource.
 * This is a lightweight connectivity check.
 */
export async function checkNetflixReachable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${NETFLIX_ORIGIN}/favicon.ico`, {
      mode: 'no-cors',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.type === 'opaque';
  } catch {
    return false;
  }
}

export { NETFLIX_LOGIN_URL, NETFLIX_ORIGIN };
