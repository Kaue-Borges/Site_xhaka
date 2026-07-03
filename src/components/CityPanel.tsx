import { useStore } from "@/lib/store";
import { useAuth, canEdit } from "@/lib/auth";
import { STATUS_META, STATUS_ORDER, type CityStatus, type CityData } from "@/lib/types";
import { StatusDot } from "./StatusBadge";
import type { CityInfo } from "@/lib/cities";
import {
  X,
  MapPin,
  Video,
  Instagram,
  Music2,
  Utensils,
  Hotel,
  Camera,
  Landmark,
  Phone,
  History,
} from "lucide-react";

function Field({
  label,
  value,
  onChange,
  editable,
  textarea,
  placeholder,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
  textarea?: boolean;
  placeholder?: string;
  type?: string;
}) {
  const base =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/25 disabled:opacity-70";
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {textarea ? (
        <textarea
          disabled={!editable}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={base}
        />
      ) : (
        <input
          disabled={!editable}
          type={type ?? "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={base}
        />
      )}
    </div>
  );
}

export function CityPanel({
  city,
  onClose,
}: {
  city: CityInfo;
  onClose: () => void;
}) {
  const role = useAuth((s) => s.user?.role);
  const editable = canEdit(role);
  const data = useStore((s) => s.cities[city.id]) ?? {
    status: "none" as CityStatus,
    checklist: [],
    history: [],
  };
  const updateCity = useStore((s) => s.updateCity);
  const setStatus = useStore((s) => s.setStatus);
  const toggleCheck = useStore((s) => s.toggleCheck);

  const set = (patch: Partial<CityData>) => updateCity(city.id, patch);
  const doneCount = data.checklist.filter((c) => c.done).length;

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border p-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {city.region}
          </div>
          <h2 className="mt-1 font-display text-xl font-semibold">{city.name}</h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        {/* status */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                disabled={!editable}
                onClick={() => setStatus(city.id, s, city.name)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
                  data.status === s
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <StatusDot status={s} />
                {STATUS_META[s].label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Data prevista" type="date" editable={editable} value={data.plannedDate ?? ""} onChange={(v) => set({ plannedDate: v })} />
          <Field label="Data realizada" type="date" editable={editable} value={data.recordedDate ?? ""} onChange={(v) => set({ recordedDate: v })} />
        </div>

        <Field label="Descrição" textarea editable={editable} value={data.description ?? ""} onChange={(v) => set({ description: v })} placeholder="Resumo da gravação nesta cidade..." />

        {/* links */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Links</p>
          <LinkField icon={Video} label="Vídeo" value={data.videoUrl ?? ""} editable={editable} onChange={(v) => set({ videoUrl: v })} />
          <LinkField icon={Instagram} label="Instagram" value={data.instagramUrl ?? ""} editable={editable} onChange={(v) => set({ instagramUrl: v })} />
          <LinkField icon={Music2} label="TikTok" value={data.tiktokUrl ?? ""} editable={editable} onChange={(v) => set({ tiktokUrl: v })} />
        </div>

        {/* checklist */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Checklist de equipamentos
            </p>
            <span className="text-xs text-muted-foreground">
              {doneCount}/{data.checklist.length}
            </span>
          </div>
          <div className="space-y-1">
            {data.checklist.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-secondary/50"
              >
                <input
                  type="checkbox"
                  disabled={!editable}
                  checked={item.done}
                  onChange={() => toggleCheck(city.id, item.id)}
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
                <span className={`text-sm ${item.done ? "text-muted-foreground line-through" : ""}`}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* production info */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Produção</p>
          <IconArea icon={Utensils} label="Restaurantes" value={data.restaurants ?? ""} editable={editable} onChange={(v) => set({ restaurants: v })} />
          <IconArea icon={Hotel} label="Hotéis" value={data.hotels ?? ""} editable={editable} onChange={(v) => set({ hotels: v })} />
          <IconArea icon={Camera} label="Locais para gravar" value={data.locations ?? ""} editable={editable} onChange={(v) => set({ locations: v })} />
          <IconArea icon={Landmark} label="Pontos turísticos" value={data.attractions ?? ""} editable={editable} onChange={(v) => set({ attractions: v })} />
          <IconArea icon={Phone} label="Contatos importantes" value={data.contacts ?? ""} editable={editable} onChange={(v) => set({ contacts: v })} />
        </div>

        <Field label="Anotações livres" textarea editable={editable} value={data.notes ?? ""} onChange={(v) => set({ notes: v })} placeholder="Observações da equipe..." />

        {/* history */}
        {data.history.length > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <History className="h-3.5 w-3.5" /> Histórico de alterações
            </p>
            <div className="space-y-1.5">
              {data.history.map((h) => (
                <div key={h.id} className="flex justify-between gap-3 text-xs text-muted-foreground">
                  <span>{h.text}</span>
                  <span className="shrink-0">
                    {new Date(h.ts).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LinkField({
  icon: Icon,
  label,
  value,
  editable,
  onChange,
}: {
  icon: any;
  label: string;
  value: string;
  editable: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        disabled={!editable}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Link do ${label}`}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25 disabled:opacity-70"
      />
      {value && (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-md px-2 py-1 text-xs text-accent hover:underline"
        >
          Abrir
        </a>
      )}
    </div>
  );
}

function IconArea({
  icon: Icon,
  label,
  value,
  editable,
  onChange,
}: {
  icon: any;
  label: string;
  value: string;
  editable: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </label>
      <textarea
        disabled={!editable}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25 disabled:opacity-70"
      />
    </div>
  );
}
