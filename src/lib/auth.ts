import { create } from "zustand";
import { DEMO_MODE } from "./demo";

export type Role = "admin" | "editor" | "viewer";

export interface SessionUser {
  email: string;
  name: string;
  role: Role;
  demo?: boolean;
}

interface AuthState {
  user: SessionUser | null;
  enterDemo: () => boolean;
  logout: () => void;
}

// No account is restored from localStorage. The former hard-coded credentials
// are intentionally unavailable until a real authentication service exists.
export const useAuth = create<AuthState>((set) => ({
  user: null,
  enterDemo: () => {
    if (!DEMO_MODE) return false;
    set({
      user: {
        email: "demo@local.invalid",
        name: "Visitante da demonstração",
        role: "editor",
        demo: true,
      },
    });
    return true;
  },
  logout: () => set({ user: null }),
}));

export function canEdit(role?: Role) {
  return role === "admin" || role === "editor";
}
