import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSC } from "@/lib/cities";
import { useStore } from "@/lib/store";
import { SCMap } from "@/components/SCMap";
import { CityPanel } from "@/components/CityPanel";
import { STATUS_META, STATUS_ORDER, REGIONS, type CityStatus } from "@/lib/types";
import { StatusDot } from "@/components/StatusBadge";
import { Search, SlidersHorizontal, X } from "lucide-react";

export const Route = createFileRoute("/mapa")({
  head: () => ({ meta: [{ title: "Mapa — Xhakinha por Santa Catarina" }] }),
  component: MapaPage,
});

function MapaPage() {
  const sc = useSC();
  const cities = useStore((s) => s.cities);
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<string>("all");
  const [status, setStatus] = useState<CityStatus | "all">("all");

  const filteredIds = useMemo(() => {
    if (!sc) return undefined;
    return sc.cities
      .filter((c) => region === "all" || c.region === region)
      .filter((c) => status === "all" || (cities[c.id]?.status ?? "none") === status)
      .map((c) => c.id);
  }, [sc, region, status, cities]);

  const searchResults = useMemo(() => {
    if (!sc || !query.trim()) return [];
    const q = query.toLowerCase();
    return sc.cities.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [sc, query]);

  const selectedCity = selected && sc ? sc.byId[selected] : null;
  const hasFilter = region !== "all" || status !== "all";

  return (
    <div className="relative flex h-[calc(100vh-3.5rem)] lg:h-screen">
      <div className="relative flex-1">
        {/* search + filters overlay */}
        <div className="absolute left-4 right-4 top-4 z-[500] flex flex-col gap-2 sm:right-auto sm:w-80">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card/95 px-3 py-2 shadow-[var(--shadow-elegant)] backdrop-blur">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar município..."
              className="w-full bg-transparent text-sm outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-elegant)]">
              {searchResults.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelected(c.id);
                    setFocus(c.id);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-secondary"
                >
                  <span className="flex items-center gap-2">
                    <StatusDot status={cities[c.id]?.status ?? "none"} />
                    {c.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{c.region}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/95 p-2 shadow-[var(--shadow-elegant)] backdrop-blur">
            <SlidersHorizontal className="ml-1 h-4 w-4 text-muted-foreground" />
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs outline-none"
            >
              <option value="all">Todas as regiões</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CityStatus | "all")}
              className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs outline-none"
            >
              <option value="all">Todos os status</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>
            {hasFilter && (
              <button
                onClick={() => { setRegion("all"); setStatus("all"); }}
                className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* legend */}
        <div className="absolute bottom-4 left-4 z-[500] flex flex-wrap gap-x-4 gap-y-1.5 rounded-xl border border-border bg-card/95 px-3 py-2 text-xs shadow-[var(--shadow-elegant)] backdrop-blur">
          {STATUS_ORDER.map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <StatusDot status={s} />
              {STATUS_META[s].label}
            </span>
          ))}
        </div>

        <SCMap
          className="h-full w-full"
          selectedId={selected}
          onSelect={(id) => setSelected(id)}
          highlightIds={hasFilter ? filteredIds : undefined}
          focusId={focus}
        />
      </div>

      {/* side panel */}
      <div
        className={`fixed inset-y-0 right-0 z-[600] w-full max-w-md transform border-l border-border shadow-2xl transition-transform lg:relative lg:z-0 ${
          selectedCity ? "translate-x-0" : "translate-x-full lg:hidden"
        }`}
      >
        {selectedCity && <CityPanel city={selectedCity} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}
