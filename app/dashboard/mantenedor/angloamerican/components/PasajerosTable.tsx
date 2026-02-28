"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Agrega estos imports
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

function formatHora(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

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

export function PasajerosTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // Agrega este estado en PasajerosTable
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  useEffect(() => {
    const turno = searchParams.get("turno");
    setTurnoFiltro(turno);
  }, [searchParams]);

  useEffect(() => {
    fetchPasajeros();
  }, [fetchPasajeros]);

  const setColumnFilter = useCallback((key: ColumnKey, value: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (value === "") {
        delete next[key];
      } else {
        next[key] = value;
      }
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

    // Define columnas a ocultar según el turno
    const columnasAocultarPorTurno: Record<string, ColumnKey[]> = {
      "4x4": ["grupo_numero"], // ocultar Grupo y Origen
      "7x7": ["centro_costo", "direccion_destino"], // ocultar CC y Destino
      TurnoH: [], // no ocultar nada
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
        const cellText = getCellText(col, row).toLowerCase();
        if (!cellText.includes(filterValue.toLowerCase())) return false;
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

  function formatTurno(turno: string) {
    if (turno === "TurnoH") return "Turno H";
    if (turno === "4x4") return "Turno 4x4";
    if (turno === "7x7") return "Turno 7x7";
    return turno;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Lado izquierdo */}
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Pasajeros</h1>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={turnoFiltro === "TurnoH" ? "default" : "outline"}
              onClick={() =>
                router.push(
                  "/dashboard/mantenedor/angloamerican/turno?turno=TurnoH",
                )
              }
            >
              Turno H
            </Button>

            <Button
              size="sm"
              variant={turnoFiltro === "4x4" ? "default" : "outline"}
              onClick={() =>
                router.push(
                  "/dashboard/mantenedor/angloamerican/turno?turno=4x4",
                )
              }
            >
              4x4
            </Button>

            <Button
              size="sm"
              variant={turnoFiltro === "7x7" ? "default" : "outline"}
              onClick={() =>
                router.push(
                  "/dashboard/mantenedor/angloamerican/turno?turno=7x7",
                )
              }
            >
              7x7
            </Button>
          </div>
        </div>

        {/* Lado derecho */}
        <div className="flex items-center gap-3">
          <AddPasajeroDialog onSuccess={fetchPasajeros} />

          <Button
            variant="outline"
            onClick={() =>
              router.push("/dashboard/mantenedor/angloamerican/CargarPasajeros")
            }
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Procesar Excel
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
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

      {/* Table */}
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
                  colSpan={visibleColumns.length}
                  className="h-24 text-center text-destructive"
                >
                  {error}
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {globalSearch || activeFilterCount > 0
                    ? "No se encontraron resultados con los filtros aplicados."
                    : "No se encontraron pasajeros."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((p) => (
                <TableRow key={p.id_info}>
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
                  <TableCell className="max-w-[160px] truncate">
                    {p.direccion_origen}
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate">
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
                              `/dashboard/mantenedor/angloamerican/${p.id_info}`,
                            )
                          }
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/dashboard/mantenedor/angloamerican/viajes/${p.id_info}`,
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
                            setDeletingId(p.id_info);
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

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Filas por pagina:</span>
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
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Pagina {currentPage} de {totalPages} ({filteredData.length}{" "}
            {filteredData.length !== data.length ? `de ${data.length} ` : ""}
            registros)
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
              <span className="sr-only">Primera pagina</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Pagina anterior</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Pagina siguiente</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
              <span className="sr-only">Ultima pagina</span>
            </Button>
          </div>
        </div>
      </div>
      {/* Dialog de Alerta de eliminación */}
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
