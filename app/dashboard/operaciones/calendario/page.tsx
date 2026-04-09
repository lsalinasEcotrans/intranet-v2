"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Car,
  CalendarDays,
  LayoutGrid,
  List,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

// Forma exacta que devuelve la API
interface ApiItem {
  id: number;
  callsign: string;
  estado: "aprobado" | "rechazado";
  fecha_creacion: string; // "2026-03-20T16:22:03"
  fecha_proxima: string; // "2026-05-19T16:22:03"
  // el resto de campos no se usan en el calendario
  [key: string]: unknown;
}

interface ApiResponse {
  total: number;
  page: number;
  page_size: number;
  items: ApiItem[];
}

// Forma interna simplificada que usa el calendario
export interface Inspeccion {
  id: string;
  callsign: string;
  estado: "aprobado" | "rechazado";
  fecha_creacion: string; // YYYY-MM-DD (normalizado)
  fecha_proxima: string; // YYYY-MM-DD (normalizado)
}

// ─── Normalizar respuesta de la API ──────────────────────────────────────────
// Convierte "2026-03-20T16:22:03" → "2026-03-20"

function isoToDate(isoStr: string): string {
  return isoStr.split("T")[0];
}

function mapApiToInspeccion(item: ApiItem): Inspeccion {
  return {
    id: String(item.id),
    callsign: item.callsign,
    estado: item.estado,
    fecha_creacion: isoToDate(item.fecha_creacion),
    fecha_proxima: isoToDate(item.fecha_proxima),
  };
}

// ─── API URL ──────────────────────────────────────────────────────────────────

const API_BASE = "https://ecotrans-intranet-370980788525.europe-west1.run.app";

// Carga todas las páginas hasta obtener todos los registros
async function fetchAllInspecciones(): Promise<Inspeccion[]> {
  const PAGE_SIZE = 60;
  let page = 1;
  let all: Inspeccion[] = [];

  while (true) {
    const res = await fetch(
      `${API_BASE}/inspecciones/?page=${page}&page_size=${PAGE_SIZE}`,
    );
    if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

    const data: ApiResponse = await res.json();
    const items = data.items.map(mapApiToInspeccion);
    all = [...all, ...items];

    // Si ya cargamos todo, salir
    if (all.length >= data.total || items.length === 0) break;
    page++;
  }

  return all;
}

// ─── Helpers de calendario ────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekdays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function groupByMonth(
  inspecciones: Inspeccion[],
): Record<string, Inspeccion[]> {
  return inspecciones.reduce<Record<string, Inspeccion[]>>((acc, ins) => {
    const [y, m] = ins.fecha_proxima.split("-").map(Number);
    const key = `${y}-${m - 1}`;
    (acc[key] = acc[key] ?? []).push(ins);
    return acc;
  }, {});
}

function buildSchedule(
  inspecciones: Inspeccion[],
  year: number,
  month: number,
): Record<string, Inspeccion[]> {
  const byMonth = groupByMonth(inspecciones);
  const monthInsps = byMonth[`${year}-${month}`] ?? [];
  const weekdays = getWeekdays(year, month);

  const schedule: Record<string, Inspeccion[]> = {};
  weekdays.forEach((d) => {
    schedule[toDateStr(d)] = [];
  });

  if (weekdays.length === 0 || monthInsps.length === 0) return schedule;

  monthInsps.forEach((ins, i) => {
    const key = toDateStr(weekdays[i % weekdays.length]);
    schedule[key].push(ins);
  });

  return schedule;
}

function isExecuted(
  ins: Inspeccion,
  viewYear: number,
  viewMonth: number,
): boolean {
  const [y, m] = ins.fecha_creacion.split("-").map(Number);
  return y === viewYear && m - 1 === viewMonth;
}

// ─── Constantes UI ────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const WD_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const WD_FULL = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
];

type ViewMode = "month" | "week" | "list";

// ─── Badge inline ─────────────────────────────────────────────────────────────

function CsBadge({ ins, executed }: { ins: Inspeccion; executed: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[3px] px-1.5 py-[3px] rounded text-[11px] font-semibold whitespace-nowrap",
        executed
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
          : "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
      )}
    >
      {executed ? (
        <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
      ) : (
        <Clock className="w-2.5 h-2.5 shrink-0" />
      )}
      {ins.callsign}
    </span>
  );
}

// ─── Sheet de detalle del día ─────────────────────────────────────────────────

function DayDetailSheet({
  dateStr,
  inspecciones,
  year,
  month,
  onClose,
}: {
  dateStr: string | null;
  inspecciones: Inspeccion[];
  year: number;
  month: number;
  onClose: () => void;
}) {
  let displayDate = "";
  let weekdayName = "";
  if (dateStr) {
    const [dy, dm, dd] = dateStr.split("-").map(Number);
    const d = new Date(dy, dm - 1, dd);
    displayDate = `${dd} de ${MONTH_NAMES[dm - 1]} ${dy}`;
    weekdayName = WD_FULL[(d.getDay() + 6) % 7];
  }

  const executed = inspecciones.filter((i) => isExecuted(i, year, month));
  const pending = inspecciones.filter((i) => !isExecuted(i, year, month));

  return (
    <Sheet open={!!dateStr} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                {weekdayName}
              </p>
              <SheetTitle className="text-xl font-black mt-0.5">
                {displayDate}
              </SheetTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {inspecciones.length} móvil
                {inspecciones.length !== 1 ? "es" : ""} programados
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-3">
            <div className="flex-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-center border border-emerald-200 dark:border-emerald-800">
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 leading-none">
                {executed.length}
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-semibold mt-0.5">
                Ejecutadas
              </p>
            </div>
            <div className="flex-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-center border border-rose-200 dark:border-rose-800">
              <p className="text-2xl font-black text-rose-700 dark:text-rose-400 leading-none">
                {pending.length}
              </p>
              <p className="text-[10px] text-rose-600 dark:text-rose-500 font-semibold mt-0.5">
                Pendientes
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {inspecciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Car className="w-8 h-8 opacity-30" />
              <p className="text-sm">Sin inspecciones este día</p>
            </div>
          ) : (
            inspecciones.map((ins) => {
              const exec = isExecuted(ins, year, month);
              return (
                <div
                  key={ins.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl p-3 border",
                    exec
                      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                      : "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800",
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                      exec ? "bg-emerald-500" : "bg-rose-500",
                    )}
                  >
                    {exec ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <Clock className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{ins.callsign}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {ins.estado} · {exec ? "Ejecutada" : "Pendiente"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Próxima: {ins.fecha_proxima}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Última: {ins.fecha_creacion}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] shrink-0",
                      exec
                        ? "border-emerald-400 text-emerald-700"
                        : "border-rose-400 text-rose-700",
                    )}
                  >
                    {exec ? "✓ Ejecutada" : "⏳ Pendiente"}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Vista Mes ────────────────────────────────────────────────────────────────

function MonthView({
  year,
  month,
  schedule,
  today,
  onSelectDay,
  selectedDay,
}: {
  year: number;
  month: number;
  schedule: Record<string, Inspeccion[]>;
  today: Date;
  onSelectDay: (dateStr: string, insps: Inspeccion[]) => void;
  selectedDay: string | null;
}) {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = toDateStr(today);

  const cells: (null | number)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {WD_SHORT.map((h, i) => (
          <div
            key={h}
            className={cn(
              "text-center text-[11px] font-bold py-2 uppercase tracking-widest",
              i >= 5 ? "text-muted-foreground/40" : "text-muted-foreground",
            )}
          >
            {h}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border">
        {cells.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`e-${idx}`}
                className={cn(
                  "min-h-[90px]",
                  idx % 7 >= 5 ? "bg-muted/30" : "bg-muted/10",
                )}
              />
            );
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayInsps = schedule[dateStr] ?? [];
          const isToday = dateStr === todayStr;
          const isWeekend = idx % 7 >= 5;
          const isSelected = selectedDay === dateStr;
          const hasInsps = dayInsps.length > 0;

          const MAX_VISIBLE = 6;
          const visible = dayInsps.slice(0, MAX_VISIBLE);
          const overflow = dayInsps.length - visible.length;

          return (
            <button
              key={dateStr}
              onClick={() =>
                hasInsps && !isWeekend && onSelectDay(dateStr, dayInsps)
              }
              className={cn(
                "min-h-[90px] p-1.5 text-left flex flex-col gap-1 transition-colors focus-visible:outline-none",
                isWeekend
                  ? "bg-muted/20 cursor-default"
                  : isSelected
                    ? "bg-blue-50 dark:bg-blue-950/40"
                    : isToday
                      ? "bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                      : hasInsps
                        ? "bg-card hover:bg-muted/20 cursor-pointer"
                        : "bg-card cursor-default",
              )}
            >
              <span
                className={cn(
                  "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0",
                  isToday
                    ? "bg-blue-500 text-white"
                    : isSelected
                      ? "bg-blue-200 text-blue-800"
                      : isWeekend
                        ? "text-muted-foreground/40"
                        : "text-foreground",
                )}
              >
                {day}
              </span>

              {hasInsps && !isWeekend && (
                <div className="flex flex-wrap gap-2px">
                  {visible.map((ins) => (
                    <CsBadge
                      key={ins.id}
                      ins={ins}
                      executed={isExecuted(ins, year, month)}
                    />
                  ))}
                  {overflow > 0 && (
                    <span className="inline-flex items-center text-[10px] text-muted-foreground font-semibold px-1">
                      +{overflow} más
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Vista Semana ─────────────────────────────────────────────────────────────

function WeekView({
  year,
  month,
  schedule,
  today,
  onSelectDay,
  selectedDay,
}: {
  year: number;
  month: number;
  schedule: Record<string, Inspeccion[]>;
  today: Date;
  onSelectDay: (dateStr: string, insps: Inspeccion[]) => void;
  selectedDay: string | null;
}) {
  const todayStr = toDateStr(today);
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const allDays: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => new Date(year, month, i + 1),
    ),
  ];
  while (allDays.length % 7 !== 0) allDays.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < allDays.length; i += 7)
    weeks.push(allDays.slice(i, i + 7));

  return (
    <div className="space-y-2">
      {weeks.map((wk, wi) => (
        <div
          key={wi}
          className="grid grid-cols-7 border rounded-xl overflow-hidden divide-x bg-border gap-px"
        >
          {wk.map((d, di) => {
            if (!d) {
              return (
                <div
                  key={`ep-${di}`}
                  className={cn(
                    "min-h-[100px]",
                    di >= 5 ? "bg-muted/30" : "bg-muted/10",
                  )}
                />
              );
            }

            const dateStr = toDateStr(d);
            const dayInsps = schedule[dateStr] ?? [];
            const isToday = dateStr === todayStr;
            const isWeekend = di >= 5;
            const isSelected = selectedDay === dateStr;
            const hasInsps = dayInsps.length > 0;

            const MAX_VISIBLE = 8;
            const visible = dayInsps.slice(0, MAX_VISIBLE);
            const overflow = dayInsps.length - visible.length;

            return (
              <button
                key={dateStr}
                onClick={() =>
                  hasInsps && !isWeekend && onSelectDay(dateStr, dayInsps)
                }
                className={cn(
                  "p-1.5 min-h-[100px] text-left flex flex-col gap-1 transition-colors focus-visible:outline-none",
                  isWeekend
                    ? "bg-muted/20 cursor-default"
                    : isSelected
                      ? "bg-blue-50 dark:bg-blue-950/40"
                      : isToday
                        ? "bg-blue-50/60 hover:bg-blue-50"
                        : hasInsps
                          ? "bg-card hover:bg-muted/20 cursor-pointer"
                          : "bg-card cursor-default",
                )}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <span
                    className={cn(
                      "text-[9px] font-bold uppercase",
                      isWeekend
                        ? "text-muted-foreground/40"
                        : "text-muted-foreground",
                    )}
                  >
                    {WD_SHORT[di]}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-black w-5 h-5 flex items-center justify-center rounded-full",
                      isToday
                        ? "bg-blue-500 text-white"
                        : isSelected
                          ? "bg-blue-200 text-blue-800"
                          : "text-foreground",
                    )}
                  >
                    {d.getDate()}
                  </span>
                </div>

                {hasInsps && !isWeekend && (
                  <div className="flex flex-wrap gap-2px">
                    {visible.map((ins) => (
                      <CsBadge
                        key={ins.id}
                        ins={ins}
                        executed={isExecuted(ins, year, month)}
                      />
                    ))}
                    {overflow > 0 && (
                      <span className="inline-flex items-center text-[10px] text-muted-foreground font-semibold px-1">
                        +{overflow}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Vista Lista ──────────────────────────────────────────────────────────────

function ListView({
  year,
  month,
  schedule,
  today,
  onSelectDay,
  selectedDay,
}: {
  year: number;
  month: number;
  schedule: Record<string, Inspeccion[]>;
  today: Date;
  onSelectDay: (dateStr: string, insps: Inspeccion[]) => void;
  selectedDay: string | null;
}) {
  const todayStr = toDateStr(today);
  const activeDays = Object.entries(schedule)
    .filter(([, ins]) => ins.length > 0)
    .sort(([a], [b]) => a.localeCompare(b));

  if (activeDays.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-muted-foreground gap-3">
        <Car className="w-10 h-10 opacity-30" />
        <p className="text-sm">Sin inspecciones programadas este mes</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {activeDays.map(([dateStr, dayInsps]) => {
        const [dy, dm, dd] = dateStr.split("-").map(Number);
        const d = new Date(dy, dm - 1, dd);
        const isToday = dateStr === todayStr;
        const isSelected = selectedDay === dateStr;
        const executed = dayInsps.filter((i) => isExecuted(i, year, month));
        const pending = dayInsps.filter((i) => !isExecuted(i, year, month));

        return (
          <button
            key={dateStr}
            onClick={() => onSelectDay(dateStr, dayInsps)}
            className={cn(
              "w-full text-left rounded-xl border px-4 py-3 flex items-start gap-4 transition-colors focus-visible:outline-none",
              isSelected
                ? "ring-2 ring-blue-500 border-blue-400 bg-blue-50/40 dark:bg-blue-950/20"
                : isToday
                  ? "border-blue-300 bg-blue-50/30 hover:bg-blue-50"
                  : "border-border hover:bg-muted/10",
            )}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0",
                isToday ? "bg-blue-500 text-white" : "bg-muted",
              )}
            >
              <span className="text-[9px] font-bold uppercase opacity-70">
                {WD_SHORT[(d.getDay() + 6) % 7]}
              </span>
              <span className="text-xl font-black leading-none">{dd}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <p className="text-sm font-bold capitalize">
                    {WD_FULL[(d.getDay() + 6) % 7]}, {dd} de{" "}
                    {MONTH_NAMES[dm - 1]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dayInsps.length} móvil{dayInsps.length !== 1 ? "es" : ""}
                    {executed.length > 0 && (
                      <span className="text-emerald-600 ml-1">
                        · {executed.length} ejecutada
                        {executed.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {pending.length > 0 && (
                      <span className="text-rose-600 ml-1">
                        · {pending.length} pendiente
                        {pending.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {dayInsps.map((ins) => (
                  <CsBadge
                    key={ins.id}
                    ins={ins}
                    executed={isExecuted(ins, year, month)}
                  />
                ))}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({
  inspecciones,
  schedule,
  year,
  month,
}: {
  inspecciones: Inspeccion[];
  schedule: Record<string, Inspeccion[]>;
  year: number;
  month: number;
}) {
  const monthInsps = groupByMonth(inspecciones)[`${year}-${month}`] ?? [];
  const executed = monthInsps.filter((i) => isExecuted(i, year, month));
  const pending = monthInsps.filter((i) => !isExecuted(i, year, month));
  const weekdays = getWeekdays(year, month);
  const activeDays = Object.values(schedule).filter((d) => d.length > 0).length;

  const stats = [
    {
      label: "Total móviles",
      value: monthInsps.length,
      icon: Car,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-200 dark:border-blue-800",
    },
    {
      label: "Ejecutadas",
      value: executed.length,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-200 dark:border-emerald-800",
    },
    {
      label: "Pendientes",
      value: pending.length,
      icon: Clock,
      color: "text-rose-600",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      border: "border-rose-200 dark:border-rose-800",
    },
    {
      label: "Días con agenda",
      value: `${activeDays}/${weekdays.length}`,
      icon: CalendarDays,
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-950/40",
      border: "border-violet-200 dark:border-violet-800",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
        <div
          key={label}
          className={cn(
            "rounded-xl p-4 flex items-center gap-3 border",
            bg,
            border,
          )}
        >
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center bg-white/70 dark:bg-black/20 shrink-0",
              color,
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium leading-tight">
              {label}
            </p>
            <p className={cn("text-2xl font-black leading-none mt-0.5", color)}>
              {value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

export default function CalendarioInspeccionesPage() {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [view, setView] = useState<ViewMode>("month");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [sheetInsps, setSheetInsps] = useState<Inspeccion[]>([]);

  // ── Estado de carga ──
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchAllInspecciones()
      .then(setInspecciones)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const schedule = useMemo(
    () => buildSchedule(inspecciones, year, month),
    [inspecciones, year, month],
  );

  function handleSelectDay(dateStr: string, dayInsps: Inspeccion[]) {
    setSelectedDay(dateStr);
    setSheetInsps(dayInsps);
  }
  function handleCloseSheet() {
    setSelectedDay(null);
    setSheetInsps([]);
  }
  function prevMonth() {
    setSelectedDay(null);
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    setSelectedDay(null);
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }
  function goToday() {
    setSelectedDay(null);
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4 pb-12 space-y-4">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            Agenda de Inspecciones
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Distribución automática por días hábiles · clic en un día para ver
            detalle
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{" "}
              Ejecutada
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-500" /> Pendiente
            </span>
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
            <TabsList className="h-8">
              <TabsTrigger value="month" className="text-xs px-2.5 gap-1">
                <LayoutGrid className="w-3.5 h-3.5" /> Mes
              </TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-2.5 gap-1">
                <CalendarDays className="w-3.5 h-3.5" /> Semana
              </TabsTrigger>
              <TabsTrigger value="list" className="text-xs px-2.5 gap-1">
                <List className="w-3.5 h-3.5" /> Lista
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Estado de carga / error */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando inspecciones...</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800 px-4 py-3 text-rose-700 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Error al cargar datos</p>
            <p className="text-xs opacity-80">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto text-xs h-7 border-rose-300"
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchAllInspecciones()
                .then(setInspecciones)
                .catch((e: Error) => setError(e.message))
                .finally(() => setLoading(false));
            }}
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* Contenido principal — solo cuando hay datos */}
      {!loading && !error && (
        <>
          <StatsBar
            inspecciones={inspecciones}
            schedule={schedule}
            year={year}
            month={month}
          />

          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevMonth}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h2 className="text-base font-black min-w-44 text-center">
                    {MONTH_NAMES[month]} {year}
                  </h2>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextMonth}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToday}
                  className="text-xs h-8"
                >
                  Hoy
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              {view === "month" && (
                <MonthView
                  year={year}
                  month={month}
                  schedule={schedule}
                  today={today}
                  onSelectDay={handleSelectDay}
                  selectedDay={selectedDay}
                />
              )}
              {view === "week" && (
                <WeekView
                  year={year}
                  month={month}
                  schedule={schedule}
                  today={today}
                  onSelectDay={handleSelectDay}
                  selectedDay={selectedDay}
                />
              )}
              {view === "list" && (
                <ListView
                  year={year}
                  month={month}
                  schedule={schedule}
                  today={today}
                  onSelectDay={handleSelectDay}
                  selectedDay={selectedDay}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}

      <DayDetailSheet
        dateStr={selectedDay}
        inspecciones={sheetInsps}
        year={year}
        month={month}
        onClose={handleCloseSheet}
      />
    </div>
  );
}
