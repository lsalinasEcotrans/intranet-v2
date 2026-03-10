"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface DetalleReserva {
  fechas?: {
    inicio: string;
    termino: string;
  };
  horas?: {
    subida: string;
    bajada: string;
  };
}

interface Form4x4Props {
  authId: number;
  grupoNumero: number;
  tipoTurno: "4x4" | "7x7";
  detalleReserva?: DetalleReserva;
}

export default function Form4x4({
  authId,
  grupoNumero,
  tipoTurno,
  detalleReserva,
}: Form4x4Props) {
  // ── Estados ─────────────────────────────
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>();
  const [fechaTermino, setFechaTermino] = useState<Date | undefined>();
  const [horaSubida, setHoraSubida] = useState("");
  const [horaBajada, setHoraBajada] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Control del mes mostrado en el calendario
  const [mesActual, setMesActual] = useState<Date>(new Date());

  // ── Prellenar si es edit ─────────────────
  useEffect(() => {
    if (detalleReserva) {
      if (detalleReserva.fechas?.inicio) {
        const inicio = new Date(detalleReserva.fechas.inicio);
        setFechaInicio(inicio);
        setMesActual(inicio); // centrar calendario
      }
      if (detalleReserva.fechas?.termino)
        setFechaTermino(new Date(detalleReserva.fechas.termino));
      if (detalleReserva.horas?.subida)
        setHoraSubida(detalleReserva.horas.subida);
      if (detalleReserva.horas?.bajada)
        setHoraBajada(detalleReserva.horas.bajada);
    }
  }, [detalleReserva]);

  // ── Rango seleccionado para el calendario ──
  const rangoSeleccionado =
    fechaInicio && fechaTermino
      ? { from: fechaInicio, to: fechaTermino }
      : undefined;

  // ── Guardar / Actualizar reserva ───────────
  const handleGuardar = async () => {
    if (!fechaInicio || !fechaTermino || !horaSubida || !horaBajada) {
      toast.error("Debes completar fechas y horas");
      return;
    }

    const payload = {
      auth_id: authId,
      grupo_numero: grupoNumero,
      tipo_turno: tipoTurno,
      detalle_json: {
        fechas: {
          inicio: format(fechaInicio, "yyyy-MM-dd"),
          termino: format(fechaTermino, "yyyy-MM-dd"),
        },
        horas: {
          subida: horaSubida,
          bajada: horaBajada,
        },
      },
    };

    setLoading(true);

    try {
      const url = detalleReserva
        ? `https://ecotrans-pasajero-370980788525.europe-west1.run.app/tmp-reservas/detalle` // si existe, hacemos PUT
        : `https://ecotrans-pasajero-370980788525.europe-west1.run.app/tmp-reservas`;

      const method = detalleReserva ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al guardar reserva");

      toast.success("Reserva guardada correctamente");
    } catch (err: any) {
      toast.error(err.message || "Error al guardar reserva");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Reserva Turno {tipoTurno}
          </h1>
        </div>
      </div>
      <Card>
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Calendario */}
          <div>
            <p className="mb-4 font-semibold">Selecciona rango de fechas</p>
            <Calendar
              mode="range"
              selected={rangoSeleccionado}
              onSelect={(range) => {
                if (range?.from) setFechaInicio(range.from);
                if (range?.to) setFechaTermino(range.to);
              }}
              locale={es}
              disabled={(date) => date < new Date()}
              month={mesActual}
              onMonthChange={setMesActual}
              className="w-full max-w-lg text-lg [&_button]:h-12 [&_button]:w-12"
            />
          </div>

          {/* Horas */}
          <div className="space-y-6">
            <div>
              <label className="block mb-1 font-medium">Hora de subida</label>
              <input
                type="time"
                value={horaSubida}
                onChange={(e) => setHoraSubida(e.target.value)}
                step={60} // permite seleccionar cada minuto
                pattern="[0-2][0-9]:[0-5][0-9]" // fuerza formato HH:mm
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Hora de bajada</label>
              <input
                type="time"
                value={horaBajada}
                onChange={(e) => setHoraBajada(e.target.value)}
                step={60}
                pattern="[0-2][0-9]:[0-5][0-9]" // fuerza formato HH:mm
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            {/* Resumen */}
            <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
              <p>
                <span className="font-semibold">Fecha inicio:</span>{" "}
                {fechaInicio
                  ? format(fechaInicio, "dd 'de' MMMM yyyy", { locale: es })
                  : "—"}
              </p>
              <p>
                <span className="font-semibold">Fecha término:</span>{" "}
                {fechaTermino
                  ? format(fechaTermino, "dd 'de' MMMM yyyy", { locale: es })
                  : "—"}
              </p>
              <p>
                <span className="font-semibold">Hora subida:</span>{" "}
                {horaSubida || "—"}
              </p>
              <p>
                <span className="font-semibold">Hora bajada:</span>{" "}
                {horaBajada || "—"}
              </p>
            </div>

            <Button
              className="w-full h-12 text-lg"
              onClick={handleGuardar}
              disabled={loading}
            >
              {loading
                ? detalleReserva
                  ? "Actualizando..."
                  : "Guardando..."
                : detalleReserva
                  ? "Actualizar reserva"
                  : "Guardar reserva"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
