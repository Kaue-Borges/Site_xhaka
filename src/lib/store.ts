import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type CityData,
  type CityStatus,
  type Roteiro,
  emptyCity,
} from "./types";

interface ProjectMeta {
  startDate: string; // ISO date the project began
  manualKm: number;
  nextRecording?: string;
}

interface StoreState {
  cities: Record<string, CityData>;
  roteiros: Roteiro[];
  meta: ProjectMeta;
  getCity: (id: string) => CityData;
  updateCity: (id: string, patch: Partial<CityData>, historyText?: string) => void;
  setStatus: (id: string, status: CityStatus, name: string) => void;
  toggleCheck: (id: string, itemId: string) => void;
  addRoteiro: (name: string) => string;
  updateRoteiro: (id: string, patch: Partial<Roteiro>) => void;
  removeRoteiro: (id: string) => void;
  setMeta: (patch: Partial<ProjectMeta>) => void;
}

function hist(text: string) {
  return {
    id: uuidv4(),
    ts: Date.now(),
    text,
  };
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      cities: {},
      roteiros: [],
      meta: { startDate: new Date().toISOString().slice(0, 10), manualKm: 0 },

      getCity: (id) => get().cities[id] ?? emptyCity(),

      updateCity: (id, patch, historyText) =>
        set((s) => {
          const cur = s.cities[id] ?? emptyCity();
          const next: CityData = { ...cur, ...patch };
          if (historyText) next.history = [hist(historyText), ...cur.history].slice(0, 50);
          return { cities: { ...s.cities, [id]: next } };
        }),

      setStatus: (id, status, name) =>
        set((s) => {
          const cur = s.cities[id] ?? emptyCity();
          return {
            cities: {
              ...s.cities,
              [id]: {
                ...cur,
                status,
                history: [hist(`Status alterado para "${status}"`), ...cur.history].slice(0, 50),
              },
            },
          };
        }),

      toggleCheck: (id, itemId) =>
        set((s) => {
          const cur = s.cities[id] ?? emptyCity();
          return {
            cities: {
              ...s.cities,
              [id]: {
                ...cur,
                checklist: cur.checklist.map((c) =>
                  c.id === itemId ? { ...c, done: !c.done } : c,
                ),
              },
            },
          };
        }),

      addRoteiro: (name) => {
        const id = uuidv4();
        set((s) => ({ roteiros: [...s.roteiros, { id, name, cityIds: [] }] }));
        return id;
      },

      updateRoteiro: (id, patch) =>
        set((s) => ({
          roteiros: s.roteiros.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      removeRoteiro: (id) =>
        set((s) => ({ roteiros: s.roteiros.filter((r) => r.id !== id) })),

      setMeta: (patch) => set((s) => ({ meta: { ...s.meta, ...patch } })),
    }),
    { name: "xhakinha-sc-v1" },
  ),
);
