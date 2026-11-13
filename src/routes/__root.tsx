import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import "@fontsource-variable/inter";
import "@fontsource-variable/sora";
import "leaflet/dist/leaflet.css";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "../components/AppShell";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta página não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Algo deu errado
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente atualizar a página ou volte ao início.
        </p>
        {import.meta.env.DEV && (
          <p className="mt-4 break-words rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-left font-mono text-xs text-destructive">
            {error.message}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Xhakinha por Santa Catarina — Centro de Operações" },
      {
        name: "description",
        content:
          "Painel de gestão da série Xhakinha por Santa Catarina: mapa interativo dos 295 municípios, roteiros, progresso e produção em um só lugar.",
      },
      { name: "author", content: "Xhakinha por Santa Catarina" },
      { property: "og:title", content: "Xhakinha por Santa Catarina — Centro de Operações" },
      {
        property: "og:description",
        content: "Mapa interativo, roteiros inteligentes e gestão completa da produção.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Xhakinha por Santa Catarina — Centro de Operações" },
      { name: "description", content: "Xhakinha HQ is a web application for managing the production of the \"Xhakinha por Santa Catarina\" series." },
      { property: "og:description", content: "Xhakinha HQ is a web application for managing the production of the \"Xhakinha por Santa Catarina\" series." },
      { name: "twitter:description", content: "Xhakinha HQ is a web application for managing the production of the \"Xhakinha por Santa Catarina\" series." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d8c277a5-e0fb-4167-a812-341c1ee8e879/id-preview-132ffe38--fdb406ab-9325-41f8-9b79-bd3e09e2877e.lovable.app-1783046384269.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d8c277a5-e0fb-4167-a812-341c1ee8e879/id-preview-132ffe38--fdb406ab-9325-41f8-9b79-bd3e09e2877e.lovable.app-1783046384269.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const queryClient = new QueryClient();

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <Outlet />
      </AppShell>
    </QueryClientProvider>
  );
}
