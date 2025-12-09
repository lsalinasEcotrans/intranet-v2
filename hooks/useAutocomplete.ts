// /app/hooks/useAutocomplete.ts
"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export function useAutocomplete(text: string) {
  const [results, setResults] = useState<
    {
      address: string;
      text: string;
      lat?: number;
      lng?: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!text || text.length < 3) {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setLoading(true);

      try {
        const res = await axios.get("/api/autocomplete", {
          params: { companyID: 1, text },
        });

        // console.log("🔎 API RAW:", res.data);

        const raw = res.data?.searchResults || [];

        // Normalizar los resultados
        const normalized = raw.map((item: any) => {
          // Cuando viene fullAddress -> formato tipo 2
          if (item.fullAddress?.coordinate) {
            return {
              text: item.address,
              lat: item.fullAddress.coordinate.latitude,
              lng: item.fullAddress.coordinate.longitude,
            };
          }

          // Cuando viene solo address + placeID -> formato tipo 1
          return {
            text: item.address,
            lat: null,
            lng: null,
          };
        });

        // console.log("✨ Normalizado:", normalized);

        setResults(normalized);
      } catch (e: any) {
        console.error("❌ Autocomplete error:", e.response?.data || e);
      }

      setLoading(false);
    }, 300);

    return () => clearTimeout(delay);
  }, [text]);

  return { results, loading };
}
