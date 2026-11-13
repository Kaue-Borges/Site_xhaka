import { useEffect, useId, useRef } from "react";
import L from "leaflet";
import { useSC } from "@/lib/cities";
import { useStore } from "@/lib/store";
import type { CityStatus } from "@/lib/types";
import type { CityInfo } from "@/lib/cities";

export const STATUS_HEX: Record<CityStatus, string> = {
  none: "#568879",
  planned: "#e8c65a",
  prep: "#ef9765",
  recording: "#8f8bf7",
  done: "#9af27c",
  cancelled: "#ed7891",
};

const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement<K extends keyof SVGElementTagNameMap>(name: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, name);
}

// Copy Leaflet's exact SVG paths into the clip. The observer mirrors every
// geometry update on zoom/pan, keeping the photograph and borders aligned.
function addStatePhoto(map: L.Map, layer: L.GeoJSON, svg: SVGSVGElement, clipId: string) {
  const municipalityGroup = svg.querySelector("g");
  const defs = svgElement("defs");
  const clip = svgElement("clipPath");
  clip.id = clipId;
  clip.setAttribute("clipPathUnits", "userSpaceOnUse");
  const clipPaths = new Map<Element, SVGPathElement>();
  layer.eachLayer((cityLayer) => {
    const path = (cityLayer as L.Path).getElement();
    if (!path) return;
    const copy = svgElement("path");
    copy.setAttribute("d", path.getAttribute("d") ?? "");
    copy.setAttribute("clip-rule", "evenodd");
    clip.appendChild(copy);
    clipPaths.set(path, copy);
  });
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const copy = clipPaths.get(mutation.target as Element);
      if (copy) copy.setAttribute("d", (mutation.target as Element).getAttribute("d") ?? "");
    }
  });
  if (municipalityGroup) {
    observer.observe(municipalityGroup, { attributes: true, subtree: true, attributeFilter: ["d"] });
  }
  defs.appendChild(clip);

  const blurId = `${clipId}-blur`;
  const blur = svgElement("filter");
  blur.id = blurId;
  blur.setAttribute("x", "-20%");
  blur.setAttribute("y", "-20%");
  blur.setAttribute("width", "140%");
  blur.setAttribute("height", "140%");
  const gaussian = svgElement("feGaussianBlur");
  gaussian.setAttribute("stdDeviation", "10");
  blur.appendChild(gaussian);
  defs.appendChild(blur);

  const photo = svgElement("g");
  photo.setAttribute("clip-path", `url(#${clipId})`);
  photo.setAttribute("pointer-events", "none");
  const base = svgElement("rect");
  base.setAttribute("fill", "#17362a");
  const blurred = svgElement("image");
  blurred.setAttribute("href", "/images/xhaka/carro-mapa.webp");
  blurred.setAttribute("preserveAspectRatio", "xMidYMid slice");
  blurred.setAttribute("filter", `url(#${blurId})`);
  blurred.setAttribute("opacity", "0.7");
  const sharp = svgElement("image");
  sharp.setAttribute("href", "/images/xhaka/carro-mapa.webp");
  sharp.setAttribute("preserveAspectRatio", "xMidYMid meet");
  sharp.setAttribute("opacity", "0.96");
  const shade = svgElement("rect");
  shade.setAttribute("fill", "#0a2119");
  shade.setAttribute("opacity", "0.12");
  photo.append(base, blurred, sharp, shade);

  svg.insertBefore(defs, municipalityGroup);
  svg.insertBefore(photo, municipalityGroup);

  const bounds = layer.getBounds();
  const updatePhoto = () => {
    const northwest = map.latLngToLayerPoint(bounds.getNorthWest());
    const southeast = map.latLngToLayerPoint(bounds.getSouthEast());
    const x = Math.min(northwest.x, southeast.x);
    const y = Math.min(northwest.y, southeast.y);
    const width = Math.abs(southeast.x - northwest.x);
    const height = Math.abs(southeast.y - northwest.y);
    for (const element of [base, blurred, shade]) {
      element.setAttribute("x", String(x));
      element.setAttribute("y", String(y));
      element.setAttribute("width", String(width));
      element.setAttribute("height", String(height));
    }
    sharp.setAttribute("x", String(x + width * 0.16));
    sharp.setAttribute("y", String(y - height * 0.1));
    sharp.setAttribute("width", String(width * 0.78));
    sharp.setAttribute("height", String(height));
  };
  updatePhoto();
  map.on("zoomend moveend resize viewreset", updatePhoto);
  return () => {
    observer.disconnect();
    map.off("zoomend moveend resize viewreset", updatePhoto);
  };
}

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
  const clipId = `sc-photo-${useId().replace(/:/g, "")}`;
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Leaflet creates its paths when the GeoJSON arrives. Their first style must
  // already contain a fill color; otherwise Leaflet falls back to the dark
  // border color and the municipalities look invisible until hover.
  const styleFeature = (id: string): L.PathOptions => {
    const status = cities[id]?.status ?? "none";
    const highlighted = !highlightIds || highlightIds.includes(id);
    const selected = selectedId === id;
    return {
      fillColor: STATUS_HEX[status],
      fillOpacity: highlighted ? (selected ? 0.35 : 0.2) : 0.04,
      color: selected ? "#ffffff" : "#d7f3e3",
      weight: selected ? 2.3 : 0.85,
      opacity: highlighted ? 0.9 : 0.55,
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

    const layer = L.geoJSON(sc.geojson, {
      style: (feature) => styleRef.current(feature?.properties.id as string),
      onEachFeature: (feature, lyr) => {
        const id = feature.properties.id as string;
        lyr.on({
          mouseover: (e) => {
            const t = e.target as L.Path;
            t.setStyle({ weight: 2, color: "#ffffff", fillOpacity: 0.42, opacity: 1 });
            t.bringToFront();
          },
          mouseout: (e) => {
            (e.target as L.Path).setStyle(styleRef.current(id));
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

    // fitBounds initializes Leaflet's SVG renderer for a map without a center.
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    const svg = containerRef.current.querySelector<SVGSVGElement>(".leaflet-overlay-pane svg");
    const removePhotoListeners = svg ? addStatePhoto(map, layer, svg, clipId) : () => {};
    return () => {
      removePhotoListeners();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      routeLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sc]);

  // restyle on data / selection / highlight changes
  useEffect(() => {
    if (!layerRef.current) return;
    layerRef.current.eachLayer((lyr: any) => {
      lyr.setStyle(styleRef.current(lyr.feature.properties.id));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sc, cities, selectedId, highlightIds]);

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
