"use client";

import { useEffect, useRef, useState } from "react";

// Office (start), Incident Spot (destination), Worker (current) - small region
const OFFICE = { lat: 17.7312, lng: 83.298 };
const INCIDENT_SPOT = { lat: 17.735, lng: 83.308 };
const WORKER_CURRENT = { lat: 17.7325, lng: 83.303 }; // en route
const MAP_CENTER = { lat: 17.733, lng: 83.303 };
const ZOOM = 15; // small region, zoomed in

function createCustomIcon(emoji: string, label: string) {
  return (L: typeof import("leaflet")) => {
    return L.divIcon({
      html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
        <div style="width:28px;height:28px;border-radius:50%;border:2px solid #94a3b8;background:#334155;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 0 10px rgba(192,192,192,0.4)">${emoji}</div>
        <span style="white-space:nowrap;padding:2px 6px;font-size:10px;font-weight:600;color:#fff;background:rgba(0,0,0,0.8);border-radius:4px;text-shadow:0 0 4px rgba(192,192,192,0.3)">${label}</span>
      </div>`,
      className: "worker-map-marker",
      iconSize: [60, 48],
      iconAnchor: [30, 48],
    });
  };
}

export default function WorkerLiveMap() {
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
  }, []);

  function initMap(L: typeof import("leaflet")) {
    if (!containerRef.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      center: [MAP_CENTER.lat, MAP_CENTER.lng],
      zoom: ZOOM,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      zoomControl: true,
    });

    // Black/dark theme: roads, paths, streets on dark background
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap © CartoDB",
      maxZoom: 19,
    }).addTo(map);

    // Office (start)
    L.marker([OFFICE.lat, OFFICE.lng], {
      icon: createCustomIcon("🏢", "Office")(L),
    }).addTo(map);

    // Incident Spot (destination)
    L.marker([INCIDENT_SPOT.lat, INCIDENT_SPOT.lng], {
      icon: createCustomIcon("📍", "Incident Spot")(L),
    }).addTo(map);

    // Worker current location
    L.marker([WORKER_CURRENT.lat, WORKER_CURRENT.lng], {
      icon: createCustomIcon("👤", "Worker")(L),
    }).addTo(map);

    // Route line
    L.polyline(
      [
        [OFFICE.lat, OFFICE.lng],
        [WORKER_CURRENT.lat, WORKER_CURRENT.lng],
        [INCIDENT_SPOT.lat, INCIDENT_SPOT.lng],
      ],
      {
        color: "#94a3b8",
        weight: 3,
        opacity: 0.7,
        dashArray: "8, 8",
      }
    ).addTo(map);

    mapRef.current = map;

    // Fix empty map: ensure tiles load after container is laid out
    requestAnimationFrame(() => {
      map?.invalidateSize();
    });
  }

  if (mapError) {
    return (
      <div className="flex h-[340px] items-center justify-center rounded-xl border border-white/10 bg-slate-800/50 text-slate-400 text-sm">
        Map unavailable: {mapError}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/80" style={{ boxShadow: "0 0 12px rgba(0,0,0,0.5)" }}>
      <div ref={containerRef} className="h-[340px] w-full" />
    </div>
  );
}
