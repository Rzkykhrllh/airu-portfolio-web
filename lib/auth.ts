'use client';

import {User} from '@/types';
import { apiFetch } from './fetch';
import { API_ENDPOINTS, STORAGE_KEYS } from './config';


// Backend Login Response
interface LoginResponse {
  token: string,
  user: {
    id: string,
    username: string,

  }
}

// Login With username and Password
export async function login(username: string, password: string): Promise<boolean>{
  try{
    const response = await apiFetch<LoginResponse>(API_ENDPOINTS.authentication.login, {
      method: "post",
      body: JSON.stringify({username, password})
    });

    // save token into local storage
    if (typeof window !== undefined){
      localStorage.setItem(STORAGE_KEYS.authToken, response.token)
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(response.user))
    }

    return true
  } catch(error){
    console.log(error);
    return false
  }
}

// Log out
export function logout(): void {
  if (typeof window !== undefined){
    localStorage.removeItem(STORAGE_KEYS.authToken);
    localStorage.removeItem(STORAGE_KEYS.user);
  }
}

// Get User from local storage
export function getUser(): User | null {
 if (typeof window !== undefined){
  const stored = localStorage.getItem(STORAGE_KEYS.user);

  if (stored){
    try{
      return JSON.parse(stored)
    } catch{
      return null
    }
  }
 }
 return null
}

// Check token validity
export async function isValidToken(): Promise<boolean>{
  try{
    await apiFetch(API_ENDPOINTS.health.authenticated, {
      method: "GET",
    });
    return true
  } catch {
    logout
    return false
  }
}