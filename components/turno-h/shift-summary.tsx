import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, Ban } from "lucide-react";
import { TURNOS } from "./shift-grid";
import type { Turno } from "./shift-grid";

interface FechaCalculada {
  dia: string;
  fecha: Date;
  turnos: Turno[];
}

interface ShiftSummaryProps {
  noViaja: boolean;
  fechasCalculadas: FechaCalculada[];
}

export function ShiftSummary({ noViaja, fechasCalculadas }: ShiftSummaryProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        {noViaja ? (
          <Ban className="size-4 text-destructive" />
        ) : (
          <CalendarDays className="size-4 text-primary" />
        )}
        <h3 className="text-sm font-semibold text-foreground">
          {noViaja ? "Estado de la semana" : "Resumen de viajes"}
        </h3>
      </div>

      {noViaja ? (
        <p className="text-destructive text-sm font-medium pl-6">
          No sera considerado para servicios esta semana.
        </p>
      ) : fechasCalculadas.length === 0 ? (
        <p className="text-muted-foreground text-sm pl-6">
          Selecciona al menos un turno para ver el resumen.
        </p>
      ) : (
        <div className="space-y-2 pl-6">
          {fechasCalculadas.map((f) => (
            <div
              key={f.dia}
              className="flex items-center justify-between py-1.5"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-foreground">
                  {f.dia}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(f.fecha, "dd MMM", { locale: es })}
                </span>
              </div>
              <div className="flex gap-1.5">
                {f.turnos.map((t) => {
                  const turnoInfo = TURNOS.find((x) => x.key === t);
                  return (
                    <span
                      key={t}
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        t === "manana"
                          ? "bg-green-500/25 text-green-700"
                          : "bg-sky-400/25 text-sky-700"
                      }`}
                    >
                      {turnoInfo?.label}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
