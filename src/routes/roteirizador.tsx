import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSC, optimizeRoute, routeDistance, type CityInfo } from "@/lib/cities";
import { useStore } from "@/lib/store";
import { SCMap, MapLegend } from "@/components/SCMap";
import { StatusDot } from "@/components/StatusBadge";
import { Sparkles, Plus, X, Route as RouteIcon, Clock, Gauge } from "lucide-react";

export const Route = createFileRoute("/roteirizador")({
  head: () => ({ meta: [{ title: "Roteirizador — Xhakinha por Santa Catarina" }] }),
  component: Roteirizador,
});

const AVG_SPEED = 60; // km/h

function Roteirizador() {
  const sc = useSC();
  const cities = useStore((s) => s.cities);
  const [ids, setIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const selected: CityInfo[] = useMemo(
    () => (sc ? ids.map((id) => sc.byId[id]).filter(Boolean) : []),
    [sc, ids],
  );
  const distance = routeDistance(selected);
  const hours = distance / AVG_SPEED;

  const results = useMemo(() => {
    if (!sc || !query.trim()) return [];
    const q = query.toLowerCase();
    return sc.cities
      .filter((c) => c.name.toLowerCase().includes(q) && !ids.includes(c.id))
      .slice(0, 6);
  }, [sc, query, ids]);

  const add = (id: string) => { setIds((p) => [...p, id]); setQuery(""); };
  const remove = (id: string) => setIds((p) => p.filter((x) => x !== id));
  const optimize = () => setIds(optimizeRoute(selected).map((c) => c.id));

  const suggest = () => {
    if (!sc) return;
    const remaining = sc.cities.filter((c) => (cities[c.id]?.status ?? "none") === "none");
    const done = sc.cities.filter((c) => (cities[c.id]?.status ?? "none") === "done");
    const anchor = done.length ? done[done.length - 1] : remaining[0];
    if (!anchor) return;
    const byDist = [...remaining].sort(
      (a, b) =>
        Math.hypot(a.center[0] - anchor.center[0], a.center[1] - anchor.center[1]) -
        Math.hypot(b.center[0] - anchor.center[0], b.center[1] - anchor.center[1]),
    );
    setIds(optimizeRoute(byDist.slice(0, 5)).map((c) => c.id));
  };

  return (
    <div className="planner-page flex min-h-[calc(100dvh-3.5rem)] flex-col lg:h-screen lg:flex-row">
      <div className="planner-sidebar relative flex h-[54dvh] min-h-[420px] w-full flex-none flex-col overflow-hidden border-b border-border lg:h-auto lg:min-h-0 lg:w-96 lg:border-b-0 lg:border-r">
        <div className="planner-controls border-b border-border p-5">
          <h1 className="font-display text-xl font-semibold">Roteirizador inteligente</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Selecione cidades e otimize a ordem de visita.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={suggest}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[image:var(--gradient-brand)] px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Sparkles className="h-4 w-4" /> Sugerir próximo roteiro
            </button>
          </div>
          <div className="relative mt-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Adicionar cidade..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
            />
            {results.length > 0 && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-elegant)]">
                {results.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => add(c.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary"
                  >
                    <Plus className="h-3.5 w-3.5 text-muted-foreground" /> {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="planner-list flex-1 overflow-y-auto p-4">
          {selected.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma cidade selecionada.
            </p>
          ) : (
            <ol className="space-y-2">
              {selected.map((c, i) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <StatusDot status={cities[c.id]?.status ?? "none"} />
                  <span className="flex-1 truncate text-sm">{c.name}</span>
                  <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>

        {selected.length > 1 && (
          <div className="planner-metrics space-y-3 border-t border-border p-4">
            <div className="grid grid-cols-2 gap-3">
              <Metric icon={Gauge} label="Distância" value={`${distance} km`} />
              <Metric icon={Clock} label="Tempo est." value={`${Math.floor(hours)}h${String(Math.round((hours % 1) * 60)).padStart(2, "0")}`} />
            </div>
            <button
              onClick={optimize}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium hover:bg-secondary/70"
            >
              <RouteIcon className="h-4 w-4" /> Otimizar ordem
            </button>
          </div>
        )}
      </div>

      <div className="relative h-[58dvh] min-h-[420px] w-full flex-none lg:h-auto lg:min-h-0 lg:min-w-0 lg:flex-1">
        {/* routeIds only outlines the chosen cities; their real status colors stay visible. */}
        <SCMap
          className="h-full w-full"
          routeCities={selected}
          routeIds={ids}
          onSelect={(id) => (ids.includes(id) ? remove(id) : add(id))}
        />
        <MapLegend showRoute className="absolute bottom-3 left-3 right-3 z-[500] sm:bottom-5 sm:left-5 sm:right-auto sm:max-w-[calc(100%-2.5rem)]" />
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-1 font-display text-lg font-semibold">{value}</p>
    </div>
  );
}
