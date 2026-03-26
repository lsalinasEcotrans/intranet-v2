"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface Vehicle {
  id: number;
  callsign?: string;
  make?: string;
  model?: string;
  isActive?: boolean;
  isSuspended?: boolean;
}

export default function FlotaPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [clientLastUpdate, setClientLastUpdate] = useState<string>("");

  const fetchVehicles = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);

      const response = await fetch("/api/ghost/vehicles");
      if (!response.ok) throw new Error("Error al obtener vehículos");

      const data = await response.json();
      setVehicles(Array.isArray(data) ? data : [data]);

      setClientLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // polling cada 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchVehicles(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchVehicles]);

  const handleRefresh = () => {
    fetchVehicles(true);
  };

  // solo activos
  const activeVehicles = useMemo(() => {
    return vehicles.filter(
      (v) => v.isActive === true && v.isSuspended === false,
    );
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    let filtered = activeVehicles.filter((vehicle) => {
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch =
        vehicle.callsign?.toLowerCase().includes(searchLower) ||
        vehicle.make?.toLowerCase().includes(searchLower) ||
        vehicle.model?.toLowerCase().includes(searchLower);

      // ocultar rangos
      const isInHiddenRanges = (callsign?: string) => {
        if (!callsign) return false;
        const num = parseInt(callsign, 10);
        if (isNaN(num)) return false;

        return (
          (num >= 600 && num <= 699) ||
          (num >= 900 && num <= 999) ||
          (num >= 1000 && num <= 9999)
        );
      };

      return matchesSearch && !isInHiddenRanges(vehicle.callsign);
    });

    // ordenar por callsign
    filtered.sort((a, b) => {
      const aNum = parseInt(a.callsign || "0", 10);
      const bNum = parseInt(b.callsign || "0", 10);
      return aNum - bNum;
    });

    return filtered;
  }, [activeVehicles, searchTerm]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Flota (Base)</h1>
        <p className="text-gray-600 mt-2">
          Total vehículos: {filteredVehicles.length}
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Buscar por callsign, marca o modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />

            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            Última actualización: {clientLastUpdate || "Cargando..."}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!loading && !error && filteredVehicles.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No se encontraron vehículos
          </div>
        )}

        {!loading && !error && filteredVehicles.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center justify-center h-20 rounded-xl border bg-white shadow-sm hover:shadow-md transition"
              >
                <span className="text-lg font-bold">{vehicle.callsign}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
