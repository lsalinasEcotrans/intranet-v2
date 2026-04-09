"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Inspeccion } from "../page";
import InspeccionDetalle from "./InspeccionDetalle";
import InspeccionEditar from "./InspeccionEditar";
import {
  CheckCircle,
  XCircle,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function EstadoBadge({ estado }: { estado: "aprobado" | "rechazado" }) {
  return (
    <Badge
      variant="outline"
      className={
        estado === "aprobado"
          ? "border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400"
          : "border-destructive/40 bg-destructive/10 text-destructive"
      }
    >
      {estado === "aprobado" ? (
        <>
          <CheckCircle className="w-4 h-4" />
          Aprobado
        </>
      ) : (
        <>
          <XCircle className="w-4 h-4" />
          Rechazado
        </>
      )}
    </Badge>
  );
}

type SortField =
  | "registration"
  | "make"
  | "forename"
  | "estado"
  | "fecha_creacion"
  | "fecha_proxima"
  | null;
type SortOrder = "asc" | "desc";

interface SortState {
  field: SortField;
  order: SortOrder;
}

function sortInspecciones(
  data: Inspeccion[],
  sortState: SortState,
): Inspeccion[] {
  if (!sortState.field) return data;

  const sorted = [...data].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortState.field) {
      case "registration":
        aVal = a.registration;
        bVal = b.registration;
        break;
      case "make":
        aVal = `${a.make || ""} ${a.model || ""}`.trim();
        bVal = `${b.make || ""} ${b.model || ""}`.trim();
        break;
      case "forename":
        aVal = `${a.forename || ""} ${a.surname || ""}`.trim();
        bVal = `${b.forename || ""} ${b.surname || ""}`.trim();
        break;
      case "estado":
        aVal = a.estado;
        bVal = b.estado;
        break;
      case "fecha_creacion":
        aVal = new Date(a.fecha_creacion).getTime();
        bVal = new Date(b.fecha_creacion).getTime();
        break;
      case "fecha_proxima":
        aVal = new Date(a.fecha_proxima).getTime();
        bVal = new Date(b.fecha_proxima).getTime();
        break;
      default:
        return 0;
    }

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
      return sortState.order === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (sortState.order === "asc") {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

  return sorted;
}

interface ColumnFilterProps {
  field: SortField;
  label: string;
  currentSort: SortState;
  onSort: (field: SortField, order: SortOrder) => void;
}

function ColumnFilter({
  field,
  label,
  currentSort,
  onSort,
}: ColumnFilterProps) {
  const isActive = currentSort.field === field;
  const icon =
    isActive && currentSort.order === "asc" ? (
      <ArrowUp className="w-3 h-3" />
    ) : isActive && currentSort.order === "desc" ? (
      <ArrowDown className="w-3 h-3" />
    ) : (
      <ArrowUpDown className="w-3 h-3 opacity-40" />
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-1.5 hover:bg-muted/50 rounded px-1.5 py-0.5 transition-colors">
          <span className="text-xs font-semibold uppercase tracking-wider">
            {label}
          </span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuItem
          onClick={() => onSort(field, "asc")}
          className="gap-2 cursor-pointer"
        >
          <ArrowUp className="w-4 h-4" />
          <span>Orden ascendente</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSort(field, "desc")}
          className="gap-2 cursor-pointer"
        >
          <ArrowDown className="w-4 h-4" />
          <span>Orden descendente</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onSort(null, "asc")}
          className="gap-2 cursor-pointer text-muted-foreground"
        >
          <span>Sin ordenar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function InspeccionesTable({
  inspecciones,
  loading,
  onRefresh,
}: {
  inspecciones: Inspeccion[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [detalle, setDetalle] = useState<Inspeccion | null>(null);
  const [editar, setEditar] = useState<Inspeccion | null>(null);
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    order: "asc",
  });

  const handleSort = (field: SortField, order: SortOrder) => {
    setSortState({ field, order });
  };

  const sortedInspecciones = sortInspecciones(inspecciones, sortState);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!inspecciones.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-4xl mb-3">
          <Search className="w-9 h-9" />
        </p>
        <p className="text-sm">No se encontraron inspecciones</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs">
                <ColumnFilter
                  field="registration"
                  label="Patente / Móvil"
                  currentSort={sortState}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-xs">
                <ColumnFilter
                  field="make"
                  label="Vehículo"
                  currentSort={sortState}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-xs">
                <ColumnFilter
                  field="forename"
                  label="Conductor"
                  currentSort={sortState}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Licencia
              </TableHead>
              <TableHead className="text-xs">
                <ColumnFilter
                  field="estado"
                  label="Estado"
                  currentSort={sortState}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-xs">
                <ColumnFilter
                  field="fecha_creacion"
                  label="Creación"
                  currentSort={sortState}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-xs">
                <ColumnFilter
                  field="fecha_proxima"
                  label="Próxima"
                  currentSort={sortState}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInspecciones.map((ins) => (
              <TableRow
                key={ins.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <TableCell>
                  <p className="font-bold text-sm">{ins.registration}</p>
                  {ins.callsign && (
                    <p className="text-xs text-muted-foreground">
                      Móvil {ins.callsign}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <p className="text-sm font-medium">
                    {[ins.make, ins.model].filter(Boolean).join(" ") || "—"}
                  </p>
                  {ins.year_manufacture && (
                    <p className="text-xs text-muted-foreground">
                      {ins.year_manufacture}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <p className="text-sm">
                    {[ins.forename, ins.surname].filter(Boolean).join(" ") ||
                      "—"}
                  </p>
                </TableCell>
                <TableCell className="text-xs">
                  {ins.cpc_card_number || "—"}
                </TableCell>
                <TableCell>
                  <EstadoBadge estado={ins.estado} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(ins.fecha_creacion)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(ins.fecha_proxima)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-2"
                      onClick={() => setDetalle(ins)}
                    >
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-2"
                      onClick={() => setEditar(ins)}
                    >
                      Editar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal Ver */}
      {detalle && (
        <InspeccionDetalle
          inspeccion={detalle}
          onClose={() => setDetalle(null)}
        />
      )}

      {/* Modal Editar */}
      {editar && (
        <InspeccionEditar
          inspeccion={editar}
          onClose={() => setEditar(null)}
          onSaved={() => {
            setEditar(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
