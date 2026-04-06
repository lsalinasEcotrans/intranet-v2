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
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatStartOfDay(date: Date): string {
  const offset = getChileOffset(date);
  const localDate = formatDateLocal(date);
  return `${localDate}T00:00:00.000${offset}`;
}

function formatEndOfDay(date: Date): string {
  const offset = getChileOffset(date);
  const localDate = formatDateLocal(date);
  return `${localDate}T23:59:59.999${offset}`;
}

// ─────────────────────────────────────────────
// ROUTE
// ─────────────────────────────────────────────
export async function POST(
  req: Request
): Promise<
  NextResponse<ApiResponse | { error: string; details?: unknown }>
> {
  try {
    // 📥 BODY
    const bodyReq = await req.json();
    const { vehicleId } = bodyReq;

    if (!vehicleId) {
      return NextResponse.json(
        { error: "vehicleId requerido" },
        { status: 400 }
      );
    }

    // 🔐 TOKEN
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Token no encontrado" },
        { status: 401 }
      );
    }

    // 📅 RANGO (últimos 7 días reales)
    const now = new Date();

    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - 6); // 👈 últimos 7 días incluyendo hoy

    const from = formatStartOfDay(fromDate);
    const to = formatEndOfDay(now);

    // ─────────────────────────────────────────
    // 🔥 PAGINACIÓN
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
        vehicleId: vehicleId ?? undefined,
        exactMatch: false,
        ignorePostcode: true,
        ignoreTown: true,
        subContractedOnly: false,
        types: ["Completed"],
        companyIds: [],
        continuationToken: continuationToken || null,
      };

      const response: AxiosResponse<BookingSearchResponse> =
        await axios.post(
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
      const nextToken: string | null =
        response.data.continuationToken || null;

      allBookings.push(...bookings);
      continuationToken = nextToken;

      if (!continuationToken) break;
      if (pageCount >= maxPages) break;

      await new Promise((resolve) => setTimeout(resolve, 100));
    } while (continuationToken);

    // ─────────────────────────────────────────
    // ✅ RESPUESTA
    // ─────────────────────────────────────────
    const apiResponse: ApiResponse = {
      bookings: allBookings,
      totalPages: pageCount,
      totalBookings: allBookings.length,
      hasMore: false,
    };

    return NextResponse.json(apiResponse);
  } catch (err: any) {
    console.error(
      "❌ ERROR EN BOOKINGS/BY-VEHICLE:",
      err?.response?.data || err
    );

    return NextResponse.json(
      {
        error: "Error al obtener bookings por vehículo",
        details: err?.response?.data || err.message,
      },
      { status: err?.response?.status || 500 }
    );
  }
}