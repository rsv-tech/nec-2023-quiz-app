import { User } from '../types';

const BASE = import.meta.env.VITE_APPS_SCRIPT_URL ?? 'https://script.google.com/macros/s/XXX/exec';

type ApiOk<T> = { success: true } & T;
type ApiFail = { success: false; error: string };

async function apiGet<T>(params: Record<string, string>): Promise<T> {
  const url = `${BASE}?${new URLSearchParams(params)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'API error');
  return data as T;
}

/** Passwordless */
export async function requestCode(email: string) {
  return apiGet<ApiOk<{ ok: boolean }>>({ action: 'requestCode', email });
}

export async function verifyCode(email: string, code: string) {
  return apiGet<ApiOk<{ ok: boolean; user: User; isNewUser: boolean }>>({
    action: 'verifyCode',
    email,
    code,
  });
}

/** Локальная сессия */
export const saveUser = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = (): User | null => {
  const s = localStorage.getItem('user');
  return s ? (JSON.parse(s) as User) : null;
};

export const logout = (): void => {
  localStorage.removeItem('user');
};

// services/userService.ts
export const clearUser = (): void => {
  try {
    localStorage.removeItem('user');
  } catch {}
};
