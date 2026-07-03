import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useSC } from "@/lib/cities";
import { useStore } from "@/lib/store";
import { STATUS_META, STATUS_ORDER, REGIONS, type CityStatus } from "@/lib/types";
import { STATUS_HEX } from "@/components/SCMap";
import { StatusDot } from "@/components/StatusBadge";
import { MapPinned, CheckCircle2, CircleDashed, Route as RouteIcon, CalendarClock, Gauge } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — Xhakinha por Santa Catarina" }] }),
  component: Dashboard,
});

function Dashboard() {
  const sc = useSC();
  const cities = useStore((s) => s.cities);
  const meta = useStore((s) => s.meta);
  const setMeta = useStore((s) => s.setMeta);

  const stats = useMemo(() => {
    const total = sc?.cities.length ?? 295;
    const counts: Record<CityStatus, number> = {
      none: 0, planned: 0, prep: 0, recording: 0, done: 0, cancelled: 0,
    };
    (sc?.cities ?? []).forEach((c) => {
      counts[cities[c.id]?.status ?? "none"]++;
    });
    const done = counts.done;
    const visited = counts.done + counts.recording;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const regionCounts = REGIONS.map((r) => {
      const inRegion = (sc?.cities ?? []).filter((c) => c.region === r);
      const rdone = inRegion.filter((c) => (cities[c.id]?.status ?? "none") === "done").length;
      return { region: r, total: inRegion.length, done: rdone };
    });
    return { total, counts, done, visited, pct, remaining: total - done, regionCounts };
  }, [sc, cities]);

  const days = Math.max(
    1,
    Math.round((Date.now() - new Date(meta.startDate).getTime()) / 86400000),
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold">Centro de operações</h1>
        <p className="mt-1 text-muted-foreground">
          O progresso da jornada por Santa Catarina, em tempo real.
        </p>
      </header>

      {/* main stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={MapPinned} label="Municípios de SC" value={stats.total} accent="accent" />
        <StatCard icon={CheckCircle2} label="Concluídos" value={stats.done} accent="primary" />
        <StatCard icon={CircleDashed} label="Restantes" value={stats.remaining} />
        <StatCard icon={Gauge} label="Concluído" value={`${stats.pct}%`} accent="primary" />
      </div>

      {/* progress bar */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Progresso geral da série</h2>
          <span className="text-sm text-muted-foreground">
            {stats.done} de {stats.total}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-[image:var(--gradient-brand)] transition-all duration-700"
            style={{ width: `${stats.pct}%` }}
          />
        </div>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
          {STATUS_ORDER.map((s) => (
            <div key={s} className="flex items-center gap-2 text-sm">
              <StatusDot status={s} />
              <span className="text-muted-foreground">{STATUS_META[s].label}</span>
              <span className="font-semibold">{stats.counts[s]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* editable project metrics + regions */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <MetricInput
          icon={RouteIcon}
          label="Quilômetros percorridos"
          value={meta.manualKm}
          suffix="km"
          onChange={(v) => setMeta({ manualKm: v })}
        />
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarClock className="h-5 w-5" />
            <span className="text-sm">Dias de projeto</span>
          </div>
          <p className="mt-3 font-display text-3xl font-semibold">{days}</p>
          <label className="mt-3 block text-xs text-muted-foreground">
            Início do projeto
            <input
              type="date"
              value={meta.startDate}
              onChange={(e) => setMeta({ startDate: e.target.value })}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
            />
          </label>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarClock className="h-5 w-5" />
            <span className="text-sm">Próxima gravação</span>
          </div>
          <input
            type="date"
            value={meta.nextRecording ?? ""}
            onChange={(e) => setMeta({ nextRecording: e.target.value })}
            className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          />
        </div>
      </div>

      {/* regions */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold">Progresso por região</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.regionCounts.map((r) => {
            const pct = r.total ? Math.round((r.done / r.total) * 100) : 0;
            return (
              <div key={r.region}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{r.region}</span>
                  <span className="text-muted-foreground">
                    {r.done}/{r.total}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: STATUS_HEX.done }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: string | number;
  accent?: "primary" | "accent";
}) {
  const ring =
    accent === "primary"
      ? "text-primary"
      : accent === "accent"
        ? "text-accent"
        : "text-muted-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <Icon className={`h-5 w-5 ${ring}`} />
      <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function MetricInput({
  icon: Icon,
  label,
  value,
  suffix,
  onChange,
}: {
  icon: any;
  label: string;
  value: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-5 w-5" />
        <span className="text-sm">{label}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-32 bg-transparent font-display text-3xl font-semibold outline-none"
        />
        {suffix && <span className="text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}
