import { create } from 'zustand';
import apiClient from '../api/client';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname?: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  initialized: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      const { token, ...user } = data.data;
      localStorage.setItem('token', token);
      set({ user, token, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (email, password, nickname) => {
    set({ loading: true });
    try {
      const { data } = await apiClient.post('/auth/register', { email, password, nickname });
      const { token, ...user } = data.data;
      localStorage.setItem('token', token);
      set({ user, token, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  fetchUser: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const { data } = await apiClient.get('/auth/me');
      set({ user: data.data });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },

  init: async () => {
    await get().fetchUser();
    set({ initialized: true });
  },
}));
