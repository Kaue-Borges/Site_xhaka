import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "admin" | "editor" | "viewer";

export interface SessionUser {
  email: string;
  name: string;
  role: Role;
}

// Temporary local accounts until Lovable Cloud is provisioned.
// Replace with Supabase Auth + user_roles table when the backend is available.
const ACCOUNTS: Record<string, { password: string; user: SessionUser }> = {
  "admin@xhakinha.sc": {
    password: "xhakinha",
    user: { email: "admin@xhakinha.sc", name: "Administrador", role: "admin" },
  },
  "editor@xhakinha.sc": {
    password: "xhakinha",
    user: { email: "editor@xhakinha.sc", name: "Editor", role: "editor" },
  },
  "viewer@xhakinha.sc": {
    password: "xhakinha",
    user: { email: "viewer@xhakinha.sc", name: "Visualizador", role: "viewer" },
  },
};

interface AuthState {
  user: SessionUser | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (email, password) => {
        const acc = ACCOUNTS[email.trim().toLowerCase()];
        if (!acc || acc.password !== password)
          return { ok: false, error: "E-mail ou senha inválidos." };
        set({ user: acc.user });
        return { ok: true };
      },
      logout: () => set({ user: null }),
    }),
    { name: "xhakinha-auth-v1" },
  ),
);

export function canEdit(role?: Role) {
  return role === "admin" || role === "editor";
}
