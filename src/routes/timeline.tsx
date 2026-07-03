import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useSC } from "@/lib/cities";
import { useStore } from "@/lib/store";
import { StatusBadge } from "@/components/StatusBadge";
import { Video } from "lucide-react";

export const Route = createFileRoute("/timeline")({
  head: () => ({ meta: [{ title: "Linha do tempo — Xhakinha por Santa Catarina" }] }),
  component: Timeline,
});

function Timeline() {
  const sc = useSC();
  const cities = useStore((s) => s.cities);

  const entries = useMemo(() => {
    if (!sc) return [];
    return sc.cities
      .map((c) => ({ city: c, data: cities[c.id] }))
      .filter((e) => e.data && (e.data.recordedDate || e.data.plannedDate))
      .sort((a, b) => {
        const da = a.data!.recordedDate || a.data!.plannedDate || "";
        const db = b.data!.recordedDate || b.data!.plannedDate || "";
        return db.localeCompare(da);
      });
  }, [sc, cities]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      <h1 className="font-display text-3xl font-semibold">Linha do tempo</h1>
      <p className="mt-1 text-muted-foreground">A jornada da série, gravação após gravação.</p>

      {entries.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Ainda não há cidades com datas registradas.
        </p>
      ) : (
        <div className="mt-8 space-y-6 border-l border-border pl-6">
          {entries.map((e) => {
            const date = e.data!.recordedDate || e.data!.plannedDate;
            return (
              <div key={e.city.id} className="relative">
                <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-[image:var(--gradient-brand)] ring-4 ring-background" />
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {date ? new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : ""}
                        {e.data!.recordedDate ? "" : " (prevista)"}
                      </p>
                      <h2 className="font-display text-lg font-semibold">{e.city.name}</h2>
                      <p className="text-xs text-muted-foreground">{e.city.region}</p>
                    </div>
                    <StatusBadge status={e.data!.status} />
                  </div>
                  {e.data!.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{e.data!.description}</p>
                  )}
                  {e.data!.videoUrl && (
                    <a
                      href={e.data!.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                    >
                      <Video className="h-4 w-4" /> Assistir vídeo
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
