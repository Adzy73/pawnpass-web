"use client";

import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

interface Locker {
  id: string;
  name: string;
  address: string;
  distance_km?: number;
  distance?: number;
  lat?: number;
  lng?: number;
  hours?: string;
  max_dimensions?: string;
  max_weight?: string;
}

interface LockerMapProps {
  lockers: Locker[];
  selectedLocker: Locker | null;
  onSelectLocker: (locker: Locker) => void;
}

export default function LockerMap({ lockers, selectedLocker, onSelectLocker }: LockerMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  useEffect(() => {
    if (!token || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = token;

    const center: [number, number] = lockers[0]
      ? [lockers[0].lng || 138.612, lockers[0].lat || -34.889]
      : [138.6120, -34.8886];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom: 13,
    });

    map.current.on("load", () => {
      const newMarkers: mapboxgl.Marker[] = [];
      lockers.forEach((locker) => {
        const el = document.createElement("div");
        el.style.cssText = `
          width: 32px; height: 32px; border-radius: 50% 50% 50% 0;
          background: #FF6B00; border: 2px solid rgba(255,255,255,0.3);
          transform: rotate(-45deg); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        `;
        el.innerHTML = `<span style="transform: rotate(45deg); font-size: 14px;">📦</span>`;
        el.addEventListener("click", () => onSelectLocker(locker));

        const marker = new mapboxgl.Marker(el)
          .setLngLat([locker.lng || 138.612, locker.lat || -34.889])
          .addTo(map.current!);
        newMarkers.push(marker);
      });
      setMarkers(newMarkers);
    });
  }, [token, lockers, onSelectLocker]);

  // Update selected marker
  useEffect(() => {
    markers.forEach((m, i) => {
      const el = m.getElement();
      if (lockers[i]) {
        el.style.border = selectedLocker?.id === lockers[i].id
          ? "2px solid #fff"
          : "2px solid rgba(255,255,255,0.3)";
        el.style.background = "#FF6B00";
      }
    });
  }, [selectedLocker, markers, lockers]);

  if (!token) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-sm text-gray-500">Map unavailable — Mapbox token not configured.</p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className="w-full rounded-xl overflow-hidden"
      style={{ height: "320px", border: "1px solid rgba(255,255,255,0.08)" }}
    />
  );
}
