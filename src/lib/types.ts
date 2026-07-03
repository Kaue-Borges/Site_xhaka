export type CityStatus =
  | "none"
  | "planned"
  | "prep"
  | "recording"
  | "done"
  | "cancelled";

export const STATUS_META: Record<
  CityStatus,
  { label: string; token: string; dot: string }
> = {
  none: { label: "Não iniciada", token: "text-status-none", dot: "bg-status-none" },
  planned: { label: "Planejada", token: "text-status-planned", dot: "bg-status-planned" },
  prep: { label: "Em preparação", token: "text-status-prep", dot: "bg-status-prep" },
  recording: { label: "Em gravação", token: "text-status-recording", dot: "bg-status-recording" },
  done: { label: "Concluída", token: "text-status-done", dot: "bg-status-done" },
  cancelled: { label: "Cancelada", token: "text-status-cancelled", dot: "bg-status-cancelled" },
};

export const STATUS_ORDER: CityStatus[] = [
  "none",
  "planned",
  "prep",
  "recording",
  "done",
  "cancelled",
];

export const REGIONS = [
  "Grande Florianópolis",
  "Norte Catarinense",
  "Oeste Catarinense",
  "Serrana",
  "Sul Catarinense",
  "Vale do Itajaí",
] as const;

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface HistoryEntry {
  id: string;
  ts: number;
  text: string;
}

export interface CityData {
  status: CityStatus;
  plannedDate?: string;
  recordedDate?: string;
  description?: string;
  notes?: string;
  videoUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  restaurants?: string;
  hotels?: string;
  locations?: string;
  attractions?: string;
  contacts?: string;
  checklist: ChecklistItem[];
  history: HistoryEntry[];
}

export interface Roteiro {
  id: string;
  name: string;
  cityIds: string[];
}

export function defaultChecklist(): ChecklistItem[] {
  return [
    "Drone carregado",
    "Microfones",
    "Câmeras",
    "Power Bank",
    "Cartões SD",
    "Água",
    "Alimentação",
    "Combustível",
    "Autorizações",
    "Contato da prefeitura",
  ].map((label, i) => ({ id: `c${i}`, label, done: false }));
}

export function emptyCity(): CityData {
  return { status: "none", checklist: defaultChecklist(), history: [] };
}
