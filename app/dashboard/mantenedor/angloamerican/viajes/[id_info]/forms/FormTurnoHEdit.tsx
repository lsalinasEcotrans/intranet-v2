"use client";

import { useState, useEffect, useMemo } from "react";
import { addDays, startOfWeek, format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  authId: number;
  grupoNumero: number;
  detalleViaje: any; // lo que viene desde la API
}

const DIAS = [
  { key: "lunes", label: "Lunes", offset: 0 },
  { key: "martes", label: "Martes", offset: 1 },
  { key: "miercoles", label: "Miércoles", offset: 2 },
  { key: "jueves", label: "Jueves", offset: 3 },
  { key: "viernes", label: "Viernes", offset: 4 },
];

export default function FormTurnoHEdit({
  authId,
  grupoNumero,
  detalleViaje,
}: Props) {
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
  const [noViaja, setNoViaja] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  /* ============================
     🔹 PRECARGAR DATOS DESDE API
     ============================ */
  useEffect(() => {
    if (!detalleViaje) return;

    if (detalleViaje.modo === "no_viaja") {
      setNoViaja(true);
      setDiasSeleccionados([]);
    }

    if (detalleViaje.modo === "dias_seleccionados") {
      const diasGuardados = detalleViaje.dias.map((d: any) =>
        d.dia
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, ""),
      );

      setDiasSeleccionados(diasGuardados);
    }
  }, [detalleViaje]);

  /* ============================
     🔹 CALCULAR SEMANA SIGUIENTE
     ============================ */
  const fechasCalculadas = useMemo(() => {
    if (diasSeleccionados.length === 0) return [];

    const lunesSemanaSiguiente = addDays(
      startOfWeek(new Date(), { weekStartsOn: 1 }),
      7,
    );

    return DIAS.filter((d) => diasSeleccionados.includes(d.key)).map((d) => ({
      dia: d.label,
      fecha: addDays(lunesSemanaSiguiente, d.offset),
    }));
  }, [diasSeleccionados]);

  const toggleDia = (dia: string) => {
    if (noViaja) return;

    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia],
    );
  };

  const confirmarNoViaja = () => {
    setNoViaja(true);
    setDiasSeleccionados([]);
    setOpenDialog(false);
  };

  /* ============================
     🔹 ACTUALIZAR TURNO H
     ============================ */
  const handleActualizar = async () => {
    if (!noViaja && fechasCalculadas.length === 0) {
      toast.error("Selecciona al menos un día o indica que no viajarás");
      return;
    }

    let detalle_json;

    if (noViaja) {
      const lunesSemanaSiguiente = addDays(
        startOfWeek(new Date(), { weekStartsOn: 1 }),
        7,
      );

      detalle_json = {
        modo: "no_viaja",
        semana: format(lunesSemanaSiguiente, "yyyy-MM-dd"),
      };
    } else {
      detalle_json = {
        modo: "dias_seleccionados",
        dias: fechasCalculadas.map((f) => ({
          dia: f.dia,
          fecha: format(f.fecha, "yyyy-MM-dd"),
        })),
      };
    }

    const payload = {
      auth_id: authId,
      grupo_numero: grupoNumero,
      tipo_turno: "H",
      detalle_json,
    };

    try {
      setLoading(true);

      const res = await fetch(
        "https://ecotrans-pasajero-370980788525.europe-west1.run.app/tmp-reservas/detalle",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth_id: authId,
            tipo_turno: "H",
            detalle_json,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al actualizar");

      toast.success("Turno H actualizado correctamente");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  /* ============================
     🔹 UI
     ============================ */
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Editar Pasajero</h1>
        </div>
      </div>
      <Card>
        <CardContent className="space-y-6">
          {/* Selección días */}
          <div>
            <p className="font-semibold mb-3">
              Modifica los días de la semana siguiente
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {DIAS.map((dia) => (
                <label key={dia.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    disabled={noViaja}
                    checked={diasSeleccionados.includes(dia.key)}
                    onChange={() => toggleDia(dia.key)}
                  />
                  {dia.label}
                </label>
              ))}
            </div>
          </div>

          <Button
            variant="destructive"
            type="button"
            onClick={() => setOpenDialog(true)}
          >
            No viajaré esta semana
          </Button>

          {/* Resumen */}
          <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
            {noViaja ? (
              <p className="text-red-600 font-medium">
                No será considerado para servicios esta semana.
              </p>
            ) : fechasCalculadas.length === 0 ? (
              <p className="text-muted-foreground">
                No hay días seleccionados.
              </p>
            ) : (
              fechasCalculadas.map((f) => (
                <p key={f.dia}>
                  <span className="font-medium">{f.dia}:</span>{" "}
                  {format(f.fecha, "dd 'de' MMMM yyyy", { locale: es })}
                </p>
              ))
            )}
          </div>

          <Button
            className="w-full h-12"
            onClick={handleActualizar}
            disabled={loading}
          >
            {loading ? "Actualizando..." : "Actualizar Turno H"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar</DialogTitle>
            <DialogDescription>
              Si confirmas que no viajarás esta semana, no serás considerado
              para servicios.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancelar
            </Button>

            <Button variant="destructive" onClick={confirmarNoViaja}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
