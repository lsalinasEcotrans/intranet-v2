"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Car,
  TrendingUp,
  Clock,
  Route,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  Plane,
  Pickaxe,
  Landmark,
} from "lucide-react";
import {
  useVehicleWeekReport,
  useVehiclePeriodReport,
  type BookingService,
} from "./usevehiclereport";

const PAGE_SIZE = 10;

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatTime(iso: string | null | undefined) {
  if (!iso) return "-";
  // Reemplazar el offset -hh:mm por Z equivalente para que Date lo parsee bien
  // o extraer hora/minuto directamente del string si tiene formato conocido
  const timePart = iso.slice(11, 16); // "HH:MM"
  if (timePart && timePart.includes(":")) return timePart;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const datePart = iso.slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return "-";
  const d = new Date(year, month - 1, day, 12, 0, 0);
  return d.toLocaleDateString("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// Parsea "YYYY-MM-DDThh:mm:ss.sss±hh:mm" extrayendo solo la fecha local
// sin dejarla convertir a UTC (que puede cambiar el día).
function formatDateShort(iso: string) {
  if (!iso) return "-";
  // Tomar solo los primeros 10 caracteres "YYYY-MM-DD" + T12:00:00 para evitar
  // que el offset desplace el día al formatear
  const datePart = iso.slice(0, 10); // "YYYY-MM-DD"
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return "-";
  // Construir con hora fija al mediodía para que no cambie de día por el offset
  const d = new Date(year, month - 1, day, 12, 0, 0);
  return d.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function shortAddress(text: string) {
  return text.split(",")[0].trim();
}

function bookingStatus(b: BookingService) {
  const reason = b.archivedBooking?.reason?.toLowerCase() ?? "";
  if (reason === "completed")
    return {
      label: "Completado",
      color: "text-green-600 dark:text-green-400",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    };
  if (reason.includes("cancel"))
    return {
      label: "Cancelado",
      color: "text-red-500",
      icon: <XCircle className="h-3.5 w-3.5" />,
    };
  return {
    label: reason || "En curso",
    color: "text-yellow-600",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  };
}

function PeriodBlock({
  totalServices,
  totalCost,
  periodFrom,
  periodTo,
  isLoading,
}: {
  totalServices: number;
  totalCost: number;
  periodFrom: string;
  periodTo: string;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
        <Skeleton className="h-4 w-40 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CalendarRange className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wide">
          Período de facturación
        </span>
      </div>
      <p className="text-xs text-muted-foreground -mt-1">
        {formatDateShort(periodFrom)} — {formatDateShort(periodTo)}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-background border p-3">
          <p className="text-xs text-muted-foreground mb-1">
            Servicios del período
          </p>
          <p className="text-2xl font-bold leading-none">{totalServices}</p>
        </div>
        <div className="rounded-lg bg-background border p-3">
          <p className="text-xs text-muted-foreground mb-1">Total facturado</p>
          <p className="text-2xl font-bold leading-none text-green-600 dark:text-green-400">
            {formatCLP(totalCost)}
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryBlock({
  totalServices,
  totalCost,
  totalDistanceKm,
  avgDurationMin,
}: {
  totalServices: number;
  totalCost: number;
  totalDistanceKm: number;
  avgDurationMin: number;
}) {
  const metrics = [
    {
      icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
      label: "Servicios",
      value: totalServices.toString(),
      sub: "últimos 7 días",
    },
    {
      icon: <Car className="h-5 w-5 text-green-500" />,
      label: "Facturación",
      value: formatCLP(totalCost),
      sub: "costo operacional",
    },
    {
      icon: <Route className="h-5 w-5 text-purple-500" />,
      label: "Distancia total",
      value: `${totalDistanceKm.toFixed(1)} km`,
      sub: `~${totalServices > 0 ? (totalDistanceKm / totalServices).toFixed(1) : 0} km/serv.`,
    },
    {
      icon: <Clock className="h-5 w-5 text-orange-500" />,
      label: "Duración promedio",
      value: `${Math.round(avgDurationMin)} min`,
      sub: "por servicio",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-xl border bg-muted/40 p-3 flex flex-col gap-1.5"
        >
          <div className="flex items-center gap-2">
            {m.icon}
            <span className="text-xs text-muted-foreground font-medium">
              {m.label}
            </span>
          </div>
          <p className="text-xl font-semibold leading-none">{m.value}</p>
          <p className="text-xs text-muted-foreground">{m.sub}</p>
        </div>
      ))}
    </div>
  );
}

function ServicesTable({ bookings }: { bookings: BookingService[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = bookings.slice(start, start + PAGE_SIZE);

  if (bookings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No hay servicios en este período
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
              <th className="px-3 py-2.5 text-left font-medium">ID</th>
              <th className="px-3 py-2.5 text-left font-medium">Hora</th>
              <th className="px-3 py-2.5 text-left font-medium">Cliente</th>
              <th className="px-3 py-2.5 text-left font-medium">
                Origen → Destino
              </th>
              <th className="px-3 py-2.5 text-right font-medium">Costo</th>
              <th className="px-3 py-2.5 text-center font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pageItems.map((b) => {
              const status = bookingStatus(b);
              const autoId = b.archivedBooking?.originalAutoID ?? b.id;
              return (
                <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    #{autoId}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-xs">
                    {formatTime(b.pickupDueTime)}
                  </td>
                  <td className="px-3 py-2.5 max-w-[110px]">
                    <span className="truncate block text-xs font-medium">
                      {b.customerDisplayName || "-"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 max-w-[200px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="truncate text-xs text-muted-foreground">
                        {shortAddress(b.pickup?.address?.text ?? "-")}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50">
                        ↓
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {shortAddress(b.destination?.address?.text ?? "-")}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap font-medium text-xs">
                    {formatCLP(b.pricing?.cost ?? 0)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${status.color}`}
                    >
                      {status.icon}
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/50">
              <td
                colSpan={4}
                className="px-3 py-2 text-xs text-muted-foreground"
              >
                Página {page} de {totalPages} · {bookings.length} servicios en
                total
              </td>
              <td className="px-3 py-2 text-right text-xs font-bold">
                {formatCLP(
                  bookings.reduce((a, b) => a + (b.pricing?.cost ?? 0), 0),
                )}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 gap-1 text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Anterior
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages,
              )
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span
                    key={`e-${i}`}
                    className="px-1 text-xs text-muted-foreground"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`h-8 w-8 rounded-md text-xs font-medium transition-colors ${page === p ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
                  >
                    {p}
                  </button>
                ),
              )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-8 gap-1 text-xs"
          >
            Siguiente
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

function WeekCalendar({ byDay }: { byDay: Record<string, BookingService[]> }) {
  const days = Object.entries(byDay);
  const maxCount = Math.max(...days.map(([, arr]) => arr.length), 1);
  return (
    <div className="space-y-2">
      {days.map(([dateKey, dayBookings]) => {
        const count = dayBookings.length;
        const pct = count / maxCount;
        const dayCost = dayBookings.reduce(
          (a, b) => a + (b.pricing?.cost ?? 0),
          0,
        );
        const barColor =
          count === 0
            ? "bg-muted"
            : pct >= 0.8
              ? "bg-green-500"
              : pct >= 0.4
                ? "bg-yellow-400"
                : "bg-orange-400";
        return (
          <div key={dateKey} className="flex items-center gap-3">
            <span className="w-24 text-xs text-muted-foreground shrink-0 capitalize">
              {formatDate(dateKey + "T12:00:00")}
            </span>
            <div className="flex-1 h-6 rounded-md bg-muted overflow-hidden relative">
              <div
                className={`h-full rounded-md transition-all duration-500 ${barColor}`}
                style={{
                  width: count === 0 ? "3px" : `${Math.max(pct * 100, 8)}%`,
                }}
              />
              {count > 0 && (
                <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white mix-blend-luminosity">
                  {count} {count === 1 ? "servicio" : "servicios"}
                </span>
              )}
            </div>
            <span className="w-24 text-right text-xs font-medium shrink-0">
              {count > 0 ? (
                formatCLP(dayCost)
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm z-10">
      <div className="h-10 w-10 rounded-full border-4 border-muted border-t-primary animate-spin mb-3" />
      <p className="text-sm font-medium">Cargando reporte del móvil...</p>
      <p className="text-xs text-muted-foreground">
        Esto puede tardar unos segundos
      </p>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-6 pt-2">
      <Skeleton className="h-28 rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-md" />
        ))}
      </div>
      <div className="space-y-2">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-6 rounded-md" />
        ))}
      </div>
    </div>
  );
}

interface VehicleReportDialogProps {
  vehicleId: number | null;
  callsign: string | null;
  capabilities?: number[];
  onClose: () => void;
}

// Mapa de capability id → icono + etiqueta
const CAPABILITY_MAP: Record<number, { icon: React.ReactNode; label: string }> =
  {
    4: { icon: <Plane className="h-3.5 w-3.5" />, label: "Aeropuerto" },
    8: { icon: <Pickaxe className="h-3.5 w-3.5" />, label: "Minería" },
    15: { icon: <Landmark className="h-3.5 w-3.5" />, label: "Fiscalía" },
  };

export function VehicleReportDialog({
  vehicleId,
  callsign,
  capabilities = [],
  onClose,
}: VehicleReportDialogProps) {
  const week = useVehicleWeekReport(vehicleId);
  const period = useVehiclePeriodReport(vehicleId);

  const isLoading = week.isLoading || period.isLoading;
  const isError = week.isError || period.isError;

  return (
    <Dialog open={!!vehicleId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="min-w-[60vw] max-h-[90vh] overflow-y-auto">
        {/* 🔥 barra de carga */}
        {isLoading && <LoadingOverlay />}
        <DialogHeader>
          <div className="flex items-center gap-3">
            {/* Badge callsign */}
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-lg leading-none">
                {callsign}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl">Móvil {callsign}</DialogTitle>
              <DialogDescription>Reporte de actividad</DialogDescription>

              {/* Capabilities */}
              {capabilities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {capabilities
                    .filter((id) => id in CAPABILITY_MAP)
                    .map((id) => {
                      const cap = CAPABILITY_MAP[id];
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium"
                        >
                          {cap.icon}
                          {cap.label}
                        </span>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {isLoading && <ReportSkeleton />}

        {isError && !isLoading && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              No se pudo cargar el reporte.
            </p>
          </div>
        )}

        {!isLoading && !isError && week.data && period.data && (
          <div className="space-y-8 pt-2">
            <PeriodBlock
              totalServices={period.data.totalServices}
              totalCost={period.data.totalCost}
              periodFrom={period.data.periodFrom}
              periodTo={period.data.periodTo}
              isLoading={false}
            />

            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Resumen · últimos 7 días
              </h3>
              <SummaryBlock
                totalServices={week.data.totalServices}
                totalCost={week.data.totalCost}
                totalDistanceKm={week.data.totalDistanceKm}
                avgDurationMin={week.data.avgDurationMin}
              />
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Detalle de servicios
                </h3>
                <Badge variant="secondary" className="font-mono">
                  {week.data.totalServices} servicios
                </Badge>
              </div>
              <ServicesTable bookings={week.data.bookings} />
            </section>

            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Actividad últimos 7 días
              </h3>
              <WeekCalendar byDay={week.data.byDay} />
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
