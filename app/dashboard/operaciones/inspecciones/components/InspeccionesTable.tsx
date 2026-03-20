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
import { CheckCircle, XCircle } from "lucide-react";

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
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-sm">No se encontraron inspecciones</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Patente / Móvil
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Vehículo
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Conductor
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                CPC
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Estado
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Creación
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Próxima
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inspecciones.map((ins) => (
              <TableRow
                key={ins.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <TableCell>
                  <p className=" font-bold text-sm">{ins.registration}</p>
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
                <TableCell className=" text-xs">
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
