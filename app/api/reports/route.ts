import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios, { AxiosResponse } from "axios";

// ─────────────────────────────────────────────
// TIPOS MEJORADOS
// ─────────────────────────────────────────────
interface Booking {
  id: number;
  pickupDueTime?: string;
  customerDisplayName?: string;
  customerId?: number;
  paymentMethod?: string;
  paymentType?: string;
  distance?: number;
  pricing?: {
    cost: number;
    fare: number;
    price: number;
    extraCost: number;
    bookingFee: number;
    waitingTime: number;
    meterDistance?: { asKilometres: number };
    gpsMeterDistance?: number;
  };
  pickup?: {
    address?: { zone?: { name: string }; text?: string };
  };
  destination?: {
    address?: { zone?: { name: string }; text?: string };
  };
  archivedBooking?: {
    vehicle?: { id: number; callsign: string };
    driver?: { id: number; callsign: string; fullName: string };
    reason?: string;
    pickedUpAtTime?: string;
    completedAtTime?: string;
    dispatchedAtTime?: string;
    vehicleArrivedAtTime?: string;
  };
}

interface BookingSearchResponse {
  bookings: Booking[];
  continuationToken?: string | null;
}

interface VehicleStats {
  vehicleId: number;
  callsign: string;
  totalServices: number;
  totalProduction: number;
  totalDistanceKm: number;
  totalWaitingMin: number;
  totalDurationMin: number;
  avgTicket: number;
  avgDurationMin: number;
  avgDistanceKm: number;
  efficiency: number;
  utilization: number; // Nuevo
}

interface ReportMetrics {
  totalProduction: number;
  totalServices: number;
  totalDistanceKm: number;
  avgTicket: number;
  avgDistanceKm: number;
  totalExtraCost: number;
  totalWaitingMin: number;
  totalWaitingHours: number;
  completionRate: number;
  avgDispatchTimeMin: number; // Nuevo
  avgOnTimeRate: number; // Nuevo
  totalVehicles: number;
  avgUtilization: number; // Nuevo
  top3Services: VehicleStats[];
  top3Production: VehicleStats[];
  top3Efficiency: VehicleStats[];
  top3Distance: VehicleStats[];
  topZoneProduction: { name: string; production: number }[]; // Nuevo
  daily: Array<{
    date: string;
    services: number;
    production: number;
    distanceKm: number;
  }>;
  hourly: Array<{ hour: number; count: number }>;
  topClients: Array<{ name: string; services: number; production: number }>;
  topZones: Array<{
    name: string;
    pickups: number;
    dropoffs: number;
    production: number;
  }>;
  serviciosFlota: number;
  montoFlota: number;
  porcentajeFlota: number;
  apoyoCount: number;
  apoyoPct: number;
  paymentMix: {
    method: string;
    count: number;
    pct: number;
  }[];
}

// ─────────────────────────────────────────────
// HELPERS DE FECHAS OPTIMIZADOS
// ─────────────────────────────────────────────
function formatDateRange(dateStr: string, end = false): string {
  const date = new Date(`${dateStr}T12:00:00`);
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); // A UTC

  const offset = "-03:00"; // Chile continental fijo
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${end ? "23:59:59.999" : "00:00:00.000"}${offset}`;
}

function shiftDaysBack(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function getPreviousPeriod(from: string, to: string) {
  const MS_PER_DAY = 86400000;

  const fromDate = new Date(from);
  const toDate = new Date(to);

  const diffDays =
    Math.round((toDate.getTime() - fromDate.getTime()) / MS_PER_DAY) + 1;

  return {
    prevFrom: shiftDaysBack(from, diffDays),
    prevTo: shiftDaysBack(to, diffDays),
  };
}

// ─────────────────────────────────────────────
// FETCHER OPTIMIZADO
// ─────────────────────────────────────────────
async function fetchAllBookings(
  token: string,
  from: string,
  to: string,
): Promise<Booking[]> {
  const all: Booking[] = [];
  let continuationToken: string | null = null;
  let page = 0;
  const maxPages = 200;

  do {
    page++;
    try {
      const response: AxiosResponse<BookingSearchResponse> = await axios.post(
        "https://ghost-main-static-b7ec98c880a54ad5a4782393902a32a2.ghostapi.app:29003/api/v2/bookings/search",
        {
          from,
          to,
          exactMatch: false,
          ignorePostcode: true,
          ignoreTown: true,
          subContractedOnly: false,
          types: ["Completed"],
          companyIds: [],
          continuationToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": `Bearer ${token}`,
          },
          timeout: 300000,
          maxRedirects: 5,
        },
      );

      all.push(...(response.data.bookings || []));
      continuationToken = response.data.continuationToken || null;

      if (!continuationToken || page >= maxPages) break;
      await new Promise((r) => setTimeout(r, 100)); // Rate limiting
    } catch (error: any) {
      console.error(`❌ Page ${page} failed:`, error.message);
      break;
    }
  } while (continuationToken);

  return all;
}

// ─────────────────────────────────────────────
// PROCESADOR ULTRA-OPTIMIZADO (1 solo loop)
// ─────────────────────────────────────────────
function processBookings(bookings: Booking[]): ReportMetrics {
  // ─────────────────────────────────────────────
  // 1. ESTRUCTURAS BASE (AGREGADORES)
  // ─────────────────────────────────────────────
  const vehicleMap = new Map<number, VehicleStats>();
  const dailyMap = new Map<
    string,
    { services: number; production: number; distanceKm: number }
  >();
  const clientMap = new Map<
    string,
    { name: string; services: number; production: number }
  >();
  const zoneMap = new Map<
    string,
    { name: string; pickups: number; dropoffs: number; production: number }
  >();
  const zoneProdMap = new Map<string, number>();
  const paymentMap = new Map<string, number>();
  const hourMap = new Array(24).fill(0);

  // IDs de apoyo externo
  const idsApoyo = [300, 241];

  // ─────────────────────────────────────────────
  // 2. ACUMULADORES GLOBALES
  // ─────────────────────────────────────────────
  let totalExtraCost = 0;
  let totalDispatchTimeMin = 0;
  let totalOnTimeDiffMin = 0;
  let totalWaitingMinGlobal = 0;

  let completedCount = 0;

  let serviciosApoyo = 0;
  let montoApoyo = 0;

  // ─────────────────────────────────────────────
  // 3. LOOP PRINCIPAL (1 sola pasada)
  // ─────────────────────────────────────────────
  bookings.forEach((b) => {
    const cost = b.pricing?.cost ?? 0;
    const km =
      b.pricing?.gpsMeterDistance ??
      b.pricing?.meterDistance?.asKilometres ??
      0;

    const extra = b.pricing?.extraCost ?? 0;
    const wait = b.pricing?.waitingTime ?? 0;

    const date = b.pickupDueTime?.slice(0, 10);
    const hour = Number(b.pickupDueTime?.slice(11, 13) ?? 0);

    const clientName = b.customerDisplayName || "Sin cuenta";
    const paymentMethod = b.paymentType || b.paymentMethod || "Unknown";

    const isCompleted =
      b.archivedBooking?.reason?.toLowerCase() === "completed";

    const vehicleId = b.archivedBooking?.vehicle?.id;

    // ───── APOYO EXTERNO ─────
    if (vehicleId && idsApoyo.includes(vehicleId)) {
      serviciosApoyo++;
      montoApoyo += cost;
    }

    // ───── KPIs BASE ─────
    totalExtraCost += extra;
    totalWaitingMinGlobal += wait;

    if (isCompleted) completedCount++;
    if (hour >= 0 && hour < 24) hourMap[hour]++;

    // ───── VEHÍCULOS ─────
    const vehicle = b.archivedBooking?.vehicle;
    if (vehicle) {
      if (!vehicleMap.has(vehicle.id)) {
        vehicleMap.set(vehicle.id, {
          vehicleId: vehicle.id,
          callsign: vehicle.callsign,
          totalServices: 0,
          totalProduction: 0,
          totalDistanceKm: 0,
          totalWaitingMin: 0,
          totalDurationMin: 0,
          avgTicket: 0,
          avgDurationMin: 0,
          avgDistanceKm: 0,
          efficiency: 0,
          utilization: 0,
        });
      }

      const v = vehicleMap.get(vehicle.id)!;

      let durationMin = 0;
      let dispatchTimeMin = 0;
      let onTimeDiffMin = 0;

      // tiempos
      if (
        b.archivedBooking?.pickedUpAtTime &&
        b.archivedBooking?.completedAtTime
      ) {
        durationMin =
          (new Date(b.archivedBooking.completedAtTime).getTime() -
            new Date(b.archivedBooking.pickedUpAtTime).getTime()) /
          60000;
      }

      if (
        b.archivedBooking?.dispatchedAtTime &&
        b.archivedBooking?.pickedUpAtTime
      ) {
        dispatchTimeMin =
          (new Date(b.archivedBooking.pickedUpAtTime).getTime() -
            new Date(b.archivedBooking.dispatchedAtTime).getTime()) /
          60000;
      }

      if (b.pickupDueTime && b.archivedBooking?.vehicleArrivedAtTime) {
        onTimeDiffMin =
          (new Date(b.archivedBooking.vehicleArrivedAtTime).getTime() -
            new Date(b.pickupDueTime).getTime()) /
          60000;
      }

      v.totalServices++;
      v.totalProduction += cost;
      v.totalDistanceKm += km;
      v.totalWaitingMin += wait;
      v.totalDurationMin += durationMin;

      totalDispatchTimeMin += dispatchTimeMin;
      totalOnTimeDiffMin += onTimeDiffMin;
    }

    // ───── SERIES ─────
    if (date) {
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { services: 0, production: 0, distanceKm: 0 });
      }
      const d = dailyMap.get(date)!;
      d.services++;
      d.production += cost;
      d.distanceKm += km;
    }

    // ───── CLIENTES ─────
    if (!clientMap.has(clientName)) {
      clientMap.set(clientName, {
        name: clientName,
        services: 0,
        production: 0,
      });
    }
    const c = clientMap.get(clientName)!;
    c.services++;
    c.production += cost;

    // ───── PAGOS ─────
    paymentMap.set(paymentMethod, (paymentMap.get(paymentMethod) ?? 0) + 1);

    // ───── ZONAS ─────
    const addZone = (zName: string | undefined, isPickup: boolean) => {
      if (!zName) return;

      if (!zoneMap.has(zName)) {
        zoneMap.set(zName, {
          name: zName,
          pickups: 0,
          dropoffs: 0,
          production: 0,
        });
      }

      const z = zoneMap.get(zName)!;
      isPickup ? z.pickups++ : z.dropoffs++;
      z.production += cost;

      zoneProdMap.set(zName, (zoneProdMap.get(zName) ?? 0) + cost);
    };

    addZone(b.pickup?.address?.zone?.name, true);
    addZone(b.destination?.address?.zone?.name, false);
  });

  // ─────────────────────────────────────────────
  // 4. KPIs CENTRALIZADOS (🔥 AQUÍ TODO JUNTO)
  // ─────────────────────────────────────────────

  const totalServices = bookings.length;

  const vehicles = Array.from(vehicleMap.values()).map((v) => ({
    ...v,
    avgTicket: v.totalServices ? v.totalProduction / v.totalServices : 0,
    avgDistanceKm: v.totalServices ? v.totalDistanceKm / v.totalServices : 0,
    avgDurationMin: v.totalServices ? v.totalDurationMin / v.totalServices : 0,
    efficiency: v.totalServices ? v.totalProduction / v.totalServices : 0,
    utilization: v.totalServices
      ? (v.totalDurationMin / (v.totalServices * 30)) * 100
      : 0,
  }));

  const totalProduction = vehicles.reduce((a, v) => a + v.totalProduction, 0);
  const totalDistanceKm = vehicles.reduce((a, v) => a + v.totalDistanceKm, 0);

  // ───── KPIs NEGOCIO ─────
  const serviciosFlota = totalServices - serviciosApoyo;
  const montoFlota = totalProduction - montoApoyo;
  const porcentajeFlota = totalServices
    ? (serviciosFlota / totalServices) * 100
    : 0;

  const avgUtilization =
    vehicles.length > 0
      ? vehicles.reduce((sum, v) => sum + v.utilization, 0) / vehicles.length
      : 0;

  const avgTicket = totalServices ? totalProduction / totalServices : 0;
  const avgDistanceKm = totalServices ? totalDistanceKm / totalServices : 0;

  const completionRate = totalServices
    ? (completedCount / totalServices) * 100
    : 100;

  const avgDispatchTimeMin = totalServices
    ? totalDispatchTimeMin / totalServices
    : 0;

  const avgOnTimeRate = totalServices ? totalOnTimeDiffMin / totalServices : 0;

  // ─────────────────────────────────────────────
  // 5. RETURN LIMPIO
  // ─────────────────────────────────────────────
  return {
    totalProduction,
    totalServices,
    totalDistanceKm,

    avgTicket,
    avgDistanceKm,

    totalExtraCost,
    totalWaitingMin: totalWaitingMinGlobal,
    totalWaitingHours: Math.round(totalWaitingMinGlobal / 60),

    completionRate,
    avgDispatchTimeMin,
    avgOnTimeRate,

    totalVehicles: vehicles.length,
    avgUtilization: Math.min(avgUtilization, 100),

    // AUTONOMÍA
    serviciosFlota,
    montoFlota,
    porcentajeFlota,
    apoyoCount: serviciosApoyo,
    apoyoPct: totalServices ? (serviciosApoyo / totalServices) * 100 : 0,

    // rankings
    top3Services: [...vehicles]
      .sort((a, b) => b.totalServices - a.totalServices)
      .slice(0, 3),
    top3Production: [...vehicles]
      .sort((a, b) => b.totalProduction - a.totalProduction)
      .slice(0, 3),
    top3Efficiency: [...vehicles]
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 3),
    top3Distance: [...vehicles]
      .sort((a, b) => b.totalDistanceKm - a.totalDistanceKm)
      .slice(0, 3),

    topZoneProduction: Array.from(zoneProdMap.entries())
      .map(([name, production]) => ({ name, production }))
      .sort((a, b) => b.production - a.production)
      .slice(0, 5),

    daily: Array.from(dailyMap.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date)),

    hourly: hourMap.map((count, hour) => ({ hour, count })),

    topClients: Array.from(clientMap.values())
      .sort((a, b) => b.production - a.production)
      .slice(0, 10),

    topZones: Array.from(zoneMap.values())
      .sort((a, b) => b.pickups + b.dropoffs - (a.pickups + a.dropoffs))
      .slice(0, 10),

    paymentMix: Array.from(paymentMap.entries())
      .map(([method, count]) => ({
        method,
        count,
        pct: totalServices ? (count / totalServices) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count),
  };
}

// ─────────────────────────────────────────────
// ROUTE PRINCIPAL
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { from, to } = await req.json();

    if (!from || !to) {
      return NextResponse.json(
        { error: "from y to son requeridos" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const fromFmt = formatDateRange(from, false);
    const toFmt = formatDateRange(to, true);
    const { prevFrom, prevTo } = getPreviousPeriod(from, to);
    const prevFromFmt = formatDateRange(prevFrom, false);
    const prevToFmt = formatDateRange(prevTo, true);

    const [currentBookings, prevBookings] = await Promise.all([
      fetchAllBookings(token, fromFmt, toFmt),
      fetchAllBookings(token, prevFromFmt, prevToFmt),
    ]);

    const current = processBookings(currentBookings);
    const previous = processBookings(prevBookings);

    const delta = {
      production: pctDelta(current.totalProduction, previous.totalProduction),
      services: pctDelta(current.totalServices, previous.totalServices),
      avgTicket: pctDelta(current.avgTicket, previous.avgTicket),
      distanceKm: pctDelta(current.totalDistanceKm, previous.totalDistanceKm),
      utilization: pctDelta(
        current.avgUtilization,
        previous.avgUtilization || 1,
      ),
    };

    return NextResponse.json({
      period: { from, to },
      prevPeriod: { from: prevFrom, to: prevTo },
      current,
      previous: {
        totalProduction: previous.totalProduction,
        totalServices: previous.totalServices,
        avgTicket: previous.avgTicket,
        totalDistanceKm: previous.totalDistanceKm,
        avgUtilization: previous.avgUtilization,
      },
      delta,
      summary: {
        bookingsProcessed: currentBookings.length,
        prevBookingsProcessed: prevBookings.length,
      },
    });
  } catch (error: any) {
    console.error("❌ ERROR REPORTE:", error);
    return NextResponse.json(
      {
        error: "Error generando reporte",
        details: error?.response?.data?.message || error.message,
      },
      { status: error?.response?.status || 500 },
    );
  }
}

function pctDelta(current: number, prev: number): number {
  if (prev === 0) return current > 0 ? 100 : 0;
  return ((current - prev) / prev) * 100;
}
