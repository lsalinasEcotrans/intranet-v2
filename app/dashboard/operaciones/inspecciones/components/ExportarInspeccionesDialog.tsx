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
import { Input } from "@/components/ui/input";
import { FileDown } from "lucide-react";
import { generarPDF } from "@/lib/pdf/generarPDF";

export default function ExportarInspeccionesDialog() {
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!fechaDesde || !fechaHasta) {
      alert("Debes seleccionar ambas fechas");
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        page_size: "1000", // 🔥 importante para traer todo
      });

      const res = await fetch(`/api/inspecciones/export?${params}`);

      if (!res.ok) {
        const errorText = await res.text();
        console.error(errorText);
        throw new Error("Error al obtener datos");
      }

      const data = await res.json();

      console.log("DATA EXPORT:", data.items); // debug

      await generarPDF(data);
    } catch (err) {
      console.error(err);
      alert("Error al generar PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">
          <FileDown className="mr-1" />
          Exportar
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar inspecciones</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs">Desde</label>
            <Input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs">Hasta</label>
            <Input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? "Generando..." : "Descargar PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
