"use client";

import { useState, useEffect, useMemo } from "react";
import { addDays, startOfWeek, format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Ban, ArrowRight, Bus, ChevronLeft } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { ShiftGrid, DIAS } from "@/components/turno-h/shift-grid";
import { ShiftSummary } from "@/components/turno-h/shift-summary";
import type { Turno, TurnoSeleccionado } from "@/components/turno-h/shift-grid";

interface Props {
  authId: number;
  grupoNumero: string;
  detalleViaje: any;
}

export default function FormTurnoHEdit({
  authId,
  grupoNumero,
  detalleViaje,
}: Props) {
  const [turnosSeleccionados, setTurnosSeleccionados] = useState<
    TurnoSeleccionado[]
  >([]);
  const [noViaja, setNoViaja] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const lunesSemanaSiguiente = useMemo(
    () => addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7),
    [],
  );

  /* ── Precargar datos desde API ─────────────────────────────────────────── */
  useEffect(() => {
    if (!detalleViaje) return;

    if (detalleViaje.modo === "no_viaja") {
      setNoViaja(true);
      setTurnosSeleccionados([]);
      return;
    }

    if (detalleViaje.modo === "dias_seleccionados" && detalleViaje.dias) {
      const turnos: TurnoSeleccionado[] = [];

      detalleViaje.dias.forEach((d: any) => {
        const diaKey = d.dia
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        if (d.turnos && Array.isArray(d.turnos)) {
          d.turnos.forEach((t: Turno) => {
            turnos.push({ dia: diaKey, turno: t });
          });
        } else {
          // Fallback: si no tiene turnos, asumir manana
          turnos.push({ dia: diaKey, turno: "manana" });
        }
      });

      setTurnosSeleccionados(turnos);
    }
  }, [detalleViaje]);

  /* ── Fechas calculadas ─────────────────────────────────────────────────── */
  const fechasCalculadas = useMemo(() => {
    if (turnosSeleccionados.length === 0) return [];
    const diasUnicos = [...new Set(turnosSeleccionados.map((t) => t.dia))];
    return DIAS.filter((d) => diasUnicos.includes(d.key)).map((d) => ({
      dia: d.fullLabel,
      fecha: addDays(lunesSemanaSiguiente, d.offset),
      turnos: turnosSeleccionados
        .filter((t) => t.dia === d.key)
        .map((t) => t.turno),
    }));
  }, [turnosSeleccionados, lunesSemanaSiguiente]);

  const toggleTurno = (dia: string, turno: Turno) => {
    if (noViaja) return;
    setTurnosSeleccionados((prev) => {
      const exists = prev.some((t) => t.dia === dia && t.turno === turno);
      if (exists)
        return prev.filter((t) => !(t.dia === dia && t.turno === turno));
      return [...prev, { dia, turno }];
    });
  };

  const confirmarNoViaja = () => {
    setNoViaja(true);
    setTurnosSeleccionados([]);
    setOpenDialog(false);
  };

  const cancelarNoViaja = () => setNoViaja(false);

  /* ── Actualizar Turno H ────────────────────────────────────────────────── */
  const handleActualizar = async () => {
    if (!authId || !grupoNumero) {
      toast.error("Datos invalidos desde la API");
      return;
    }

    if (!noViaja && fechasCalculadas.length === 0) {
      toast.error("Selecciona al menos un turno o indica que no viajaras");
      return;
    }

    let detalle_json;

    if (noViaja) {
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
          turnos: f.turnos,
        })),
      };
    }

    try {
      setLoading(true);

      const res = await fetch(
        "https://ecotrans-pasajero-370980788525.europe-west1.run.app/tmp-reservas/detalle",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth_id: authId,
            grupo_numero: grupoNumero,
            tipo_turno: "H",
            detalle_json,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al actualizar");

      toast.success("Turno H actualizado correctamente");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /* ── UI ────────────────────────────────────────────────────────────────── */
  const selectedCount = turnosSeleccionados.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-xl"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Bus className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Editar Turno H
            </h1>
            <p className="text-sm text-muted-foreground">
              Semana del{" "}
              {format(lunesSemanaSiguiente, "dd MMM", { locale: es })}
              {" - "}
              {format(addDays(lunesSemanaSiguiente, 4), "dd MMM yyyy", {
                locale: es,
              })}
            </p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
          {/* Left column - Shift selection */}
          <div className="flex-1 min-w-0 space-y-4">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-5 md:p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">
                    Modifica tus turnos
                  </h2>
                  {selectedCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedCount} turno{selectedCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>

                <ShiftGrid
                  turnosSeleccionados={turnosSeleccionados}
                  noViaja={noViaja}
                  onToggle={toggleTurno}
                />

                <Separator />

                {/* No travel toggle */}
                <div>
                  {!noViaja ? (
                    <button
                      type="button"
                      onClick={() => setOpenDialog(true)}
                      className="flex items-center gap-3 w-full rounded-xl border border-dashed border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    >
                      <Ban className="size-4 shrink-0" />
                      <span className="font-medium">
                        No viajare esta semana
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={cancelarNoViaja}
                      className="flex items-center gap-3 w-full rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                      <ArrowRight className="size-4 shrink-0" />
                      <span className="font-medium">Cancelar decision</span>
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Summary + Update */}
          <div className="lg:w-80 xl:w-96 lg:sticky lg:top-8 space-y-4">
            <ShiftSummary
              noViaja={noViaja}
              fechasCalculadas={fechasCalculadas}
            />

            {/* Update button */}
            <Button
              className="w-full h-12 text-base font-semibold rounded-xl shadow-lg shadow-primary/20 cursor-pointer"
              onClick={handleActualizar}
              disabled={loading}
              size="lg"
            >
              {loading ? "Actualizando..." : "Actualizar Turno H"}
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto rounded-full bg-destructive/10 p-3 mb-2">
              <Ban className="size-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">
              {"Confirmar que no viajaras?"}
            </DialogTitle>
            <DialogDescription className="text-center">
              Si confirmas que no viajaras esta semana, no seras considerado
              para ningun servicio.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenDialog(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarNoViaja}
              className="flex-1"
            >
              Si, no viajare
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
