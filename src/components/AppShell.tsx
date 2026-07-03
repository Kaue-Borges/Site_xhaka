import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map as MapIcon,
  Route as RouteIcon,
  ListChecks,
  Clock,
  LogOut,
  Mountain,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
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
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);

  if (!user) return <LoginScreen />;

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[image:var(--gradient-brand)] shadow-[var(--shadow-glow)]">
            <Mountain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold">Xhakinha</p>
            <p className="text-xs text-muted-foreground">por Santa Catarina</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((item) => {
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
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
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
              {user.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs capitalize text-muted-foreground">{user.role}</p>
            </div>
            <button
              onClick={logout}
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
          <span className="font-display text-sm font-semibold">Xhakinha SC</span>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
