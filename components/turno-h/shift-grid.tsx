"use client";

import { cn } from "@/lib/utils";
import { Sun, Moon } from "lucide-react";

type Turno = "manana" | "tarde";

interface TurnoSeleccionado {
  dia: string;
  turno: Turno;
}

const DIAS = [
  { key: "lunes", label: "Lun", fullLabel: "Lunes", offset: 0 },
  { key: "martes", label: "Mar", fullLabel: "Martes", offset: 1 },
  { key: "miercoles", label: "Mie", fullLabel: "Miercoles", offset: 2 },
  { key: "jueves", label: "Jue", fullLabel: "Jueves", offset: 3 },
  { key: "viernes", label: "Vie", fullLabel: "Viernes", offset: 4 },
];

const TURNOS: { key: Turno; label: string; icon: typeof Sun }[] = [
  { key: "manana", label: "AM", icon: Sun },
  { key: "tarde", label: "PM", icon: Moon },
];

interface ShiftGridProps {
  turnosSeleccionados: TurnoSeleccionado[];
  noViaja: boolean;
  onToggle: (dia: string, turno: Turno) => void;
}

export { DIAS, TURNOS };
export type { Turno, TurnoSeleccionado };

export function ShiftGrid({
  turnosSeleccionados,
  noViaja,
  onToggle,
}: ShiftGridProps) {
  const isSelected = (dia: string, turno: Turno) =>
    turnosSeleccionados.some((t) => t.dia === dia && t.turno === turno);

  return (
    <div
      className={cn("space-y-2", noViaja && "opacity-40 pointer-events-none")}
    >
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-1 mb-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Dia
        </span>
        {TURNOS.map((t) => (
          <span
            key={t.key}
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center"
          >
            {t.label}
          </span>
        ))}
      </div>

      {/* Day rows */}
      {DIAS.map((dia) => {
        const hasAny = TURNOS.some((t) => isSelected(dia.key, t.key));
        return (
          <div
            key={dia.key}
            className={cn(
              "grid grid-cols-[1fr_80px_80px] gap-2 items-center rounded-xl px-4 py-3 transition-all duration-200",
              hasAny
                ? "bg-primary/5 border border-primary/15"
                : "bg-muted/40 border border-transparent",
            )}
          >
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {dia.fullLabel}
              </span>
            </div>
            {TURNOS.map((turno) => {
              const selected = isSelected(dia.key, turno.key);
              const Icon = turno.icon;
              return (
                <button
                  key={turno.key}
                  type="button"
                  disabled={noViaja}
                  onClick={() => onToggle(dia.key, turno.key)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg h-10 text-xs font-semibold transition-all duration-200 cursor-pointer",
                    selected
                      ? turno.key === "manana"
                        ? "bg-emerald-600 text-accent shadow-sm"
                        : "bg-sky-600 text-primary-foreground shadow-sm"
                      : "bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                  aria-pressed={selected}
                  aria-label={`${dia.fullLabel} ${turno.label}`}
                >
                  <Icon className="size-3.5" />
                  {turno.label}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
