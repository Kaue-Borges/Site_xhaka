import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map as MapIcon,
  Route as RouteIcon,
  ListChecks,
  Clock,
  LogOut,
  Compass,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/demo";
import { useStore } from "@/lib/store";
import { LoginScreen } from "./LoginScreen";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/mapa", label: "Mapa", icon: MapIcon },
  { to: "/roteirizador", label: "Roteirizador", icon: RouteIcon },
  { to: "/roteiros", label: "Roteiros", icon: ListChecks },
  { to: "/timeline", label: "Linha do tempo", icon: Clock },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const loading = useAuth((s) => s.loading);
  const authError = useAuth((s) => s.error);
  const checkSession = useAuth((s) => s.checkSession);
  const saveError = useStore((s) => s.saveError);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => { void checkSession(); }, [checkSession]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando sessão...</div>;

  if (!user) return <LoginScreen />;

  return (
    <div className="app-frame flex min-h-screen w-full bg-background text-foreground">
      <aside
        className={cn(
          "app-sidebar fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 px-5 py-6">
          <img src="/images/xhaka/avatar.webp" alt="Xhakinha" className="h-11 w-11 rounded-2xl border-2 border-primary/70 object-cover shadow-[var(--shadow-glow)]" />
          <div className="leading-tight">
            <p className="font-display text-sm font-bold">Xhakinha<span className="text-primary">.</span></p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">por Santa Catarina</p>
          </div>
        </div>

        <div className="mx-4 mb-5 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary"><Compass className="h-4 w-4" /> EXPEDIÇÃO SC</div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Uma cidade de cada vez. Uma história em cada parada.</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Explorar</p>
          {NAV.map((item) => {
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "nav-link flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <img src="/images/xhaka/avatar.webp" alt="" className="h-9 w-9 rounded-full object-cover" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs capitalize text-muted-foreground">{user.role}</p>
            </div>
            <button
              onClick={() => { void logout(); }}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-md p-2 hover:bg-secondary"
            aria-label="Abrir menu"
          >
            <span className="block h-0.5 w-5 bg-foreground" />
            <span className="mt-1 block h-0.5 w-5 bg-foreground" />
            <span className="mt-1 block h-0.5 w-5 bg-foreground" />
          </button>
          <span className="font-display text-sm font-semibold">Xhakinha <span className="text-primary">SC</span></span>
        </header>
        {DEMO_MODE && (
          <div role="status" className="border-b border-primary/20 bg-primary/10 px-4 py-2 text-center text-xs font-medium text-primary">
            Modo demonstração · dados fictícios · alterações descartadas ao recarregar
          </div>
        )}
        {saveError && <div role="alert" className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">{saveError}</div>}
        {authError && <div role="alert" className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">{authError}</div>}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
