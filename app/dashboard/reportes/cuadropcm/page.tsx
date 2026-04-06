"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Landmark, Plane, Pickaxe } from "lucide-react";
import { VehicleReportDialog } from "./vehiclereportdialog";

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
interface Vehicle {
  id: number;
  callsign?: string;
  isActive?: boolean;
  isSuspended?: boolean;
  vehicleType?: string;
  size?: number;
  capabilities?: number[];
}

interface Driver {
  id: number;
  callsign?: string;
  forename?: string;
  surname?: string;
  postalAddress?: { region?: string };
}

interface FlotaData {
  vehicles: Vehicle[];
  drivers: Driver[];
  bookingsCount: Map<string, number>;
  totalBookings: number;
  totalPages: number;
}

// ─────────────────────────────────────────────
// FILTROS DE EXCLUSIÓN
// ─────────────────────────────────────────────
const HIDDEN_CALLSIGNS = new Set([6, 18]);

function isExcludedCallsign(callsign: string | undefined): boolean {
  if (!callsign) return false;
  const num = parseInt(callsign, 10);
  if (isNaN(num)) return false;
  if (HIDDEN_CALLSIGNS.has(num)) return true;
  if (num >= 600 && num <= 699) return true;
  if (num >= 900 && num <= 999) return true;
  if (num >= 1000 && num <= 9999) return true;
  return false;
}

// ─────────────────────────────────────────────
// FETCHER — un solo Promise.all para los 3 endpoints
// React Query llama a esta función y cachea el resultado completo
// ─────────────────────────────────────────────
async function fetchFlotaData(): Promise<FlotaData> {
  const [vehiclesRes, driversRes, bookingsRes] = await Promise.all([
    fetch("/api/ghost/vehicles"),
    fetch("/api/ghost/drivers"),
    fetch("/api/ghost/bookings/search", { method: "POST" }),
  ]);

  if (!vehiclesRes.ok) throw new Error(`Vehicles: ${vehiclesRes.status}`);
  if (!driversRes.ok) throw new Error(`Drivers: ${driversRes.status}`);
  if (!bookingsRes.ok) throw new Error(`Bookings: ${bookingsRes.status}`);

  const [vehiclesData, driversData, bookingsData] = await Promise.all([
    vehiclesRes.json(),
    driversRes.json(),
    bookingsRes.json(),
  ]);

  const vehicles: Vehicle[] = Array.isArray(vehiclesData)
    ? vehiclesData
    : [vehiclesData];
  const drivers: Driver[] = Array.isArray(driversData)
    ? driversData
    : [driversData];

  // Construir mapa callsign → count
  const bookingsCount = new Map<string, number>();
  bookingsData.bookings?.forEach((b: any) => {
    const cs =
      b.archivedBooking?.vehicle?.callsign ||
      b.vehicle?.callsign ||
      b.dispatchedBooking?.vehicle?.callsign ||
      null;
    if (!cs) return;
    bookingsCount.set(cs, (bookingsCount.get(cs) || 0) + 1);
  });

  return {
    vehicles,
    drivers,
    bookingsCount,
    totalBookings: bookingsData.totalBookings ?? 0,
    totalPages: bookingsData.totalPages ?? 0,
  };
}

// ─────────────────────────────────────────────
// PRELOADER — solo visible en primera carga
// ─────────────────────────────────────────────
type StepId = "flota" | "servicios" | "procesando";
type StepStatus = "pending" | "running" | "done" | "error";

interface StepState {
  status: StepStatus;
  elapsed: number;
}

const LOADER_STEPS: { id: StepId; label: string }[] = [
  { id: "flota", label: "Cargando flota disponible" },
  { id: "servicios", label: "Cargando servicios realizados" },
  { id: "procesando", label: "Validando y preparando datos" },
];

function useAnimatedProgress(status: StepStatus): number {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (status === "pending") {
      setProgress(0);
      return;
    }

    if (status === "running") {
      setProgress(0);
      startRef.current = performance.now();
      const animate = () => {
        const p =
          85 * (1 - Math.exp(-(performance.now() - startRef.current) / 2000));
        setProgress(p);
        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }

    if (status === "done" || status === "error") {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setProgress(100);
    }
  }, [status]);

  return progress;
}

function StepRow({ label, state }: { label: string; state: StepState }) {
  const progress = useAnimatedProgress(state.status);

  const barColor =
    state.status === "error"
      ? "bg-red-500"
      : state.status === "done"
        ? "bg-green-500"
        : "bg-primary";

  const labelColor =
    state.status === "pending"
      ? "text-muted-foreground"
      : state.status === "done"
        ? "text-green-600 dark:text-green-400"
        : state.status === "error"
          ? "text-red-500"
          : "text-foreground";

  const right =
    state.status === "done" || state.status === "error"
      ? `${(state.elapsed / 1000).toFixed(2)}s`
      : state.status === "running"
        ? `${Math.round(progress)}%`
        : "";

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <span
          className={`text-sm font-medium transition-colors duration-300 ${labelColor}`}
        >
          {label}
        </span>
        <span className="text-xs text-muted-foreground font-mono tabular-nums w-16 text-right">
          {right}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{
            width: `${progress}%`,
            transition:
              state.status === "done" ? "width 0.3s ease-out" : "none",
          }}
        />
      </div>
    </div>
  );
}

// El preloader simula 3 pasos secuenciales con tiempos aproximados
// mientras el fetch real corre en paralelo.
// Cuando isFetching pasa a false, todos los pasos saltan a "done".
function FlotaLoader({
  isFetching,
  isError,
}: {
  isFetching: boolean;
  isError: boolean;
}) {
  const [steps, setSteps] = useState<Record<StepId, StepState>>({
    flota: { status: "pending", elapsed: 0 },
    servicios: { status: "pending", elapsed: 0 },
    procesando: { status: "pending", elapsed: 0 },
  });

  // Avanza los pasos secuencialmente mientras carga
  useEffect(() => {
    if (!isFetching) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const t0 = performance.now();

    setSteps({
      flota: { status: "running", elapsed: 0 },
      servicios: { status: "pending", elapsed: 0 },
      procesando: { status: "pending", elapsed: 0 },
    });

    // Paso 2 arranca a los 800ms
    timers.push(
      setTimeout(() => {
        setSteps((prev) => ({
          ...prev,
          flota: {
            status: "done",
            elapsed: Math.round(performance.now() - t0),
          },
          servicios: { status: "running", elapsed: 0 },
        }));
      }, 800),
    );

    // Paso 3 arranca a los 1600ms
    timers.push(
      setTimeout(() => {
        setSteps((prev) => ({
          ...prev,
          servicios: {
            status: "done",
            elapsed: Math.round(performance.now() - t0) - 800,
          },
          procesando: { status: "running", elapsed: 0 },
        }));
      }, 1600),
    );

    return () => timers.forEach(clearTimeout);
  }, [isFetching]);

  // Cuando el fetch real termina, completar todos los pasos pendientes
  useEffect(() => {
    if (isFetching) return;

    const now = performance.now();
    setSteps((prev) => {
      const next = { ...prev };
      (Object.keys(next) as StepId[]).forEach((id) => {
        if (next[id].status !== "done") {
          next[id] = {
            status: isError ? "error" : "done",
            elapsed: next[id].status === "running" ? Math.round(now) : 0,
          };
        }
      });
      return next;
    });
  }, [isFetching, isError]);

  const allDone = Object.values(steps).every(
    (s) => s.status === "done" || s.status === "error",
  );
  const totalMs = Object.values(steps).reduce((acc, s) => acc + s.elapsed, 0);

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] gap-10">
      <div
        className={`relative w-12 h-12 transition-opacity duration-500 ${
          allDone ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="absolute inset-0 rounded-full border-4 border-muted" />
        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>

      <div className="w-full max-w-sm space-y-5">
        {LOADER_STEPS.map((step) => (
          <StepRow key={step.id} label={step.label} state={steps[step.id]} />
        ))}
      </div>

      <p
        className={`text-xs text-muted-foreground font-mono transition-opacity duration-500 ${
          allDone ? "opacity-100" : "opacity-0"
        }`}
      >
        Listo en {(totalMs / 1000).toFixed(2)}s
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// BADGE de actualización en background
// ─────────────────────────────────────────────
function BackgroundRefetchBadge({ isFetching }: { isFetching: boolean }) {
  if (!isFetching) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      Actualizando en background...
    </div>
  );
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function getVehicleInfo(v: Vehicle) {
  return `${v.vehicleType || "-"} · ${v.size ? v.size + " pax" : "-"}`;
}

function getStatusColor(v: Vehicle, bookingsCount: Map<string, number>) {
  if (v.isSuspended) return "bg-blue-500 text-white";
  const count = bookingsCount.get(v.callsign || "") || 0;
  if (count > 7) return "bg-green-500 text-white";
  if (count >= 3) return "bg-yellow-400 text-black";
  return "bg-red-500 text-white";
}

function renderIcons(v: Vehicle) {
  return v.capabilities
    ?.filter((id) => [4, 8, 15].includes(id))
    .map((id) => {
      switch (id) {
        case 4:
          return <Plane key={id} className="h-4 w-4" />;
        case 8:
          return <Pickaxe key={id} className="h-4 w-4" />;
        case 15:
          return <Landmark key={id} className="h-4 w-4" />;
        default:
          return null;
      }
    });
}

// ─────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────
export default function FlotaPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<{
    id: number;
    callsign: string;
    capabilities: number[];
  } | null>(null);

  const { data, isFetching, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["flota"],
    queryFn: fetchFlotaData,

    // Datos frescos por 5 minutos — sin refetch innecesario
    staleTime: 5 * 60 * 1000,

    // Cache vive 10 minutos después de que el componente se desmonte
    gcTime: 10 * 60 * 1000,

    // Refetch silencioso en background cada 1 minuto
    refetchInterval: 60 * 1000,

    // También revalida cuando el usuario vuelve a la pestaña
    refetchOnWindowFocus: true,

    // Solo muestra error si falla, no lanza excepción
    retry: 1,
  });

  // Mapa de drivers indexado por callsign
  const driversMap = useMemo(() => {
    const map = new Map<string, Driver>();
    data?.drivers.forEach((d) => {
      if (d.callsign) map.set(d.callsign, d);
    });
    return map;
  }, [data?.drivers]);

  // Vehículos filtrados y ordenados
  const filteredVehicles = useMemo(() => {
    if (!data) return [];
    return data.vehicles
      .filter((v) => v.isActive)
      .filter((v) => !isExcludedCallsign(v.callsign))
      .filter((v) => {
        const s = searchTerm.toLowerCase();
        const d = v.callsign ? driversMap.get(v.callsign) : undefined;
        const name = `${d?.forename ?? ""} ${d?.surname ?? ""}`;
        return (
          v.callsign?.toLowerCase().includes(s) ||
          name.toLowerCase().includes(s)
        );
      })
      .sort(
        (a, b) => parseInt(a.callsign || "0") - parseInt(b.callsign || "0"),
      );
  }, [data, searchTerm, driversMap]);

  const getRegion = useCallback(
    (callsign?: string) =>
      driversMap.get(callsign || "")?.postalAddress?.region || "-",
    [driversMap],
  );

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString()
    : null;

  // ── Primera carga: no hay datos en cache ──
  // isFetching=true Y data=undefined → mostrar preloader animado
  if (!data) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-8">Flota Operativa</h1>
        {isError ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
            <p className="text-destructive font-medium">
              Error al cargar los datos
            </p>
            <Button onClick={() => refetch()}>Reintentar</Button>
          </div>
        ) : (
          <FlotaLoader isFetching={isFetching} isError={isError} />
        )}
      </div>
    );
  }

  // ── Cache disponible: mostrar datos inmediatamente ──
  // Si isFetching=true aquí es un refetch silencioso en background
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Flota Operativa</h1>
        <BackgroundRefetchBadge isFetching={isFetching} />
      </div>

      <Card className="p-4 bg-gray-50">
        <p className="text-sm font-semibold mb-3">Leyenda de estados:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { color: "bg-green-500", label: "Muy ocupado (>7)" },
            { color: "bg-yellow-400", label: "Ocupado (3-7)" },
            { color: "bg-red-500", label: "Disponible (<3)" },
            { color: "bg-blue-500", label: "Suspendido" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded ${color}`} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex gap-4 justify-between mb-4">
          <Input
            placeholder="Buscar por callsign o conductor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Button
            onClick={() => refetch()}
            disabled={isFetching}
            variant="outline"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
            />
            {isFetching ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>

        {lastUpdate && (
          <p className="text-xs text-muted-foreground mb-4">
            Última actualización: {lastUpdate}
          </p>
        )}

        {filteredVehicles.length === 0 ? (
          <div className="flex justify-center py-10 text-muted-foreground">
            <p>No se encontraron vehículos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {filteredVehicles.map((v) => (
              <button
                key={v.id}
                onClick={() =>
                  setSelectedVehicle({
                    id: v.id,
                    callsign: v.callsign ?? "",
                    capabilities: v.capabilities ?? [],
                  })
                }
                className={`h-40 rounded-xl border-2 p-2 flex flex-col items-center justify-center text-center transition-all hover:shadow-lg hover:scale-105 active:scale-95 cursor-pointer ${getStatusColor(v, data.bookingsCount)}`}
              >
                <span className="text-xl font-bold">{v.callsign || "N/A"}</span>
                <span className="text-xs mt-1 opacity-90">
                  {getVehicleInfo(v)}
                </span>
                <div className="flex gap-1 mt-1">{renderIcons(v)}</div>
                <span className="text-[11px] mt-1 break-word leading-tight opacity-90">
                  {getRegion(v.callsign)}
                </span>
                <span className="text-[10px] mt-1 font-semibold">
                  {data.bookingsCount.get(v.callsign || "") || 0} serv.
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Dialog de reporte por móvil */}
      <VehicleReportDialog
        vehicleId={selectedVehicle?.id ?? null}
        callsign={selectedVehicle?.callsign ?? null}
        capabilities={selectedVehicle?.capabilities ?? []}
        onClose={() => setSelectedVehicle(null)}
      />
    </div>
  );
}
