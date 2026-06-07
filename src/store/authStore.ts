"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  admin: AdminUser | null;
  token: string | null;
  setAuth: (admin: AdminUser, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      setAuth: (admin, token) => set({ admin, token }),
      logout: () => set({ admin: null, token: null }),
    }),
    { name: "auth-storage" },
  ),
);
