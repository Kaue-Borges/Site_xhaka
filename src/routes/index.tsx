import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSC } from "@/lib/cities";
import { useStore } from "@/lib/store";
import { useAuth, canEdit } from "@/lib/auth";
import { STATUS_META, STATUS_ORDER, REGIONS, type CityStatus } from "@/lib/types";
import { STATUS_HEX } from "@/components/SCMap";
import { StatusDot } from "@/components/StatusBadge";
import { MapPinned, CheckCircle2, CircleDashed, Route as RouteIcon, CalendarClock, Gauge, ArrowUpRight, Sparkles, Eye, X } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — Xhakinha por Santa Catarina" }] }),
  component: Dashboard,
});

function Dashboard() {
  const sc = useSC();
  const cities = useStore((s) => s.cities);
  const meta = useStore((s) => s.meta);
  const setMeta = useStore((s) => s.setMeta);
  const editable = canEdit(useAuth((s) => s.user?.role));
  const [showLook, setShowLook] = useState(false);

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
    <div className="mx-auto max-w-7xl px-5 py-7 lg:px-10 lg:py-9">
      <header className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">PAINEL DA EXPEDIÇÃO <span className="ml-2 text-primary">● AO VIVO</span></p>
          <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">A jornada continua, <span className="text-primary">bora?</span></h1>
        </div>
        <span className="rounded-full border border-border bg-card/70 px-4 py-2 text-xs text-muted-foreground">Santa Catarina inteira no radar ✦</span>
      </header>

      <section className="hero-card relative mb-5 overflow-hidden rounded-[1.75rem] border border-primary/20">
        <div className="hero-glow" aria-hidden="true" />
        <div className="relative z-10 flex min-h-[315px] flex-col justify-center px-7 py-9 sm:px-10 lg:max-w-[62%] lg:py-12">
          <p className="eyebrow text-primary">295 MUNICÍPIOS · INFINITAS HISTÓRIAS</p>
          <h2 className="mt-4 max-w-xl font-display text-3xl font-extrabold leading-[1.1] sm:text-5xl">Santa Catarina é grande.<br /><span className="text-gradient">A vontade de explorar também.</span></h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">Acompanhe cada parada, planeje o próximo rolê e transforme o mapa inteiro em boas histórias.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/mapa" className="action-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold">Explorar o mapa <ArrowUpRight className="h-4 w-4" /></Link>
            <Link to="/roteirizador" className="action-secondary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold">Planejar roteiro</Link>
          </div>
        </div>
        <div className="hero-portrait" aria-hidden="true"><img src="/images/xhaka/pose.webp" alt="" /></div>
      </section>

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

      <section className="mt-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div><p className="eyebrow text-primary">PEQUENAS PAUSAS, GRANDES HISTÓRIAS</p><h2 className="mt-1 font-display text-xl font-bold">Bastidores da expedição</h2></div>
          <p className="text-xs text-muted-foreground">Porque nem toda parada precisa ser séria.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="story-card flex min-h-52 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex min-w-0 flex-1 flex-col justify-center p-5 sm:p-6"><Sparkles className="mb-4 h-5 w-5 text-primary" /><p className="eyebrow">ENERGIA DA VIAGEM</p><h3 className="mt-2 font-display text-lg font-bold">Quando a brisa do ice vem</h3></div>
            <img src="/images/xhaka/look-rosa.webp" alt="Xhakinha com look rosa" loading="lazy" className="w-2/5 bg-[#332838] object-contain object-center" />
          </div>
          <div className="story-card flex min-h-52 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex min-w-0 flex-1 flex-col justify-center p-5 sm:p-6"><span className="mb-4 text-xl">🦣</span><p className="eyebrow">ENCONTROS IMPROVÁVEIS</p><h3 className="mt-2 font-display text-lg font-bold">O guia local chegou.</h3><p className="mt-2 text-sm text-muted-foreground">Ele não fala muito, mas conhece o caminho.</p></div>
            <img src="/images/xhaka/com-tamandua.webp" alt="Xhakinha com um tamanduá" loading="lazy" className="w-2/5 object-cover object-center" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setShowLook(true)} className="action-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"><Eye className="h-4 w-4" /> Ver o look da viagem</button>
        </div>
      </section>

      {showLook && <div className="surprise-backdrop fixed inset-0 z-[1000] flex items-center justify-center p-4" onClick={() => setShowLook(false)}>
        <div role="dialog" aria-modal="true" aria-label="Look da viagem" className="surprise-dialog relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border bg-card p-4 shadow-2xl sm:p-6" onClick={(event) => event.stopPropagation()}>
          <button onClick={() => setShowLook(false)} aria-label="Fechar surpresa" className="absolute right-4 top-4 z-10 rounded-full bg-background/80 p-2"><X className="h-4 w-4" /></button>
          <img src="/images/xhaka/look-rosa.webp" alt="Xhakinha com look rosa" className="mx-auto max-h-[68vh] w-auto max-w-full rounded-2xl object-contain" />
          <p className="mt-4 text-center font-display text-sm font-semibold">O look já está pronto. Falta só escolher a cidade. 💗</p>
        </div>
      </div>}

      {/* editable project metrics + regions */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <MetricInput
          icon={RouteIcon}
          label="Quilômetros percorridos"
          value={meta.manualKm}
          suffix="km"
          onChange={(v) => setMeta({ manualKm: v })}
          editable={editable}
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
              disabled={!editable}
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
            disabled={!editable}
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
  editable,
}: {
  icon: any;
  label: string;
  value: number;
  suffix?: string;
  onChange: (v: number) => void;
  editable: boolean;
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
          disabled={!editable}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-32 bg-transparent font-display text-3xl font-semibold outline-none"
        />
        {suffix && <span className="text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}
