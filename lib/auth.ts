'use client';

import { User } from '@/types';

const AUTH_STORAGE_KEY = 'admin_auth';

// Simple auth helpers for MVP
// TODO: Replace with proper JWT/session auth when backend is ready

export function login(username: string, password: string): boolean {
  // Get credentials from environment (for now, hardcoded for MVP)
  const validUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin';
  const validPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

  if (username === validUsername && password === validPassword) {
    const user: User = { username };
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    }
    return true;
  }

  return false;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function getUser(): User | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function isAuthenticated(): boolean {
  return getUser() !== null;
}
