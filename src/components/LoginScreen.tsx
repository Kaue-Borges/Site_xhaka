import { Compass, LockKeyhole } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/demo";

export function LoginScreen() {
  const enterDemo = useAuth((s) => s.enterDemo);
  const login = useAuth((s) => s.login);
  const loading = useAuth((s) => s.loading);
  const error = useAuth((s) => s.error);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submit = (event: FormEvent) => { event.preventDefault(); void login(email, password); };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative w-full max-w-sm text-center">
        <img src="/images/xhaka/avatar.webp" alt="Xhakinha" className="mx-auto mb-4 h-16 w-16 rounded-2xl border-2 border-primary object-cover shadow-[var(--shadow-glow)]" />
        <h1 className="font-display text-2xl font-semibold">Xhakinha <span className="text-gradient">por Santa Catarina</span></h1>
        <p className="mt-2 text-sm text-muted-foreground">Centro de operações da série</p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-left shadow-[var(--shadow-elegant)]">
          {DEMO_MODE ? (
            <>
              <div className="flex items-center gap-2 text-primary"><Compass className="h-5 w-5" /><h2 className="font-display text-base font-semibold">Demonstração local</h2></div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Explore o mapa, os roteiros e os bastidores com dados fictícios. As alterações desta sessão não são salvas nem enviadas a um banco.</p>
              <button type="button" onClick={enterDemo} className="action-primary mt-5 w-full rounded-xl px-4 py-3 text-sm font-bold">Entrar na demonstração</button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-primary"><LockKeyhole className="h-5 w-5" /><h2 className="font-display text-base font-semibold">Acesso da equipe</h2></div>
              <form onSubmit={submit} className="mt-5 space-y-4">
                <label className="block text-sm text-muted-foreground">E-mail
                  <input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground" />
                </label>
                <label className="block text-sm text-muted-foreground">Senha
                  <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground" />
                </label>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <button type="submit" disabled={loading} className="action-primary w-full rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50">{loading ? "Entrando..." : "Entrar"}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
