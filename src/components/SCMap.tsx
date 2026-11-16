import { useEffect, useRef } from "react";
import L from "leaflet";
import { useSC } from "@/lib/cities";
import { useStore } from "@/lib/store";
import { STATUS_META, STATUS_ORDER, type CityStatus } from "@/lib/types";
import type { CityInfo } from "@/lib/cities";

// Single source for the map fill colors. The CSS tokens --status-* in
// styles.css use the same values, so legend dots and badges match the map.
export const STATUS_HEX: Record<CityStatus, string> = {
  none: "#dfe6e2",
  planned: "#f5c84c",
  prep: "#f08a3c",
  recording: "#4f9cf5",
  done: "#22d65c",
  cancelled: "#e2556f",
};

const BORDER_COLOR = "#0d2219";
const EMPHASIS_COLOR = "#ffffff";

type CityLayer = L.Path & { feature: { properties: { id: string } } };

interface Props {
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Filter: municipalities outside this list are faded (Mapa page filters). */
  highlightIds?: string[];
  /** Municipalities chosen for a route. Outlined only; the status fill is kept. */
  routeIds?: string[];
  routeCities?: CityInfo[];
  focusId?: string | null;
  className?: string;
}

export function SCMap({
  selectedId,
  onSelect,
  highlightIds,
  routeIds,
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

  const isEmphasized = (id: string) => selectedId === id || !!routeIds?.includes(id);
  const isEmphasizedRef = useRef(isEmphasized);
  isEmphasizedRef.current = isEmphasized;

  // Leaflet creates its paths when the GeoJSON arrives. Their first style must
  // already contain a fill color; otherwise Leaflet falls back to the border
  // color and the municipalities look invisible until hover.
  const styleFeature = (id: string): L.PathOptions => {
    const fillColor = STATUS_HEX[cities[id]?.status ?? "none"];
    if (isEmphasized(id)) {
      // Selection / route membership only changes the outline, never the status fill.
      return { fillColor, fillOpacity: 0.95, color: EMPHASIS_COLOR, weight: 2.6, opacity: 1 };
    }
    const highlighted = !highlightIds || highlightIds.includes(id);
    return {
      fillColor,
      fillOpacity: highlighted ? 0.88 : 0.14,
      color: BORDER_COLOR,
      weight: 0.7,
      opacity: highlighted ? 0.9 : 0.45,
    };
  };
  const styleRef = useRef(styleFeature);
  styleRef.current = styleFeature;

  // init map once geojson is ready
  useEffect(() => {
    if (!sc || !containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      renderer: L.svg({ padding: 0.5 }),
      zoomControl: true,
      attributionControl: false,
      minZoom: 6,
      maxZoom: 12,
      zoomSnap: 0.25,
    });
    mapRef.current = map;

    // Keep the white outline of selected/route municipalities above neighbours.
    const bringEmphasizedToFront = () => {
      layerRef.current?.eachLayer((layer) => {
        const lyr = layer as CityLayer;
        if (isEmphasizedRef.current(lyr.feature.properties.id)) lyr.bringToFront();
      });
    };

    const layer = L.geoJSON(sc.geojson, {
      style: (feature) => styleRef.current(feature?.properties.id as string),
      onEachFeature: (feature, lyr) => {
        const id = feature.properties.id as string;
        lyr.on({
          mouseover: (e) => {
            const t = e.target as L.Path;
            // Hover keeps the status color; only the outline is highlighted.
            t.setStyle({ weight: 2.4, color: EMPHASIS_COLOR, fillOpacity: 1, opacity: 1 });
            t.bringToFront();
          },
          mouseout: (e) => {
            (e.target as L.Path).setStyle(styleRef.current(id));
            if (!isEmphasizedRef.current(id)) bringEmphasizedToFront();
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
    bringEmphasizedToFront();
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      routeLayerRef.current = null;
    };
  }, [sc]);

  // restyle on data / selection / highlight changes
  useEffect(() => {
    if (!layerRef.current) return;
    const emphasized: L.Path[] = [];
    layerRef.current.eachLayer((layer) => {
      const lyr = layer as CityLayer;
      const id = lyr.feature.properties.id;
      lyr.setStyle(styleRef.current(id));
      if (isEmphasizedRef.current(id)) emphasized.push(lyr);
    });
    emphasized.forEach((lyr) => lyr.bringToFront());
  }, [sc, cities, selectedId, highlightIds, routeIds]);

  // draw route line + numbered markers
  useEffect(() => {
    const grp = routeLayerRef.current;
    if (!grp) return;
    grp.clearLayers();
    if (!routeCities || routeCities.length < 1) return;
    const pts = routeCities.map((c) => c.center as [number, number]);
    if (pts.length > 1) {
      // Dark under-stroke keeps the dashed line readable over light and green fills.
      // Non-interactive so the line never steals clicks/hover from municipalities.
      L.polyline(pts, { color: "#0b2417", weight: 5, opacity: 0.55, interactive: false }).addTo(grp);
      L.polyline(pts, { color: "#ffffff", weight: 2.5, dashArray: "6 8", opacity: 0.95, interactive: false }).addTo(grp);
    }
    routeCities.forEach((c, i) => {
      L.marker(c.center, {
        icon: L.divIcon({
          className: "",
          html: `<div style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:999px;background:#0b2417;color:#ffffff;border:2px solid #ffffff;font-weight:700;font-size:11px;box-shadow:0 2px 8px rgba(0,0,0,.45)">${i + 1}</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
      }).addTo(grp);
    });
  }, [routeCities, sc]);

  // focus / center on a city
  useEffect(() => {
    if (!focusId || !sc || !mapRef.current) return;
    const c = sc.byId[focusId];
    if (c) mapRef.current.flyTo(c.center, 10, { duration: 0.8 });
  }, [focusId, sc]);

  // The city panel and mobile viewport can change the map's width after init.
  useEffect(() => {
    if (!mapRef.current || !containerRef.current) return;
    const observer = new ResizeObserver(() => mapRef.current?.invalidateSize({ pan: false }));
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [sc]);

  return (
    <div className={`sc-map-scene relative overflow-hidden ${className ?? ""}`}>
      <div ref={containerRef} className="sc-map-canvas relative z-10 h-full w-full" aria-label="Mapa interativo dos municípios de Santa Catarina" />
    </div>
  );
}

/** Discreet status legend shared by the Mapa and Roteirizador pages. */
export function MapLegend({ showRoute, className }: { showRoute?: boolean; className?: string }) {
  return (
    <div
      className={`flex flex-wrap gap-x-3 gap-y-1.5 rounded-xl border border-border bg-card/95 px-3 py-2 text-[11px] shadow-[var(--shadow-elegant)] backdrop-blur ${className ?? ""}`}
    >
      {STATUS_ORDER.map((s) => (
        <span key={s} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-[3px] ring-1 ring-black/40"
            style={{ background: STATUS_HEX[s] }}
          />
          {STATUS_META[s].label}
        </span>
      ))}
      {showRoute && (
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-[3px] border-2 border-white" />
          No roteiro
        </span>
      )}
    </div>
  );
}
