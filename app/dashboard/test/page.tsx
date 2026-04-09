"use client";

import { useState } from "react";

export default function TestBookings() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/ghost/bookings/search", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Error en la petición");
      }

      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <button
        onClick={handleFetch}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? "Cargando..." : "Probar API Bookings"}
      </button>

      {error && <div className="text-red-600">{error}</div>}

      {data && (
        <pre className="text-xs bg-black text-green-400 p-4 rounded max-h-[500px] overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
