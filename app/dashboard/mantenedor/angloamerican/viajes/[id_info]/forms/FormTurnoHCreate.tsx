"use client";

import { useState, useMemo } from "react";
import { addDays, startOfWeek, format } from "date-fns";
import { es } from "date-fns/locale";

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
}

const DIAS = [
  { key: "lunes", label: "Lunes", offset: 0 },
  { key: "martes", label: "Martes", offset: 1 },
  { key: "miercoles", label: "Miércoles", offset: 2 },
  { key: "jueves", label: "Jueves", offset: 3 },
  { key: "viernes", label: "Viernes", offset: 4 },
];

export default function FormTurnoHCreate({ authId, grupoNumero }: Props) {
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
  const [noViaja, setNoViaja] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);

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
     🔹 GUARDAR TURNO H
     ============================ */
  const handleGuardar = async () => {
    if (!authId || !grupoNumero) {
      toast.error("Datos inválidos desde la API");
      return;
    }

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
        mensaje: "No viajará esta semana",
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
      detalle_json: detalle_json,
    };

    try {
      setLoading(true);

      const res = await fetch(
        `https://ecotrans-pasajero-370980788525.europe-west1.run.app/tmp-reservas`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al guardar");

      toast.success("Turno H creado correctamente");
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
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Crear Turno H</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Selección días */}
          <div>
            <p className="font-semibold mb-3">
              Selecciona los días de la semana siguiente
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

          {/* Botón No Viaja */}
          <Button
            variant="destructive"
            type="button"
            onClick={() => setOpenDialog(true)}
          >
            No viajaré esta semana
          </Button>

          {/* ============================
              🔹 RESUMEN SELECCIÓN
             ============================ */}
          <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
            <p className="font-semibold">
              {noViaja
                ? "Estado de la semana"
                : "Fechas seleccionadas (semana siguiente)"}
            </p>

            {noViaja ? (
              <p className="text-red-600 font-medium">
                No será considerado para servicios esta semana.
              </p>
            ) : fechasCalculadas.length === 0 ? (
              <p className="text-muted-foreground">
                Aún no has seleccionado días.
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

          {/* Guardar */}
          <Button
            className="w-full h-12"
            onClick={handleGuardar}
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar Turno H"}
          </Button>
        </CardContent>
      </Card>

      {/* Dialog confirmación */}
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
