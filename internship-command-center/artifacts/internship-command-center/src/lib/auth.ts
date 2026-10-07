import { setAuthTokenGetter } from '@workspace/api-client-react';

const TOKEN_KEY = 'internship_bot_token';
const USER_KEY = 'internship_bot_user';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

// Wire up the token getter so all API calls from @workspace/api-client-react
// automatically include Authorization: Bearer <token>
setAuthTokenGetter(getToken);
