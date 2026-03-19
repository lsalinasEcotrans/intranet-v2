"use client";

import { useEffect, useState, useCallback } from "react";
import NuevaInspeccionDialog from "./components/NuevaInspeccionDialog";
import InspeccionesTable from "./components/InspeccionesTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export interface Inspeccion {
  id: number;
  callsign: string | null;
  registration: string;
  make: string | null;
  model: string | null;
  year_manufacture: number | null;
  forename: string | null;
  surname: string | null;
  cpc_card_number: string | null;
  estado: "aprobado" | "rechazado";
  motivo_rechazo: string | null;
  fecha_creacion: string;
  fecha_proxima: string;
  datos_vehiculo: Record<string, any> | null;
  datos_conductor: Record<string, any> | null;
  datos_inspeccion: Record<string, any> | null;
}

export default function InspeccionesPage() {
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Filtros
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<string>("todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const fetchInspecciones = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
        ...(search && { search }),
        ...(estado !== "todos" && { estado }),
        ...(fechaDesde && { fecha_desde: fechaDesde }),
        ...(fechaHasta && { fecha_hasta: fechaHasta }),
      });
      const res = await fetch(`/api/inspecciones?${params}`);
      if (!res.ok) throw new Error("Error al cargar inspecciones");
      const data = await res.json();
      setInspecciones(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, estado, fechaDesde, fechaHasta]);

  useEffect(() => {
    fetchInspecciones();
  }, [fetchInspecciones]);

  const handleSearch = () => {
    setPage(1);
    fetchInspecciones();
  };

  const handleReset = () => {
    setSearch("");
    setEstado("todos");
    setFechaDesde("");
    setFechaHasta("");
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inspecciones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} registro{total !== 1 ? "s" : ""} encontrado
            {total !== 1 ? "s" : ""}
          </p>
        </div>
        <NuevaInspeccionDialog />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            {/* Búsqueda libre */}
            <div className="lg:col-span-2 space-y-1">
              <Label className="text-xs">Buscar</Label>
              <Input
                placeholder="Patente, conductor, N° móvil..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            {/* Estado */}
            <div className="space-y-1">
              <Label className="text-xs">Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rango de fechas */}
            <div className="space-y-1">
              <Label className="text-xs">Desde</Label>
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hasta</Label>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
          </div>

          {/* Acciones filtro */}
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleSearch}>
              Buscar
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset}>
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <InspeccionesTable
        inspecciones={inspecciones}
        loading={loading}
        onRefresh={fetchInspecciones}
      />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
