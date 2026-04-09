"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, Calendar, AlertCircle } from "lucide-react";
import { generarPDF } from "@/lib/pdf/generarPDF";
import DatePickerCalendar from "./Datepickercalendar";

export default function ExportarInspeccionesDialog() {
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleExport = async () => {
    setError(null);

    // Validaciones
    if (!fechaDesde || !fechaHasta) {
      setError("Debes seleccionar ambas fechas");
      return;
    }

    // ✅ CORREGCIÓN: Usar Date con 'Z' para evitar timezone issues
    const dateFrom = new Date(fechaDesde + "T00:00:00");
    const dateTo = new Date(fechaHasta + "T23:59:59");

    if (fechaDesde > fechaHasta) {
      setError("La fecha 'Desde' no puede ser mayor que 'Hasta'");
      return;
    }

    setLoading(true);
    try {
      // ✅ Enviar las fechas en formato ISO correcto
      const params = new URLSearchParams({
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
      });

      console.log("🔍 Exportando con fechas:", { fechaDesde, fechaHasta });

      const res = await fetch(`/api/inspecciones/export?${params}`);
      if (!res.ok) {
        const errorText = await res.text();
        console.error(errorText);
        throw new Error("Error al obtener datos");
      }

      const data = await res.json();
      console.log(
        "DATA EXPORT - Total registros:",
        data.items?.length || data?.length,
      );

      // Soportar ambas respuestas: array o {items: []}
      const items = Array.isArray(data) ? data : data.items || [];

      if (items.length === 0) {
        setError("No hay registros para exportar en este período");
        return;
      }

      await generarPDF(items, fechaDesde, fechaHasta);

      // Cerrar dialog después de exportar
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al generar PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileDown className="mr-2 w-4 h-4" />
          Exportar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Exportar inspecciones
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rango de fechas con DatePickerCalendar */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <DatePickerCalendar
                value={fechaDesde}
                onChange={(value) => {
                  setFechaDesde(value);
                  setError(null);
                }}
                label="Desde"
                placeholder="Seleccionar fecha"
              />
            </div>
            <div>
              <DatePickerCalendar
                value={fechaHasta}
                onChange={(value) => {
                  setFechaHasta(value);
                  setError(null);
                }}
                label="Hasta"
                placeholder="Seleccionar fecha"
              />
            </div>
          </div>

          {/* Mostrar rango seleccionado */}
          {fechaDesde && fechaHasta && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Período:</strong>{" "}
                {new Date(fechaDesde + "T00:00:00").toLocaleDateString("es-CL")}{" "}
                -{" "}
                {new Date(fechaHasta + "T00:00:00").toLocaleDateString("es-CL")}
              </p>
              {(() => {
                const from = new Date(fechaDesde + "T00:00:00");
                const to = new Date(fechaHasta + "T00:00:00");
                const days =
                  Math.ceil(
                    (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
                  ) + 1;
                return (
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {days} días
                  </p>
                );
              })()}
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleExport}
            disabled={loading || !fechaDesde || !fechaHasta}
            className="w-full"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Generando PDF...
              </>
            ) : (
              <>
                <FileDown className="mr-2 w-4 h-4" />
                Descargar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
