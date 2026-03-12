"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapPreviewProps {
  lat: number | null;
  lng: number | null;
  label?: string;
  color?: "emerald" | "blue";
}

export default function MapPreview({
  lat,
  lng,
  label,
  color = "emerald",
}: MapPreviewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialLat = lat ?? -33.4489;
    const initialLng = lng ?? -70.6693;

    mapRef.current = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: lat ? 15 : 11,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || lat === null || lng === null) return;

    if (markerRef.current) {
      markerRef.current.remove();
    }

    markerRef.current = L.marker([lat, lng])
      .addTo(mapRef.current)
      .bindPopup(label ?? "Ubicación", { closeButton: false })
      .openPopup();

    mapRef.current.flyTo([lat, lng], 15, { duration: 1.2 });
  }, [lat, lng, label]);

  const overlayColor =
    color === "emerald" ? "text-emerald-400" : "text-blue-400";

  return (
    <div className="relative h-full w-full overflow-hidden rounded-b-xl">
      <div ref={containerRef} className="h-full w-full" />
      {lat === null && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/70 backdrop-blur-sm pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-10 w-10 ${overlayColor} opacity-50`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <p className="text-xs text-muted-foreground font-medium text-center px-6 leading-relaxed">
            Selecciona una dirección para ver la ubicación en el mapa
          </p>
        </div>
      )}
    </div>
  );
}
