import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios, { AxiosResponse } from "axios";

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
interface BookingSearchRequest {
  from: string;
  to: string;
  vehicleId?: number;
  exactMatch: boolean;
  ignorePostcode: boolean;
  ignoreTown: boolean;
  subContractedOnly: boolean;
  types: string[];
  companyIds: unknown[];
  continuationToken: string | null;
}

interface BookingSearchResponse {
  bookings: unknown[];
  continuationToken?: string | null;
}

interface ApiResponse {
  bookings: unknown[];
  totalPages: number;
  totalBookings: number;
  hasMore: boolean;
  periodFrom: string;
  periodTo: string;
}

// ─────────────────────────────────────────────
// OFFSET CHILE
// ─────────────────────────────────────────────
function getChileOffset(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(date);
  const offsetPart = parts.find((p) => p.type === "timeZoneName");
  return offsetPart?.value.replace("GMT", "") || "-03:00";
}

function formatDateLocal(date: Date) {
  const yyyy = date.getFullYear();
  const mm   = String(date.getMonth() + 1).padStart(2, "0");
  const dd   = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatStartOfDay(date: Date): string {
  return `${formatDateLocal(date)}T00:00:00.000${getChileOffset(date)}`;
}

function formatEndOfDay(date: Date): string {
  return `${formatDateLocal(date)}T23:59:59.999${getChileOffset(date)}`;
}

// ─────────────────────────────────────────────
// PERÍODO DE FACTURACIÓN: día 16 del mes anterior → día 15 del mes actual
//
// Ejemplos:
//   hoy = 10 Mar  → from = 16 Feb  · to = 15 Mar
//   hoy = 20 Mar  → from = 16 Feb  · to = 15 Mar
//   hoy = 16 Mar  → from = 16 Feb  · to = 15 Mar  (el 16 abre el siguiente período)
//   hoy =  1 Abr  → from = 16 Mar  · to = 15 Abr
// ─────────────────────────────────────────────
function getBillingPeriod(): { from: Date; to: Date } {
  const now = new Date();
  const day = now.getDate();

  // Si estamos antes del 16, el período comenzó el 16 del mes anterior
  // Si estamos en el 16 o después, el período comenzó el 16 de este mes
  let fromYear: number;
  let fromMonth: number; // 0-indexed

  if (day < 16) {
    // El período comenzó el 16 del mes anterior
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    fromYear  = prevMonth.getFullYear();
    fromMonth = prevMonth.getMonth();
  } else {
    // El período comenzó el 16 de este mes
    fromYear  = now.getFullYear();
    fromMonth = now.getMonth();
  }

  const from = new Date(fromYear, fromMonth, 16);

  // "to" es siempre el 15 del mes siguiente al fromMonth
  const to = new Date(fromYear, fromMonth + 1, 15);

  return { from, to };
}

// ─────────────────────────────────────────────
// ROUTE
// ─────────────────────────────────────────────
export async function POST(
  req: Request
): Promise<NextResponse<ApiResponse | { error: string; details?: unknown }>> {
  try {
    const bodyReq = await req.json();
    const { vehicleId } = bodyReq;

    if (!vehicleId) {
      return NextResponse.json({ error: "vehicleId requerido" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Token no encontrado" }, { status: 401 });
    }

    // 📅 Período 16 → 15
    const { from: fromDate, to: toDate } = getBillingPeriod();
    const from = formatStartOfDay(fromDate);
    const to   = formatEndOfDay(toDate);

    // ─────────────────────────────────────────
    // PAGINACIÓN
    // ─────────────────────────────────────────
    const allBookings: unknown[] = [];
    let continuationToken: string | null = null;
    let pageCount = 0;
    const maxPages = 100;

    do {
      pageCount++;

      const requestBody: BookingSearchRequest = {
        from,
        to,
        vehicleId,
        exactMatch: false,
        ignorePostcode: true,
        ignoreTown: true,
        subContractedOnly: false,
        types: ["Completed"],
        companyIds: [],
        continuationToken: continuationToken || null,
      };

      const response: AxiosResponse<BookingSearchResponse> = await axios.post(
        "https://ghost-main-static-b7ec98c880a54ad5a4782393902a32a2.ghostapi.app:29003/api/v2/bookings/search",
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": `Bearer ${token}`,
          },
          timeout: 30000,
        }
      );

      const bookings: unknown[] = response.data.bookings || [];
      continuationToken = response.data.continuationToken || null;
      allBookings.push(...bookings);

      if (!continuationToken || pageCount >= maxPages) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    } while (continuationToken);

    return NextResponse.json({
      bookings:      allBookings,
      totalPages:    pageCount,
      totalBookings: allBookings.length,
      hasMore:       false,
      // Devolvemos el período para que el frontend lo muestre
      periodFrom:    from,
      periodTo:      to,
    });
  } catch (err: any) {
    console.error("❌ ERROR EN BOOKINGS/BY-VEHICLE-PERIOD:", err?.response?.data || err);
    return NextResponse.json(
      { error: "Error al obtener bookings del período", details: err?.response?.data || err.message },
      { status: err?.response?.status || 500 }
    );
  }
}