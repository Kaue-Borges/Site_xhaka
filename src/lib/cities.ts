import { useEffect, useState } from "react";

export interface CityInfo {
  id: string;
  name: string;
  region: string;
  center: [number, number]; // [lat, lng]
}

export interface SCGeo {
  geojson: any;
  cities: CityInfo[];
  byId: Record<string, CityInfo>;
}

function centroid(geometry: any): [number, number] {
  let x = 0,
    y = 0,
    n = 0;
  const walk = (coords: any) => {
    if (typeof coords[0] === "number") {
      x += coords[0];
      y += coords[1];
      n++;
    } else coords.forEach(walk);
  };
  walk(geometry.coordinates);
  return n ? [y / n, x / n] : [-27.5, -50.5];
}

let cache: Promise<SCGeo> | null = null;

export function loadSC(): Promise<SCGeo> {
  if (cache) return cache;
  cache = fetch("/sc-municipios.geojson")
    .then((r) => r.json())
    .then((geojson) => {
      const cities: CityInfo[] = geojson.features.map((f: any) => ({
        id: f.properties.id,
        name: f.properties.name,
        region: f.properties.region,
        center: centroid(f.geometry),
      }));
      cities.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      const byId: Record<string, CityInfo> = {};
      cities.forEach((c) => (byId[c.id] = c));
      return { geojson, cities, byId };
    });
  return cache;
}

export function useSC(): SCGeo | null {
  const [data, setData] = useState<SCGeo | null>(null);
  useEffect(() => {
    let alive = true;
    loadSC().then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, []);
  return data;
}

// Haversine distance in km
export function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Nearest-neighbour ordering from a set of cities
export function optimizeRoute(cities: CityInfo[]): CityInfo[] {
  if (cities.length <= 2) return cities;
  const remaining = [...cities];
  const route = [remaining.shift()!];
  while (remaining.length) {
    const last = route[route.length - 1];
    let best = 0;
    let bestD = Infinity;
    remaining.forEach((c, i) => {
      const d = distanceKm(last.center, c.center);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    route.push(remaining.splice(best, 1)[0]);
  }
  return route;
}

export function routeDistance(cities: CityInfo[]): number {
  let total = 0;
  for (let i = 1; i < cities.length; i++)
    total += distanceKm(cities[i - 1].center, cities[i].center);
  return Math.round(total);
}
