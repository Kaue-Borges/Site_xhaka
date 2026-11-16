import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { api } from "./api";
import { DEMO_MODE } from "./demo";
import { type CityData, type CityStatus, type Roteiro, emptyCity } from "./types";

export interface ProjectMeta {
  startDate: string;
  manualKm: number;
  nextRecording?: string;
}

interface StoreState {
  cities: Record<string, CityData>;
  roteiros: Roteiro[];
  meta: ProjectMeta;
  saveError: string | null;
  flushPending: () => Promise<boolean>;
  loadState: () => Promise<void>;
  reset: () => void;
  getCity: (id: string) => CityData;
  updateCity: (id: string, patch: Partial<CityData>, historyText?: string) => void;
  setStatus: (id: string, status: CityStatus, name: string) => void;
  toggleCheck: (id: string, itemId: string) => void;
  addRoteiro: (name: string) => string;
  updateRoteiro: (id: string, patch: Partial<Roteiro>) => void;
  removeRoteiro: (id: string) => void;
  setMeta: (patch: Partial<ProjectMeta>) => void;
}

const defaultMeta = (): ProjectMeta => ({
  startDate: new Date().toISOString().slice(0, 10),
  manualKm: 0,
});
const demoCities: Record<string, CityData> = {
  "4200051": {
    ...emptyCity(),
    status: "done",
    description: "Parada fictícia para explorar a demonstração.",
  },
  "4200101": { ...emptyCity(), status: "recording" },
  "4200200": { ...emptyCity(), status: "planned" },
  "4200309": { ...emptyCity(), status: "prep" },
};
const historyEntry = (text: string) => ({ id: uuidv4(), ts: Date.now(), text });

let queue = Promise.resolve();
let generation = 0;
type PendingJob = {
  timer: ReturnType<typeof setTimeout>;
  job: () => Promise<unknown>;
  generation: number;
};
const pending = new Map<string, PendingJob>();
function clearPending() {
  for (const item of pending.values()) clearTimeout(item.timer);
  pending.clear();
}
function runPending(key: string) {
  const item = pending.get(key);
  if (!item) return;
  clearTimeout(item.timer);
  pending.delete(key);
  queue = queue.then(async () => {
    if (item.generation !== generation) return;
    try {
      await item.job();
      useStore.setState({ saveError: null });
    } catch (error) {
      generation++;
      clearPending();
      const message = error instanceof Error ? error.message : "Não foi possível salvar.";
      console.error("Falha ao salvar:", error);
      try {
        await useStore.getState().loadState();
      } catch {
        /* Keep the error visible. */
      }
      useStore.setState({ saveError: `${message} As alterações locais foram recarregadas.` });
    }
  });
}
function persist(key: string, job: () => Promise<unknown>) {
  if (DEMO_MODE) return;
  const previous = pending.get(key);
  if (previous) clearTimeout(previous.timer);
  pending.set(key, { job, generation, timer: setTimeout(() => runPending(key), 350) });
}

export const useStore = create<StoreState>((set, get) => ({
  cities: DEMO_MODE ? demoCities : {},
  roteiros: [],
  meta: defaultMeta(),
  saveError: null,
  flushPending: async () => {
    for (const key of [...pending.keys()]) runPending(key);
    await queue;
    return get().saveError === null;
  },
  loadState: async () => {
    if (DEMO_MODE) return;
    const state = await api<{
      cities: Record<string, CityData>;
      roteiros: Roteiro[];
      meta: ProjectMeta;
    }>("/state");
    set({ ...state, saveError: null });
  },
  reset: () => {
    generation++;
    clearPending();
    set({
      cities: DEMO_MODE ? demoCities : {},
      roteiros: [],
      meta: defaultMeta(),
      saveError: null,
    });
  },
  getCity: (id) => get().cities[id] ?? emptyCity(),
  updateCity: (id, patch, historyText) => {
    const cur = get().getCity(id);
    const next = {
      ...cur,
      ...patch,
      history: historyText ? [historyEntry(historyText), ...cur.history].slice(0, 50) : cur.history,
    };
    set((s) => ({ cities: { ...s.cities, [id]: next } }));
    persist(`city:${id}`, () => api(`/cities/${id}`, "PUT", next));
  },
  setStatus: (id, status, name) => {
    const cur = get().getCity(id);
    const next = {
      ...cur,
      status,
      history: [historyEntry(`Status de ${name} alterado para "${status}"`), ...cur.history].slice(
        0,
        50,
      ),
    };
    set((s) => ({ cities: { ...s.cities, [id]: next } }));
    persist(`city:${id}`, () => api(`/cities/${id}`, "PUT", next));
  },
  toggleCheck: (id, itemId) => {
    const cur = get().getCity(id);
    const next = {
      ...cur,
      checklist: cur.checklist.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item,
      ),
    };
    set((s) => ({ cities: { ...s.cities, [id]: next } }));
    persist(`city:${id}`, () => api(`/cities/${id}`, "PUT", next));
  },
  addRoteiro: (name) => {
    const route = { id: uuidv4(), name, cityIds: [] };
    set((s) => ({ roteiros: [...s.roteiros, route] }));
    persist(`route:${route.id}`, () => api(`/routes/${route.id}`, "PUT", route));
    return route.id;
  },
  updateRoteiro: (id, patch) => {
    const route = get().roteiros.find((item) => item.id === id);
    if (!route) return;
    const next = { ...route, ...patch, id };
    set((s) => ({ roteiros: s.roteiros.map((item) => (item.id === id ? next : item)) }));
    persist(`route:${id}`, () => api(`/routes/${id}`, "PUT", next));
  },
  removeRoteiro: (id) => {
    set((s) => ({ roteiros: s.roteiros.filter((item) => item.id !== id) }));
    persist(`route:${id}`, () => api(`/routes/${id}`, "DELETE"));
  },
  setMeta: (patch) => {
    const next = { ...get().meta, ...patch };
    set({ meta: next });
    persist("meta", () => api("/meta", "PUT", next));
  },
}));
