import { getCurrentUser } from "@streets/api-client";
import type { AuthSession } from "@streets/types";

export const AUTH_SESSION_KEY = "streets.session";

export function emitAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("streets-auth-changed"));
  }
}

export function saveAuthSession(session: AuthSession) {
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  emitAuthChanged();
}

export function readAuthSession(): AuthSession | null {
  const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_SESSION_KEY);
  emitAuthChanged();
}

/** Re-fetch `/auth/me`; clears storage if token is invalid. */
export async function validateAuthSession(): Promise<AuthSession | null> {
  const session = readAuthSession();
  if (!session?.access_token) {
    return null;
  }
  try {
    const user = await getCurrentUser(session.access_token);
    const next: AuthSession = {
      ...session,
      user
    };
    saveAuthSession(next);
    return next;
  } catch {
    clearAuthSession();
    return null;
  }
}
