"use client";

import { useEffect, useState, useCallback } from "react";
import NuevaInspeccionDialog from "./components/NuevaInspeccionDialog";
import InspeccionesTable from "./components/InspeccionesTable";
import DatePickerCalendar from "./components/Datepickercalendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCcw } from "lucide-react";
import ExportarInspeccionesDialog from "./components/ExportarInspeccionesDialog";

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

const AUTO_REFRESH_INTERVAL = 30_000; // 30 segundos

export default function InspeccionesPage() {
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Filtros
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<string>("todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Filtros aplicados (se usan para las búsquedas)
  const [filtroAplicado, setFiltroAplicado] = useState({
    search: "",
    estado: "todos",
    fechaDesde: "",
    fechaHasta: "",
  });

  const fetchInspecciones = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          page_size: String(pageSize),
          ...(filtroAplicado.search && { search: filtroAplicado.search }),
          ...(filtroAplicado.estado !== "todos" && {
            estado: filtroAplicado.estado,
          }),
          ...(filtroAplicado.fechaDesde && {
            fecha_desde: filtroAplicado.fechaDesde,
          }),
          ...(filtroAplicado.fechaHasta && {
            fecha_hasta: filtroAplicado.fechaHasta,
          }),
        });
        const res = await fetch(`/api/inspecciones?${params}`);
        if (!res.ok) throw new Error("Error al cargar inspecciones");
        const data = await res.json();
        setInspecciones(data.items);
        setTotal(data.total);
        setLastRefresh(new Date());
      } catch (err) {
        console.error(err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [page, pageSize, filtroAplicado],
  );

  // Carga inicial y cuando cambian filtros/página
  useEffect(() => {
    fetchInspecciones();
  }, [fetchInspecciones]);

  // Auto-refresh silencioso cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchInspecciones(true);
    }, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchInspecciones]);

  const handleSearch = () => {
    setPage(1);
    setFiltroAplicado({
      search,
      estado,
      fechaDesde,
      fechaHasta,
    });
  };

  const handleReset = () => {
    setSearch("");
    setEstado("todos");
    setFechaDesde("");
    setFechaHasta("");
    setPage(1);
    setFiltroAplicado({
      search: "",
      estado: "todos",
      fechaDesde: "",
      fechaHasta: "",
    });
  };

  const totalPages = Math.ceil(total / pageSize);
  const desde = (page - 1) * pageSize + 1;
  const hasta = Math.min(page * pageSize, total);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inspecciones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            <span className="font-semibold text-foreground">{total}</span>{" "}
            registro{total !== 1 ? "s" : ""} total
            {inspecciones.length > 0 && (
              <>
                <span className="mx-2">·</span>
                Mostrando{" "}
                <span className="font-semibold text-foreground">
                  {desde}-{hasta}
                </span>{" "}
                de {total}
              </>
            )}
            <span className="ml-2 opacity-50 text-xs">
              · Actualizado{" "}
              {lastRefresh.toLocaleTimeString("es-CL", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportarInspeccionesDialog />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchInspecciones()}
          >
            <RefreshCcw className="w-4 h-4" /> Actualizar
          </Button>
          <NuevaInspeccionDialog />
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
            {/* Búsqueda - ancho completo en móvil, 2 columnas en desktop */}
            <div className="lg:col-span-2 space-y-1">
              <Label className="text-xs font-semibold">Buscar</Label>
              <Input
                placeholder="Patente, conductor, N° móvil..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full"
              />
            </div>

            {/* Estado */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha Desde */}
            <div className="space-y-1">
              <DatePickerCalendar
                label="Desde"
                value={fechaDesde}
                onChange={setFechaDesde}
                placeholder="Seleccionar"
              />
            </div>

            {/* Fecha Hasta */}
            <div className="space-y-1">
              <DatePickerCalendar
                label="Hasta"
                value={fechaHasta}
                onChange={setFechaHasta}
                placeholder="Seleccionar"
              />
            </div>

            <div className="space-y-1 flex gap-2">
              <Button size="sm" onClick={handleSearch} className="gap-2">
                <span>Buscar</span>
              </Button>
              <Button size="sm" variant="outline" onClick={handleReset}>
                Limpiar filtros
              </Button>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <Label className="text-xs font-semibold whitespace-nowrap">
              Registros por página:
            </Label>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                setPageSize(parseInt(val));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Indicador de filtros activos */}
          {(filtroAplicado.search ||
            filtroAplicado.estado !== "todos" ||
            filtroAplicado.fechaDesde ||
            filtroAplicado.fechaHasta) && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                ✓ Filtros aplicados:
                {filtroAplicado.search && ` búsqueda`}
                {filtroAplicado.estado !== "todos" &&
                  ` estado: ${filtroAplicado.estado}`}
                {filtroAplicado.fechaDesde &&
                  ` desde ${filtroAplicado.fechaDesde}`}
                {filtroAplicado.fechaHasta &&
                  ` hasta ${filtroAplicado.fechaHasta}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla */}
      <InspeccionesTable
        inspecciones={inspecciones}
        loading={loading}
        onRefresh={() => fetchInspecciones()}
      />

      {/* Paginación y configuración */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30 rounded-lg p-4">
        {/* Registros por página */}
        <div className="flex items-center gap-3">
          <Label className="text-xs font-semibold whitespace-nowrap">
            Registros por página:
          </Label>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              setPageSize(parseInt(val));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
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
    </div>
  );
}
