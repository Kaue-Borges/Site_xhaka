import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSC } from "@/lib/cities";
import { useStore } from "@/lib/store";
import { StatusDot } from "@/components/StatusBadge";
import { useAuth, canEdit } from "@/lib/auth";
import { Plus, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/roteiros")({
  head: () => ({ meta: [{ title: "Roteiros — Xhakinha por Santa Catarina" }] }),
  component: Roteiros,
});

function Roteiros() {
  const sc = useSC();
  const cities = useStore((s) => s.cities);
  const roteiros = useStore((s) => s.roteiros);
  const addRoteiro = useStore((s) => s.addRoteiro);
  const updateRoteiro = useStore((s) => s.updateRoteiro);
  const removeRoteiro = useStore((s) => s.removeRoteiro);
  const editable = canEdit(useAuth((s) => s.user?.role));
  const [name, setName] = useState("");
  const [pick, setPick] = useState<{ roteiro: string; q: string } | null>(null);

  const results = useMemo(() => {
    if (!sc || !pick?.q.trim()) return [];
    const q = pick.q.toLowerCase();
    return sc.cities.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6);
  }, [sc, pick]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 lg:px-8">
      <h1 className="font-display text-3xl font-semibold">Roteiros</h1>
      <p className="mt-1 text-muted-foreground">
        Agrupe cidades por regiões e temas de gravação.
      </p>

      {editable && (
        <div className="mt-6 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do roteiro (ex: Roteiro Serra)"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          />
          <button
            onClick={() => { if (name.trim()) { addRoteiro(name.trim()); setName(""); } }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Criar
          </button>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {roteiros.length === 0 && (
          <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            Nenhum roteiro criado ainda.
          </p>
        )}
        {roteiros.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">{r.name}</h2>
              {editable && (
                <button
                  onClick={() => removeRoteiro(r.id)}
                  className="rounded-md p-1.5 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {r.cityIds.map((id) => {
                const c = sc?.byId[id];
                if (!c) return null;
                return (
                  <span key={id} className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs">
                    <StatusDot status={cities[id]?.status ?? "none"} />
                    {c.name}
                    {editable && (
                      <button
                        onClick={() => updateRoteiro(r.id, { cityIds: r.cityIds.filter((x) => x !== id) })}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                );
              })}
              {r.cityIds.length === 0 && (
                <span className="text-xs text-muted-foreground">Sem cidades.</span>
              )}
            </div>
            {editable && (
              <div className="relative mt-3">
                <input
                  value={pick?.roteiro === r.id ? pick.q : ""}
                  onChange={(e) => setPick({ roteiro: r.id, q: e.target.value })}
                  placeholder="Adicionar cidade..."
                  className="w-full max-w-xs rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring"
                />
                {pick?.roteiro === r.id && results.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-w-xs overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-elegant)]">
                    {results.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          if (!r.cityIds.includes(c.id))
                            updateRoteiro(r.id, { cityIds: [...r.cityIds, c.id] });
                          setPick(null);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary"
                      >
                        <Plus className="h-3.5 w-3.5 text-muted-foreground" /> {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
