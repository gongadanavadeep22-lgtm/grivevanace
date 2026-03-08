"use client";

import { useEffect, useRef, useState } from "react";

export interface LocationZone {
  location: string;
  count: number;
  zone: "red" | "orange" | "green";
}

declare global {
  interface Window {
    L?: unknown;
  }
}

// Vizag (Visakhapatnam) areas with real coordinates
const VIZAG_AREAS = [
  { name: "Gajuwaka", lat: 17.6996, lng: 83.211, slug: "gajuwaka" },
  { name: "RK Beach", lat: 17.7215, lng: 83.3392, slug: "rk beach" },
  { name: "MVP Colony", lat: 17.735, lng: 83.308, slug: "mvp" },
  { name: "Srinagar", lat: 17.724, lng: 83.295, slug: "srinagar" },
  { name: "Nad Junction", lat: 17.728, lng: 83.318, slug: "nad" },
] as const;

const VIZAG_CENTER = { lat: 17.7312, lng: 83.3013 };
const DEFAULT_ZOOM = 12;

function getZoneForArea(areaName: string, zones: LocationZone[]): "red" | "orange" | "green" {
  const lower = areaName.toLowerCase();
  for (const z of zones) {
    const loc = (z.location || "").toLowerCase();
    if (loc.includes(lower) || lower.includes(loc) || areaName.toLowerCase().includes(loc)) return z.zone;
  }
  // Match by slug
  const area = VIZAG_AREAS.find((a) => lower.includes(a.slug) || a.slug.includes(lower));
  if (area) {
    const found = zones.find((z) => (z.location || "").toLowerCase().includes(area.slug));
    if (found) return found.zone;
  }
  return "green";
}

function getCountForArea(areaName: string, zones: LocationZone[]): number {
  const lower = areaName.toLowerCase();
  const area = VIZAG_AREAS.find((a) => a.name.toLowerCase() === lower || lower.includes(a.slug));
  if (!area) return 0;
  for (const z of zones) {
    const loc = (z.location || "").toLowerCase();
    if (loc.includes(area.slug) || loc.includes(area.name.toLowerCase())) return z.count;
  }
  return 0;
}

export default function VizagMap({ locationZones = [] }: { locationZones?: LocationZone[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ remove: () => void } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    setMapError(null);
    let mounted = true;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
    import("leaflet")
      .then((mod) => {
        const L = mod.default;
        if (!mounted || !containerRef.current) return;
        initMap(L);
      })
      .catch((err) => {
        if (mounted) setMapError(err?.message || "Map failed to load");
      });
    return () => {
      mounted = false;
      link.remove();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [locationZones]);

  function initMap(L: typeof import("leaflet")) {
    if (!containerRef.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current).setView([VIZAG_CENTER.lat, VIZAG_CENTER.lng], DEFAULT_ZOOM);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    const zoneColors = { red: "#ef4444", orange: "#f59e0b", green: "#94a3b8" };

    VIZAG_AREAS.forEach((area) => {
      const zone = getZoneForArea(area.name, locationZones);
      const count = getCountForArea(area.name, locationZones) || 0;
      const color = zoneColors[zone];
      const circle = L.circle([area.lat, area.lng], {
        radius: 800,
        color,
        fillColor: color,
        fillOpacity: 0.45,
        weight: 2,
      })
        .addTo(map)
        .bindTooltip(`${area.name}: ${count} complaint${count !== 1 ? "s" : ""} (${zone})`, {
          permanent: false,
          direction: "top",
        });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }

  if (mapError) {
    return (
      <div className="flex h-[340px] items-center justify-center rounded-xl border border-white/10 bg-slate-800/50 text-slate-400">
        Map unavailable: {mapError}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-800/50">
      <div ref={containerRef} className="h-[340px] w-full" />
    </div>
  );
}
