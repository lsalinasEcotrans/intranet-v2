"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import type { Pasajero } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { AddPasajeroDialog } from "./add-pasajero-dialog";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  Search,
  Filter,
  X,
  RefreshCw,
  MoreHorizontal,
  Pencil,
  Trash2,
  MapPin,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Constantes ───────────────────────────────────────────────────────────────
const POLLING_INTERVAL_MS = 30_000; // 30 segundos
const API_BASE = "https://ecotrans-pasajero-370980788525.europe-west1.run.app";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatHora(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function formatTurno(turno: string) {
  if (turno === "TurnoH") return "Turno H";
  if (turno === "4x4") return "Turno 4x4";
  if (turno === "7x7") return "Turno 7x7";
  return turno;
}

function formatUltimaActualizacion(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────
type ColumnKey =
  | "id_info"
  | "rut"
  | "nombre"
  | "contacto"
  | "rol"
  | "turno"
  | "grupo_numero"
  | "direccion_origen"
  | "centro_costo"
  | "direccion_destino"
  | "hora_programada";

interface ColumnDef {
  key: ColumnKey;
  label: string;
  format?: (value: unknown, row: Pasajero) => string;
}

interface EstadoSemana {
  total_usuarios: number;
  total_respondieron: number;
  faltantes: number;
  total_grupos: number;
  grupos_completos: number;
  usuarios: { auth_id: number; respondio: boolean }[];
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function getCellText(col: ColumnDef, row: Pasajero): string {
  const value = row[col.key];
  if (col.format) return col.format(value, row);
  return String(value ?? "");
}

function ColumnFilterPopover({
  column,
  value,
  onChange,
}: {
  column: ColumnDef;
  value: string;
  onChange: (val: string) => void;
}) {
  const hasFilter = value.length > 0;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`ml-1 inline-flex items-center justify-center rounded p-0.5 transition-colors hover:bg-accent ${
            hasFilter ? "text-primary" : "text-muted-foreground/50"
          }`}
          aria-label={`Filtrar por ${column.label}`}
        >
          <Filter className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            Filtrar por {column.label}
          </p>
          <div className="relative">
            <Input
              placeholder={`Buscar ${column.label.toLowerCase()}...`}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-8 pr-8 text-xs"
            />
            {hasFilter && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  total,
  colorClass,
  barColorClass,
  footer,
}: {
  label: string;
  value: number;
  total?: number;
  colorClass: string;
  barColorClass?: string;
  footer?: React.ReactNode;
}) {
  const pct = total && total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="rounded-lg border bg-card p-4 sm:p-5 flex flex-col gap-2 min-h-[110px]">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <div className="flex items-end gap-2">
        <span className={`text-3xl font-bold ${colorClass}`}>{value}</span>
        {total !== undefined && (
          <span className="text-lg text-muted-foreground mb-0.5">
            / {total}
          </span>
        )}
      </div>
      {barColorClass && total !== undefined && (
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full ${barColorClass} transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {footer && <p className="text-xs text-muted-foreground">{footer}</p>}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function PasajerosTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estado tabla
  const [data, setData] = useState<Pasajero[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [globalSearch, setGlobalSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<ColumnKey, string>>
  >({});
  const turnoFromUrl = searchParams.get("turno");
  const [turnoFiltro, setTurnoFiltro] = useState<string | null>(turnoFromUrl);

  // Estado eliminación
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Estado KPIs
  const [estadoSemana, setEstadoSemana] = useState<EstadoSemana | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(
    null,
  );
  const [kpiRefreshing, setKpiRefreshing] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetches ────────────────────────────────────────────────────────────────
  const fetchPasajeros = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = turnoFiltro
        ? `/api/pasajeros?turno=${turnoFiltro}`
        : "/api/pasajeros";
      const res = await axios.get<Pasajero[]>(url);
      setData(res.data);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response
          ? `Error ${err.response.status}: ${err.response.statusText}`
          : "Error al cargar los datos";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [turnoFiltro]);

  const fetchEstadoSemana = useCallback(async (showSpinner = false) => {
    if (showSpinner) setKpiRefreshing(true);
    try {
      const res = await axios.get<EstadoSemana>(
        `${API_BASE}/tmp-reservas/estado-semana`,
      );
      setEstadoSemana(res.data);
      setUltimaActualizacion(new Date());
    } catch {
      // silencioso
    } finally {
      if (showSpinner) setKpiRefreshing(false);
    }
  }, []);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await axios.delete(`/api/pasajeros/${deletingId}`);
      await fetchPasajeros();
    } catch {
      // maneja error si quieres
    } finally {
      setDeletingId(null);
      setConfirmOpen(false);
    }
  };

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const turno = searchParams.get("turno");
    setTurnoFiltro(turno);
  }, [searchParams]);

  useEffect(() => {
    fetchPasajeros();
  }, [fetchPasajeros]);

  // Polling KPIs — solo cuando el turno es TurnoH
  useEffect(() => {
    if (turnoFiltro !== "TurnoH") {
      setEstadoSemana(null);
      return;
    }

    // Fetch inicial
    fetchEstadoSemana(true);

    // Polling cada 30s
    pollingRef.current = setInterval(() => {
      fetchEstadoSemana(false);
    }, POLLING_INTERVAL_MS);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [turnoFiltro, fetchEstadoSemana]);

  // ── Memo ───────────────────────────────────────────────────────────────────
  const respondieronSet = useMemo(() => {
    if (!estadoSemana) return new Set<number>();
    return new Set(
      estadoSemana.usuarios.filter((u) => u.respondio).map((u) => u.auth_id),
    );
  }, [estadoSemana]);

  const setColumnFilter = useCallback((key: ColumnKey, value: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (value === "") delete next[key];
      else next[key] = value;
      return next;
    });
    setCurrentPage(1);
  }, []);

  const activeFilterCount = Object.keys(columnFilters).length;

  const clearAllFilters = useCallback(() => {
    setColumnFilters({});
    setGlobalSearch("");
    setCurrentPage(1);
  }, []);

  const visibleColumns: ColumnDef[] = useMemo(() => {
    const baseColumns: ColumnDef[] = [
      { key: "rut", label: "Rut" },
      { key: "nombre", label: "Nombre" },
      { key: "contacto", label: "Contacto" },
      { key: "rol", label: "Rol" },
      { key: "turno", label: "Turno" },
      { key: "grupo_numero", label: "Grupo" },
      { key: "centro_costo", label: "CC" },
      { key: "direccion_origen", label: "Origen" },
      { key: "direccion_destino", label: "Destino" },
      {
        key: "hora_programada",
        label: "Hora",
        format: (v) => formatHora(v as number),
      },
    ];

    const columnasAocultarPorTurno: Record<string, ColumnKey[]> = {
      "4x4": ["grupo_numero"],
      "7x7": ["centro_costo", "direccion_destino"],
      TurnoH: [],
    };

    const columnasAocultar =
      columnasAocultarPorTurno[turnoFiltro || "TurnoH"] || [];

    return baseColumns.filter((col) => !columnasAocultar.includes(col.key));
  }, [turnoFiltro]);

  const filteredData = useMemo(() => {
    const globalTerm = globalSearch.toLowerCase().trim();
    return data.filter((row) => {
      if (globalTerm) {
        const matchesGlobal = visibleColumns.some((col) =>
          getCellText(col, row).toLowerCase().includes(globalTerm),
        );
        if (!matchesGlobal) return false;
      }
      for (const [key, filterValue] of Object.entries(columnFilters)) {
        if (!filterValue) continue;
        const col = visibleColumns.find((c) => c.key === key);
        if (!col) continue;
        if (
          !getCellText(col, row)
            .toLowerCase()
            .includes(filterValue.toLowerCase())
        )
          return false;
      }
      return true;
    });
  }, [data, globalSearch, columnFilters, visibleColumns]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + rowsPerPage,
  );

  function goToPage(page: number) {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Pasajeros</h1>
          <div className="flex flex-wrap items-center gap-2">
            {(["TurnoH", "4x4", "7x7"] as const).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={turnoFiltro === t ? "default" : "outline"}
                onClick={() =>
                  router.push(
                    `/dashboard/mantenedor/angloamerican/turno?turno=${t}`,
                  )
                }
              >
                {formatTurno(t)}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <AddPasajeroDialog onSuccess={fetchPasajeros} />
          <Button
            variant="outline"
            onClick={() =>
              router.push("/dashboard/mantenedor/angloamerican/CargarPasajeros")
            }
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            <span className="hidden xs:inline">Procesar Excel</span>
            <span className="xs:hidden">Excel</span>
          </Button>
        </div>
      </div>

      {/* ── KPI Cards — solo TurnoH ── */}
      {turnoFiltro === "TurnoH" && (
        <>
          {/* Barra de estado de polling */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Resumen semana actual
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {kpiRefreshing ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Actualizando…</span>
                </>
              ) : ultimaActualizacion ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span>
                    Actualizado{" "}
                    <span className="font-medium tabular-nums">
                      {formatUltimaActualizacion(ultimaActualizacion)}
                    </span>
                  </span>
                  <span className="text-muted-foreground/50">·</span>
                  <Clock className="h-3 w-3" />
                  <span>Auto-refresh 30s</span>
                </>
              ) : null}
            </div>
          </div>

          {estadoSemana ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard
                label="Usuarios respondieron"
                value={estadoSemana.total_respondieron}
                total={estadoSemana.total_usuarios}
                colorClass="text-emerald-600"
                barColorClass="bg-emerald-500"
              />
              <KpiCard
                label="Grupos completos"
                value={estadoSemana.grupos_completos}
                total={estadoSemana.total_grupos}
                colorClass="text-sky-600"
                barColorClass="bg-sky-500"
              />
              <KpiCard
                label="Usuarios faltantes"
                value={estadoSemana.faltantes}
                colorClass={
                  estadoSemana.faltantes === 0
                    ? "text-emerald-600"
                    : "text-rose-600"
                }
                footer={
                  estadoSemana.faltantes === 0
                    ? "✅ Todos respondieron esta semana"
                    : "Aún no han registrado su reserva"
                }
              />
            </div>
          ) : (
            /* Skeleton mientras carga la primera vez */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border bg-card p-4 sm:p-5 min-h-[110px] flex flex-col gap-3"
                >
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Search bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar en todos los campos..."
            value={globalSearch}
            onChange={(e) => {
              setGlobalSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
          {globalSearch && (
            <button
              type="button"
              onClick={() => {
                setGlobalSearch("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {(activeFilterCount > 0 || globalSearch) && (
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {activeFilterCount} filtro{activeFilterCount > 1 ? "s" : ""}{" "}
                activo{activeFilterCount > 1 ? "s" : ""}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="mr-1 h-3 w-3" />
              Limpiar filtros
            </Button>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={fetchPasajeros}
          disabled={isLoading}
          className="h-9 bg-transparent"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refrescar
        </Button>
      </div>

      {/* ── Table ── */}
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {visibleColumns.map((col) => (
                <TableHead key={col.key} className="font-semibold">
                  <div className="flex items-center">
                    <span>{col.label}</span>
                    <ColumnFilterPopover
                      column={col}
                      value={columnFilters[col.key] ?? ""}
                      onChange={(val) => setColumnFilter(col.key, val)}
                    />
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-[30px] text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {visibleColumns.map((col) => (
                    <TableCell key={`skeleton-cell-${i}-${col.key}`}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + 1}
                  className="h-24 text-center text-destructive"
                >
                  {error}
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + 1}
                  className="h-24 text-center text-muted-foreground"
                >
                  {globalSearch || activeFilterCount > 0
                    ? "No se encontraron resultados con los filtros aplicados."
                    : "No se encontraron pasajeros."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((p) => (
                <TableRow
                  key={p.id_info}
                  className={
                    turnoFiltro === "TurnoH" && respondieronSet.has(p.auth_id)
                      ? "bg-emerald-200 dark:bg-emerald-950/20"
                      : ""
                  }
                >
                  <TableCell>{p.rut}</TableCell>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell>{p.contacto}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {p.rol}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                      {formatTurno(p.turno)}
                    </Badge>
                  </TableCell>
                  {turnoFiltro !== "4x4" && (
                    <TableCell>{p.grupo_numero}</TableCell>
                  )}
                  <TableCell>{p.centro_costo}</TableCell>
                  <TableCell className="max-w-160px truncate">
                    {p.direccion_origen}
                  </TableCell>
                  <TableCell className="max-w-160px truncate">
                    {p.direccion_destino}
                  </TableCell>
                  <TableCell>{formatHora(p.hora_programada)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Acciones</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/dashboard/mantenedor/angloamerican/${p.auth_id}`,
                            )
                          }
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/dashboard/mantenedor/angloamerican/viajes/${p.auth_id}`,
                            )
                          }
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          Modificar viajes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setDeletingId(p.auth_id);
                            setConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Filas por página:</span>
          <Select
            value={String(rowsPerPage)}
            onValueChange={(value) => {
              setRowsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground text-center sm:text-left">
            Pág. {currentPage}/{totalPages}{" "}
            <span className="hidden sm:inline">
              ({filteredData.length}
              {filteredData.length !== data.length
                ? ` de ${data.length} `
                : " "}
              registros)
            </span>
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
              <span className="sr-only">Primera página</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Página anterior</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Página siguiente</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
              <span className="sr-only">Última página</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Alert eliminación ── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pasajero?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará al pasajero del sistema. Podrá ser
              reactivado posteriormente si es necesario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingId(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
