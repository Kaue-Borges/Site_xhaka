import { create } from "zustand";
import { DEMO_MODE } from "./demo";
import { api } from "./api";
import { useStore } from "./store";

export type Role = "admin" | "editor" | "viewer";

export interface SessionUser {
  id?: string;
  email: string;
  name: string;
  role: Role;
  demo?: boolean;
}

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  checkSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  enterDemo: () => boolean;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: !DEMO_MODE,
  error: null,
  checkSession: async () => {
    if (DEMO_MODE) return;
    try {
      const { user } = await api<{ user: SessionUser | null }>("/auth/me");
      if (user) await useStore.getState().loadState();
      set({ user, error: null });
    } catch (error) {
      set({ user: null, error: error instanceof Error ? error.message : "Falha na conexão." });
    } finally {
      set({ loading: false });
    }
  },
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { user } = await api<{ user: SessionUser }>("/auth/login", "POST", { email, password });
      await useStore.getState().loadState();
      set({ user });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Não foi possível entrar." });
    } finally {
      set({ loading: false });
    }
  },
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
  logout: async () => {
    if (!DEMO_MODE) {
      if (!(await useStore.getState().flushPending())) {
        set({ error: "Há alterações não salvas. Tente novamente após verificar o aviso." });
        return;
      }
      try {
        await api("/auth/logout", "POST");
      } catch (error) {
        console.error("Falha ao encerrar a sessão:", error);
        set({ error: "Não foi possível encerrar a sessão. Tente novamente." });
        return;
      }
    }
    useStore.getState().reset();
    set({ user: null, error: null });
  },
}));

export function canEdit(role?: Role) {
  return role === "admin" || role === "editor";
}
