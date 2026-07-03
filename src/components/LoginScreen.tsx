import { useState } from "react";
import { Mountain, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function LoginScreen() {
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setTimeout(() => {
      const res = login(email, password);
      if (!res.ok) {
        setError(res.error ?? "Erro ao entrar.");
        setLoading(false);
      }
    }, 350);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[image:var(--gradient-brand)] shadow-[var(--shadow-glow)]">
            <Mountain className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-semibold">
            Xhakinha <span className="text-gradient">por Santa Catarina</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Centro de operações da série
          </p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]"
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@xhakinha.sc"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Entrar
          </button>
        </form>

        <div className="mt-4 rounded-xl border border-border/60 bg-card/50 px-4 py-3 text-xs text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">Acesso da equipe (temporário)</p>
          <p>admin@xhakinha.sc · editor@xhakinha.sc · viewer@xhakinha.sc</p>
          <p>Senha: xhakinha</p>
        </div>
      </div>
    </div>
  );
}
