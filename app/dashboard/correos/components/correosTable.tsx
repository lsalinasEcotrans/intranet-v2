"use client";

import { useState, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Componentes separados
import SearchAndFilters, { type EstadoFilter } from "./SearchAndFilters";
import CorreoRow from "./CorreoRow";
import TableSkeleton from "./TableSkeleton";
import AutoAsignarDialog from "./AutoAsignarDialog";

// Hooks personalizados
import { useUser } from "../hooks/useUser";
import { useCorreos } from "../usuario/useCorreos";
import { useCorreosFilters } from "../usuario/useCorreosFilters";

interface CorreoNormalizado {
  id: number;
  fecha: string;
  asunto: string;
  estado: string;
  asignado: string | null;
  idCorreo: number;
  intencion: string;
  estadoNormalizado: string;
  fechaTimestamp: number;
  esMio: boolean;
}

export default function CorreosTable() {
  const user = useUser();
  const { correos, setCorreos, correosNormalizados, loading, setLoading } =
    useCorreos(user?.fullName);

  const [selectedCorreo, setSelectedCorreo] =
    useState<CorreoNormalizado | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("Todos");
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  const router = useRouter();

  const { contadores, correosFiltrados } = useCorreosFilters(
    correosNormalizados,
    searchTerm,
    estadoFilter,
    showOnlyMine
  );

  const handleClick = useCallback(
    (correo: CorreoNormalizado) => {
      if (!user) return;

      const intencionParam = encodeURIComponent(correo.intencion);

      if (correo.esMio) {
        router.push(
          `/dashboard/correos/owa_detalle/${correo.idCorreo}?intencion=${intencionParam}`
        );
        return;
      }

      if (correo.estadoNormalizado === "Pendiente") {
        setSelectedCorreo(correo);
        setOpenDialog(true);
      }
    },
    [user, router]
  );

  const handleAutoAsignar = useCallback(async () => {
    if (!selectedCorreo || !user) return;

    setLoading(true);
    try {
      await axios.put(
        `https://ecotrans-intranet-370980788525.europe-west1.run.app/headers/asignar/${selectedCorreo.idCorreo}`,
        { user_id: user.id }
      );

      setCorreos((prev) =>
        prev.map((c) =>
          c.id === selectedCorreo.id
            ? { ...c, estado: "En proceso", asignado: user.fullName }
            : c
        )
      );

      setOpenDialog(false);
      router.push(
        `/dashboard/correos/owa_detalle/${
          selectedCorreo.idCorreo
        }?intencion=${encodeURIComponent(selectedCorreo.intencion)}`
      );
    } catch (err) {
      console.error("Error autoasignando:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCorreo, user, router, setCorreos, setLoading]);

  const handleEstadoFilterChange = useCallback((estado: EstadoFilter) => {
    setEstadoFilter(estado);
    if (estado !== "Todos") {
      setShowOnlyMine(false);
    }
  }, []);

  return (
    <div className="space-y-4">
      <SearchAndFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        estadoFilter={estadoFilter}
        onEstadoFilterChange={handleEstadoFilterChange}
        showOnlyMine={showOnlyMine}
        onShowOnlyMineToggle={() => setShowOnlyMine(!showOnlyMine)}
        contadores={contadores}
      />

      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="w-full overflow-x-auto rounded-lg border bg-white shadow-sm">
          <Table className="min-w-max">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold">Fecha</TableHead>
                <TableHead className="font-semibold">Asunto</TableHead>
                <TableHead className="font-semibold">Intención</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="font-semibold">Asignado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {correosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No se encontraron correos
                  </TableCell>
                </TableRow>
              ) : (
                correosFiltrados.map((correo) => (
                  <CorreoRow
                    key={correo.id}
                    correo={correo}
                    onClick={handleClick}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {typeof window !== "undefined" && (
        <AutoAsignarDialog
          open={openDialog}
          onOpenChange={setOpenDialog}
          onConfirm={handleAutoAsignar}
          userName={user?.fullName}
          loading={loading}
        />
      )}
    </div>
  );
}
