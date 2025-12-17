import { useMemo } from "react";
import type { EstadoFilter } from "../components/SearchAndFilters";

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

export function useCorreosFilters(
  correosNormalizados: CorreoNormalizado[],
  searchTerm: string,
  estadoFilter: EstadoFilter,
  showOnlyMine: boolean
) {
  const contadores = useMemo(() => {
    const todos = correosNormalizados.length;
    let pendientes = 0;
    let enProceso = 0;
    let completados = 0;
    let esperaRespuesta = 0;
    let respuestaCliente = 0;
    let mios = 0;

    correosNormalizados.forEach((c) => {
      if (c.estadoNormalizado === "Pendiente") pendientes++;
      if (c.estadoNormalizado === "En proceso") enProceso++;
      if (c.estadoNormalizado === "Completado") completados++;
      if (c.estadoNormalizado === "Espera de respuesta") esperaRespuesta++;
      if (c.estadoNormalizado === "Respuesta de cliente") respuestaCliente++;
      if (c.esMio) mios++;
    });

    return {
      todos,
      pendientes,
      enProceso,
      completados,
      esperaRespuesta,
      respuestaCliente,
      mios,
    };
  }, [correosNormalizados]);

  const correosFiltrados = useMemo(() => {
    let filtered = correosNormalizados;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((c) =>
        c.asunto.toLowerCase().includes(searchLower)
      );
    }

    if (estadoFilter !== "Todos") {
      filtered = filtered.filter((c) => c.estadoNormalizado === estadoFilter);
    }

    if (showOnlyMine) {
      filtered = filtered.filter((c) => c.esMio);
    }

    return filtered.sort((a, b) => {
      if (a.esMio && !b.esMio) return -1;
      if (!a.esMio && b.esMio) return 1;
      return b.fechaTimestamp - a.fechaTimestamp;
    });
  }, [correosNormalizados, searchTerm, estadoFilter, showOnlyMine]);

  return { contadores, correosFiltrados };
}
