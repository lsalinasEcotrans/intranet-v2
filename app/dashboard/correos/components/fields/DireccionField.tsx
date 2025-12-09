"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import axios from "axios";

interface AutocompleteItem {
  address: string;
  fullAddress?: {
    text: string;
    coordinate: {
      latitude: number;
      longitude: number;
    };
  } | null;
  placeID?: string | null;
}

interface Props {
  label: string;
  initialValue?: string;
  onSelect: (item: { text: string; lat: number; lng: number }) => void;
}

export default function DireccionField({
  label,
  initialValue,
  onSelect,
}: Props) {
  const [query, setQuery] = useState(initialValue ?? "");
  const [results, setResults] = useState<AutocompleteItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(text: string) {
    setQuery(text);
    if (!text || text.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get("/api/autocomplete", {
        params: { companyID: 1, text },
        withCredentials: true, // para token httponly
      });

      setResults(res.data?.searchResults || []);
    } catch (error) {
      console.error("Autocomplete error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(item: AutocompleteItem) {
    let lat = 0;
    let lng = 0;
    let text = item.address;

    // Si viene fullAddress, usamos lat/lng directo
    if (item.fullAddress?.coordinate) {
      lat = item.fullAddress.coordinate.latitude;
      lng = item.fullAddress.coordinate.longitude;
      text = item.fullAddress.text ?? item.address;
    }
    // Si viene solo placeID, llamamos segunda API
    else if (item.placeID) {
      try {
        const res = await axios.get("/api/autocomplete/details", {
          params: { placeID: item.placeID },
          withCredentials: true,
        });
        const data = res.data;
        lat = data.coordinate?.latitude ?? 0;
        lng = data.coordinate?.longitude ?? 0;
        text = data.text ?? item.address;
      } catch (error) {
        console.error("Place API error:", error);
      }
    }

    setQuery(text); // mostrar selección en input
    setResults([]); // cerrar lista
    onSelect({ text, lat, lng });
  }

  return (
    <div className="space-y-2 relative">
      <label className="text-sm font-medium">{label}</label>

      <Input
        value={query ?? ""}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={`Ingresa ${label.toLowerCase()}...`}
      />

      {/* Lista de resultados */}
      {query.length >= 3 && (loading || results.length > 0) && (
        <Card className="absolute z-50 w-full left-0 top-full mt-1 p-2 shadow-lg max-h-60 overflow-auto bg-white">
          {loading && <p className="text-sm px-2 py-1">Buscando...</p>}

          {!loading && results.length === 0 && (
            <p className="text-sm px-2 py-1">Sin resultados</p>
          )}

          {!loading &&
            results.map((r, idx) => {
              const lat =
                r.fullAddress?.coordinate?.latitude ??
                (r.placeID ? undefined : 0);
              const lng =
                r.fullAddress?.coordinate?.longitude ??
                (r.placeID ? undefined : 0);

              return (
                <div
                  key={idx}
                  className="px-2 py-2 cursor-pointer rounded hover:bg-gray-100"
                  onClick={() => handleSelect(r)}
                >
                  <p className="text-sm font-medium">{r.address}</p>
                  {lat !== undefined && lng !== undefined && (
                    <p className="text-xs text-gray-500">
                      {lat}, {lng}
                    </p>
                  )}
                </div>
              );
            })}
        </Card>
      )}
    </div>
  );
}
