import { Compass, LockKeyhole } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/demo";

export function LoginScreen() {
  const enterDemo = useAuth((s) => s.enterDemo);

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
              <div className="flex items-center gap-2 text-primary"><LockKeyhole className="h-5 w-5" /><h2 className="font-display text-base font-semibold">Acesso temporariamente indisponível</h2></div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">A autenticação da equipe aguarda a configuração do novo serviço. Nenhuma conta temporária pode acessar esta versão.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
