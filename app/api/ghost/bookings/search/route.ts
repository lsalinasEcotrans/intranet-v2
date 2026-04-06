import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios, { AxiosResponse } from "axios";

// 🔥 Interfaces para tipado correcto
interface BookingSearchRequest {
  from: string;
  to: string;
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

// 🔥 Obtener offset dinámico de Chile (-03:00 o -04:00)
function getChileOffset(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(date);
  const offsetPart = parts.find((p) => p.type === "timeZoneName");
  return offsetPart?.value.replace("GMT", "") || "-03:00";
}

// 🔥 Formato inicio del día
function formatStartOfDay(date: Date): string {
  const offset = getChileOffset(date);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T00:00:00.000${offset}`;
}

// 🔥 Formato fin del día
function formatEndOfDay(date: Date): string {
  const offset = getChileOffset(date);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T23:59:00.999${offset}`;
}

export async function POST(): Promise<NextResponse<ApiResponse | { error: string; details?: unknown }>> {
  try {
    // Obtener token del cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      console.error("❌ Token no encontrado");
      return NextResponse.json(
        { error: "Token no encontrado" },
        { status: 401 }
      );
    }

    // Calcular rango de fechas
    const now = new Date();
    const fromDate = new Date();
    fromDate.setDate(now.getDate() - 6); // Hace 7 días

    const from = formatStartOfDay(fromDate);
    const to = formatEndOfDay(now);

    // 🔥 RECOLECTAR TODOS LOS BOOKINGS CON PAGINACIÓN
    const allBookings: unknown[] = [];
    let continuationToken: string | null = null;
    let pageCount = 0;
    const maxPages = 200; // Seguridad: máximo 100 páginas

    do {
      pageCount++;

      const body: BookingSearchRequest = {
        from,
        to,
        exactMatch: false,
        ignorePostcode: true,
        ignoreTown: true,
        subContractedOnly: false,
        types: ["Completed"],
        companyIds: [],
        continuationToken: continuationToken || null,
      };

      // Hacer solicitud a Ghost API
      const response: AxiosResponse<BookingSearchResponse> = await axios.post(
        "https://ghost-main-static-b7ec98c880a54ad5a4782393902a32a2.ghostapi.app:29003/api/v2/bookings/search",
        body,
        {
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": `Bearer ${token}`,
          },
          timeout: 30000,
        }
      );

      const bookings: unknown[] = response.data.bookings || [];
      const nextToken: string | null = response.data.continuationToken || null;

      allBookings.push(...bookings);

      // 🔥 Actualizar el token correctamente
      continuationToken = nextToken;

      // 🔥 Si no hay más páginas, salir del loop
      if (!continuationToken) {
        break;
      }

      // 🔥 Si alcanzamos el límite de páginas, salir
      if (pageCount >= maxPages) {
        break;
      }

      // Pequeña pausa entre requests para no saturar la API
      await new Promise((resolve) => setTimeout(resolve, 100));
    } while (continuationToken);


    // 🔥 Retornar todos los bookings
    const apiResponse: ApiResponse = {
      bookings: allBookings,
      totalPages: pageCount,
      totalBookings: allBookings.length,
      hasMore: false,
    };

    return NextResponse.json(apiResponse);
  } catch (err: unknown) {
    console.error("❌ ERROR EN BOOKINGS/SEARCH:");

    const axiosError = err as { response?: { status?: number; data?: unknown }; message?: string };

    if (axiosError.response) {
      console.error("Status:", axiosError.response.status);
      console.error("Data:", axiosError.response.data);
    } else {
      console.error("Message:", axiosError.message);
    }

    return NextResponse.json(
      {
        error: "Error al obtener bookings",
        details: axiosError.response?.data || axiosError.message,
      },
      { status: (axiosError.response?.status as number) || 500 }
    );
  }
}