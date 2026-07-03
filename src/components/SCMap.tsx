import { useEffect, useRef } from "react";
import L from "leaflet";
import { useSC } from "@/lib/cities";
import { useStore } from "@/lib/store";
import type { CityStatus } from "@/lib/types";
import type { CityInfo } from "@/lib/cities";

export const STATUS_HEX: Record<CityStatus, string> = {
  none: "#6b7280",
  planned: "#eab308",
  prep: "#f97316",
  recording: "#3b82f6",
  done: "#22c55e",
  cancelled: "#ef4444",
};

interface Props {
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  highlightIds?: string[];
  routeCities?: CityInfo[];
  focusId?: string | null;
  className?: string;
}

export function SCMap({
  selectedId,
  onSelect,
  highlightIds,
  routeCities,
  focusId,
  className,
}: Props) {
  const sc = useSC();
  const cities = useStore((s) => s.cities);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // init map once geojson is ready
  useEffect(() => {
    if (!sc || !containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
      minZoom: 6,
      maxZoom: 12,
    });
    mapRef.current = map;

    const layer = L.geoJSON(sc.geojson, {
      style: () => ({ weight: 0.6, color: "#0f1115", fillOpacity: 0.7 }),
      onEachFeature: (feature, lyr) => {
        const id = feature.properties.id as string;
        lyr.on({
          mouseover: (e) => {
            const t = e.target as L.Path;
            t.setStyle({ weight: 2, color: "#e5e7eb", fillOpacity: 0.95 });
            t.bringToFront();
          },
          mouseout: (e) => {
            (layerRef.current as L.GeoJSON).resetStyle(e.target);
            styleFeature(e.target, id);
          },
          click: () => onSelectRef.current?.(id),
        });
        lyr.bindTooltip(feature.properties.name, {
          sticky: true,
          direction: "top",
          className: "sc-tip",
          opacity: 1,
        });
      },
    }).addTo(map);
    layerRef.current = layer;
    routeLayerRef.current = L.layerGroup().addTo(map);

    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sc]);

  function styleFeature(lyr: L.Path, id: string) {
    const status = cities[id]?.status ?? "none";
    const highlighted = !highlightIds || highlightIds.includes(id);
    const selected = selectedId === id;
    lyr.setStyle({
      fillColor: STATUS_HEX[status],
      fillOpacity: highlighted ? 0.78 : 0.12,
      color: selected ? "#ffffff" : "#0f1115",
      weight: selected ? 2.4 : 0.6,
    });
  }

  // restyle on data / selection / highlight changes
  useEffect(() => {
    if (!layerRef.current) return;
    layerRef.current.eachLayer((lyr: any) => {
      styleFeature(lyr, lyr.feature.properties.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities, selectedId, highlightIds]);

  // draw route line + numbered markers
  useEffect(() => {
    const grp = routeLayerRef.current;
    if (!grp) return;
    grp.clearLayers();
    if (!routeCities || routeCities.length < 1) return;
    const pts = routeCities.map((c) => c.center as [number, number]);
    if (pts.length > 1) {
      L.polyline(pts, { color: "#22c55e", weight: 3, dashArray: "6 8", opacity: 0.9 }).addTo(grp);
    }
    routeCities.forEach((c, i) => {
      L.marker(c.center, {
        icon: L.divIcon({
          className: "",
          html: `<div style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:999px;background:#22c55e;color:#0b2417;font-weight:700;font-size:11px;box-shadow:0 2px 8px rgba(0,0,0,.4)">${i + 1}</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
      }).addTo(grp);
    });
  }, [routeCities]);

  // focus / center on a city
  useEffect(() => {
    if (!focusId || !sc || !mapRef.current) return;
    const c = sc.byId[focusId];
    if (c) mapRef.current.flyTo(c.center, 10, { duration: 0.8 });
  }, [focusId, sc]);

  useEffect(() => () => {
    mapRef.current?.remove();
    mapRef.current = null;
  }, []);

  return <div ref={containerRef} className={className} />;
}
